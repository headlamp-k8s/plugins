import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
// import { getCluster } from '@kinvolk/headlamp-plugin/lib/util';
import {
  DateLabel,
  Link,
  SectionBox,
  SectionHeader,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Checkbox } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchLatestAppVersion } from '../../api/charts';
import {
  deleteRelease,
  getActionStatus,
  getReleaseHistory,
  listReleases,
  rollbackRelease,
} from '../../api/releases';
import { BulkActionsToolbar } from './BulkActionsToolbar';
import { BulkDeleteDialog } from './BulkDeleteDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { EditorDialog } from './EditorDialog';
import { ReleaseActionsMenu } from './ReleaseActionsMenu';
import { ReleaseFilters } from './ReleaseFilters';
import { RollbackDialog } from './RollbackDialog';

/** Helm release runtime info (status, timestamps, description). */
interface ReleaseInfo {
  status: string;
  last_deployed: string;
  description?: string;
}

/** Metadata from the Helm chart's Chart.yaml. */
interface ChartMetadata {
  name: string;
  version: string;
  appVersion: string;
  icon?: string;
}

interface Chart {
  metadata: ChartMetadata;
}

/** A single installed Helm release as returned by the list API. */
interface Release {
  name: string;
  namespace: string;
  /** Current revision number; increments on each upgrade or rollback. */
  version: number;
  chart: Chart;
  info: ReleaseInfo;
}

/** Helm history response containing all past revisions for a release. */
interface ReleaseHistory {
  releases: Release[];
}

/** API response shape for the list releases endpoint. */
interface ReleasesResponse {
  releases?: Release[];
}

const DELETE_STATUS_POLLING_INTERVAL = 1000;
const DELETE_STATUS_MAX_RETRIES = 60;
const RELEASE_KEY_DELIMITER = '|:|';

/** Props for the ReleaseList component. fetchReleases can be overridden for testing. */
interface ReleaseListProps {
  fetchReleases?: () => Promise<ReleasesResponse>;
}

/**
 * Creates a unique key for a release by combining namespace and name.
 * Uses a delimiter that is unlikely to appear in Kubernetes resource names.
 * @param namespace - The namespace of the release
 * @param name - The name of the release
 * @returns A unique key string
 */
function createReleaseKey(namespace: string, name: string): string {
  return `${namespace}${RELEASE_KEY_DELIMITER}${name}`;
}

/**
 * Parses a release key back into namespace and name.
 * @param key - The release key to parse
 * @returns Object with namespace and name, or null if invalid
 */
function parseReleaseKey(key: string): { namespace: string; name: string } | null {
  const parts = key.split(RELEASE_KEY_DELIMITER);
  if (parts.length !== 2) {
    console.error(`Invalid release key format: ${key}`);
    return null;
  }
  return { namespace: parts[0], name: parts[1] };
}

/**
 * @returns formatted version string
 * @param v - version string
 */
function formatVersion(v?: string) {
  const s = (v ?? '').trim();

  if (!s || s === '—') {
    return '—';
  }

  return s;
}

/**
 * ReleaseList component displays a list of installed Helm releases.
 *
 * @param props - Component properties.
 * @param [props.fetchReleases=listReleases] - Function to fetch the list of releases.
 * @returns ReleaseList component.
 */
export default function ReleaseList({ fetchReleases = listReleases }: ReleaseListProps) {
  const { t } = useTranslation();
  const [releases, setReleases] = useState<Release[] | null>(null);
  const [latestMap, setLatestMap] = useState<Record<string, string>>({});
  const [nameFilter, setNameFilter] = useState('');
  const [namespaceFilter, setNamespaceFilter] = useState('');
  const [openDeleteAlert, setOpenDeleteAlert] = useState<boolean>(false);
  const [rollbackPopup, setRollbackPopup] = useState<boolean>(false);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [releaseHistory, setReleaseHistory] = useState<ReleaseHistory | null>(null);
  const [revertVersion, setRevertVersion] = useState<string>('1');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdateRelease, setIsUpdateRelease] = useState(false);
  const [refetchCounter, setRefetchCounter] = useState<number>(0);
  const [selectedReleases, setSelectedReleases] = useState<Set<string>>(new Set());
  const [openBulkDeleteAlert, setOpenBulkDeleteAlert] = useState<boolean>(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const deleteStatusTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const bulkDeleteTimeoutsRef = React.useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    fetchReleases()
      .then(response => {
        if (!response.releases) {
          setReleases([]);
          return;
        }
        setReleases(response.releases);
      })
      .catch(error => {
        console.error('Failed to fetch releases:', error);
        enqueueSnackbar('Failed to load releases', { variant: 'error' });
        setReleases([]);
        setLatestMap({});
      });
  }, [refetchCounter, fetchReleases, enqueueSnackbar]);

  useEffect(() => {
    return () => {
      if (deleteStatusTimeoutRef.current) {
        clearTimeout(deleteStatusTimeoutRef.current);
      }
      bulkDeleteTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      bulkDeleteTimeoutsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!releases?.length) {
      setLatestMap({});
      return;
    }

    Promise.all(
      releases.map(async r => {
        const chartName = r?.chart?.metadata?.name;
        const v = chartName ? await fetchLatestAppVersion(chartName).catch(() => '—') : '—';
        return [r.name, v] as const;
      })
    ).then(entries => setLatestMap(Object.fromEntries(entries)));
  }, [releases]);

  const filteredReleases = useMemo(() => {
    if (!releases) return null;

    return releases.filter(release => {
      const matchesName =
        !nameFilter || release.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesNamespace = !namespaceFilter || release.namespace === namespaceFilter;

      return matchesName && matchesNamespace;
    });
  }, [releases, nameFilter, namespaceFilter]);

  const availableNamespaces = useMemo(() => {
    if (!releases) return [];

    const namespaces = new Set(releases.map(r => r.namespace));
    return Array.from(namespaces).sort();
  }, [releases]);

  // Count how many of the currently visible (filtered) releases are selected
  const selectedVisibleCount = useMemo(() => {
    if (!filteredReleases) return 0;
    return filteredReleases.filter(r => selectedReleases.has(createReleaseKey(r.namespace, r.name)))
      .length;
  }, [filteredReleases, selectedReleases]);

  const handleUpgrade = useCallback((release: Release) => {
    setSelectedRelease(release);
    setIsUpdateRelease(true);
    setIsEditorOpen(true);
  }, []);

  const handleRollback = useCallback(
    (release: Release) => {
      setSelectedRelease(release);
      getReleaseHistory(release.namespace, release.name)
        .then(response => {
          setReleaseHistory(response);
          if (response?.releases?.length) {
            setRevertVersion(response.releases[0].version.toString());
          }
          setRollbackPopup(true);
        })
        .catch(error => {
          console.error('Failed to fetch release history:', error);
          enqueueSnackbar('Failed to load release history', { variant: 'error' });
        });
    },
    [enqueueSnackbar]
  );

  const handleDelete = useCallback((release: Release) => {
    setSelectedRelease(release);
    setOpenDeleteAlert(true);
  }, []);

  /**
   * Polls the uninstall action status until the release is confirmed deleted or max retries reached.
   * Closes the delete dialog and shows a snackbar on success or failure.
   */
  const checkDeleteReleaseStatus = useCallback(
    (name: string, namespace: string, retryCount = 0) => {
      if (retryCount >= DELETE_STATUS_MAX_RETRIES) {
        enqueueSnackbar(`Delete status check timeout for ${name}`, { variant: 'error' });
        setIsDeleting(false);
        if (deleteStatusTimeoutRef.current) {
          clearTimeout(deleteStatusTimeoutRef.current);
          deleteStatusTimeoutRef.current = null;
        }
        return;
      }

      getActionStatus(name, 'uninstall')
        .then(response => {
          if (response.status === 'processing') {
            deleteStatusTimeoutRef.current = setTimeout(
              () => checkDeleteReleaseStatus(name, namespace, retryCount + 1),
              DELETE_STATUS_POLLING_INTERVAL
            );
          } else if (response.status !== 'success') {
            const errorDetail =
              typeof response.message === 'string' && response.message.trim()
                ? `: ${response.message.trim()}`
                : '';
            enqueueSnackbar(`Failed to delete release ${name}${errorDetail}`, {
              variant: 'error',
            });
            setIsDeleting(false);
            if (deleteStatusTimeoutRef.current) {
              clearTimeout(deleteStatusTimeoutRef.current);
              deleteStatusTimeoutRef.current = null;
            }
          } else {
            enqueueSnackbar(`Successfully deleted release ${name}`, { variant: 'success' });
            setOpenDeleteAlert(false);
            setIsDeleting(false);
            setRefetchCounter(prev => prev + 1);
            if (deleteStatusTimeoutRef.current) {
              clearTimeout(deleteStatusTimeoutRef.current);
              deleteStatusTimeoutRef.current = null;
            }
          }
        })
        .catch(error => {
          console.error('Failed to check delete status:', error);
          enqueueSnackbar(`Failed to check delete status for ${name}`, { variant: 'error' });
          setIsDeleting(false);
          if (deleteStatusTimeoutRef.current) {
            clearTimeout(deleteStatusTimeoutRef.current);
            deleteStatusTimeoutRef.current = null;
          }
        });
    },
    [enqueueSnackbar, setRefetchCounter]
  );

  /**
   * Initiates release deletion and starts polling checkDeleteReleaseStatus.
   * Keeps the dialog open during polling; closes it on success.
   */
  const handleConfirmDelete = useCallback(() => {
    if (selectedRelease) {
      // Clear any existing timeout to prevent race conditions
      if (deleteStatusTimeoutRef.current) {
        clearTimeout(deleteStatusTimeoutRef.current);
        deleteStatusTimeoutRef.current = null;
      }

      deleteRelease(selectedRelease.namespace, selectedRelease.name)
        .then(() => {
          setIsDeleting(true);
          enqueueSnackbar(`Delete request for release ${selectedRelease.name} accepted`, {
            variant: 'info',
          });
          // Keep dialog open while polling - it will close on success in checkDeleteReleaseStatus
          checkDeleteReleaseStatus(selectedRelease.name, selectedRelease.namespace);
        })
        .catch(error => {
          console.error('Failed to delete release:', error);
          enqueueSnackbar(`Failed to delete release ${selectedRelease.name}`, {
            variant: 'error',
          });
          setIsDeleting(false);
        });
    }
  }, [selectedRelease, enqueueSnackbar, checkDeleteReleaseStatus]);

  /**
   * Initiates a rollback to the selected revision and polls until the operation completes.
   * Closes the rollback dialog immediately; reports progress and result via snackbars.
   */
  const handleConfirmRollback = useCallback(() => {
    if (selectedRelease) {
      const releaseName = selectedRelease.name;
      rollbackRelease(selectedRelease.namespace, releaseName, Number.parseInt(revertVersion, 10))
        .then(() => {
          setRollbackPopup(false);
          enqueueSnackbar(`Rollback in progress for ${releaseName}`, {
            variant: 'info',
          });
          const checkRollbackStatus = (retryCount = 0) => {
            if (retryCount >= DELETE_STATUS_MAX_RETRIES) {
              enqueueSnackbar(`Rollback status check timeout for ${releaseName}`, {
                variant: 'warning',
              });
              setRefetchCounter(prev => prev + 1);
              return;
            }
            getActionStatus(releaseName, 'rollback')
              .then(response => {
                if (response.status === 'success') {
                  enqueueSnackbar(`Rollback successful for ${releaseName}`, {
                    variant: 'success',
                  });
                  setRefetchCounter(prev => prev + 1);
                } else if (response.status === 'failed') {
                  enqueueSnackbar(`Rollback failed for ${releaseName}`, { variant: 'error' });
                  setRefetchCounter(prev => prev + 1);
                } else {
                  setTimeout(
                    () => checkRollbackStatus(retryCount + 1),
                    DELETE_STATUS_POLLING_INTERVAL
                  );
                }
              })
              .catch(() => {
                setTimeout(
                  () => checkRollbackStatus(retryCount + 1),
                  DELETE_STATUS_POLLING_INTERVAL
                );
              });
          };
          checkRollbackStatus();
        })
        .catch(error => {
          console.error('Failed to rollback release:', error);
          setRollbackPopup(false);
          enqueueSnackbar(`Failed to rollback ${releaseName}`, {
            variant: 'error',
          });
        });
    }
  }, [selectedRelease, revertVersion, enqueueSnackbar]);

  const handleSelectRelease = useCallback((releaseName: string, namespace: string) => {
    const key = createReleaseKey(namespace, releaseName);
    setSelectedReleases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!filteredReleases) return;

    const visibleKeys = filteredReleases.map(r => createReleaseKey(r.namespace, r.name));
    const allVisibleSelected = visibleKeys.every(key => selectedReleases.has(key));

    setSelectedReleases(prev => {
      const newSet = new Set(prev);
      if (allVisibleSelected) {
        // Deselect all visible releases
        visibleKeys.forEach(key => newSet.delete(key));
      } else {
        // Select all visible releases (add to existing selection)
        visibleKeys.forEach(key => newSet.add(key));
      }
      return newSet;
    });
  }, [filteredReleases, selectedReleases]);

  /**
   * Polls the releases list until all bulk-deleted releases are no longer present.
   * Retries up to DELETE_STATUS_MAX_RETRIES times with DELETE_STATUS_POLLING_INTERVAL between checks.
   */
  const checkBulkDeleteComplete = useCallback(
    (deletedKeys: string[], retryCount = 0) => {
      if (retryCount >= DELETE_STATUS_MAX_RETRIES) {
        enqueueSnackbar('Bulk delete verification timeout, please refresh the page', {
          variant: 'warning',
        });
        setIsBulkDeleting(false);
        setRefetchCounter(prev => prev + 1);
        return;
      }

      // If releases is null or empty, consider all deletions complete
      if (!releases || releases.length === 0) {
        setIsBulkDeleting(false);
        return;
      }

      // Check if any deleted releases still exist in the list
      const stillExist = deletedKeys.some(key => {
        const parsed = parseReleaseKey(key);
        if (!parsed) return false;
        const release = releases.find(
          r => r.namespace === parsed.namespace && r.name === parsed.name
        );
        return release !== undefined;
      });

      if (stillExist) {
        const outerTimeout = setTimeout(() => {
          setRefetchCounter(prev => prev + 1); // Trigger fetch
          const innerTimeout = setTimeout(() => {
            checkBulkDeleteComplete(deletedKeys, retryCount + 1);
            // Remove executed timeout from tracking array
            bulkDeleteTimeoutsRef.current = bulkDeleteTimeoutsRef.current.filter(
              t => t !== innerTimeout
            );
          }, 500);
          bulkDeleteTimeoutsRef.current.push(innerTimeout);
          // Remove executed timeout from tracking array
          bulkDeleteTimeoutsRef.current = bulkDeleteTimeoutsRef.current.filter(
            t => t !== outerTimeout
          );
        }, DELETE_STATUS_POLLING_INTERVAL);
        bulkDeleteTimeoutsRef.current.push(outerTimeout);
      } else {
        setIsBulkDeleting(false);
      }
    },
    [releases, enqueueSnackbar, setRefetchCounter, setIsBulkDeleting]
  );

  const handleBulkDelete = useCallback(() => {
    setOpenBulkDeleteAlert(true);
  }, []);

  /**
   * Deletes all selected releases in parallel via Promise.allSettled.
   * Reports per-batch success/failure counts, then polls checkBulkDeleteComplete.
   */
  const handleConfirmBulkDelete = useCallback(() => {
    if (selectedReleases.size === 0) return;

    setIsBulkDeleting(true);
    const releasesToDelete = Array.from(selectedReleases)
      .map(key => {
        const parsed = parseReleaseKey(key);
        if (!parsed) return null;
        return { namespace: parsed.namespace, name: parsed.name, key };
      })
      .filter((item): item is { namespace: string; name: string; key: string } => item !== null);

    if (releasesToDelete.length === 0) {
      enqueueSnackbar('No valid releases to delete', { variant: 'error' });
      setIsBulkDeleting(false);
      setOpenBulkDeleteAlert(false);
      return;
    }

    Promise.allSettled(
      releasesToDelete.map(({ namespace, name }) => deleteRelease(namespace, name))
    )
      .then(results => {
        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        const successfullyDeletedKeys = releasesToDelete
          .filter((_, index) => results[index].status === 'fulfilled')
          .map(item => item.key);

        if (failed === 0) {
          enqueueSnackbar(`Successfully initiated deletion of ${succeeded} release(s)`, {
            variant: 'info',
          });
        } else if (succeeded === 0) {
          enqueueSnackbar(`Failed to delete all ${failed} release(s)`, { variant: 'error' });
          setIsBulkDeleting(false);
          setOpenBulkDeleteAlert(false);
          setSelectedReleases(new Set());
          return;
        } else {
          enqueueSnackbar(`Initiated deletion of ${succeeded} release(s), failed ${failed}`, {
            variant: 'warning',
          });
        }

        setOpenBulkDeleteAlert(false);
        setSelectedReleases(new Set());

        if (successfullyDeletedKeys.length > 0) {
          setRefetchCounter(prev => prev + 1);
          const initialTimeout = setTimeout(
            () => checkBulkDeleteComplete(successfullyDeletedKeys),
            DELETE_STATUS_POLLING_INTERVAL
          );
          bulkDeleteTimeoutsRef.current.push(initialTimeout);
        } else {
          setIsBulkDeleting(false);
        }
      })
      .catch(error => {
        console.error('Unexpected error in bulk delete:', error);
        enqueueSnackbar('Unexpected error during bulk deletion', { variant: 'error' });
        setIsBulkDeleting(false);
        setOpenBulkDeleteAlert(false);
      });
  }, [selectedReleases, enqueueSnackbar, checkBulkDeleteComplete]);

  return (
    <>
      {selectedRelease && (
        <EditorDialog
          isUpdateRelease={isUpdateRelease}
          openEditor={isEditorOpen}
          handleEditor={open => setIsEditorOpen(open)}
          release={selectedRelease}
          releaseName={selectedRelease.name}
          releaseNamespace={selectedRelease.namespace}
          handleUpdate={() => setRefetchCounter(prev => prev + 1)}
        />
      )}
      <DeleteConfirmDialog
        open={openDeleteAlert}
        isDeleting={isDeleting}
        releaseName={selectedRelease?.name}
        onClose={() => setOpenDeleteAlert(false)}
        onConfirm={handleConfirmDelete}
      />
      <RollbackDialog
        open={rollbackPopup}
        releaseHistory={releaseHistory}
        revertVersion={revertVersion}
        onVersionChange={setRevertVersion}
        onConfirm={handleConfirmRollback}
        onCancel={() => setRollbackPopup(false)}
      />
      <SectionHeader
        title={t('Installed')}
        actions={[
          <ReleaseFilters
            key="filters"
            nameFilter={nameFilter}
            namespaceFilter={namespaceFilter}
            availableNamespaces={availableNamespaces}
            onNameFilterChange={setNameFilter}
            onNamespaceFilterChange={setNamespaceFilter}
          />,
        ]}
      />
      <SectionBox>
        <BulkActionsToolbar selectedCount={selectedReleases.size} onDelete={handleBulkDelete} />
        <BulkDeleteDialog
          open={openBulkDeleteAlert}
          count={selectedReleases.size}
          isDeleting={isBulkDeleting}
          onClose={() => setOpenBulkDeleteAlert(false)}
          onConfirm={handleConfirmBulkDelete}
        />
        <SimpleTable
          columns={[
            {
              label: '',
              header: (
                <Checkbox
                  size="small"
                  checked={
                    filteredReleases
                      ? filteredReleases.length > 0 &&
                        selectedVisibleCount === filteredReleases.length
                      : false
                  }
                  indeterminate={
                    filteredReleases
                      ? selectedVisibleCount > 0 && selectedVisibleCount < filteredReleases.length
                      : false
                  }
                  onChange={handleSelectAll}
                  aria-label="Select all releases"
                />
              ),
              gridTemplate: 'min-content',
              getter: (release: Release) => {
                const key = createReleaseKey(release.namespace, release.name);
                const isSelected = selectedReleases.has(key);
                return (
                  <Checkbox
                    size="small"
                    checked={isSelected}
                    onChange={() => handleSelectRelease(release.name, release.namespace)}
                    aria-label={`Select ${release.name}`}
                  />
                );
              },
            },
            {
              label: t('Name'),
              getter: release => (
                <Box display="flex" alignItems="center">
                  {release.chart.metadata.icon && (
                    <Box>
                      <img
                        width={50}
                        src={release.chart.metadata.icon}
                        alt={release.chart.metadata.name}
                      />
                    </Box>
                  )}
                  <Box ml={1}>
                    <Link
                      routeName="/helm/:namespace/releases/:releaseName"
                      params={{ releaseName: release.name, namespace: release.namespace }}
                    >
                      {release.name}
                    </Link>
                  </Box>
                </Box>
              ),
            },
            {
              label: t('Namespace'),
              getter: release => release.namespace,
            },
            {
              label: t('Current Version'),
              getter: release => formatVersion(release.chart.metadata.appVersion),
            },
            {
              label: t('Latest Version'),
              getter: release => formatVersion(latestMap[release?.name]),
            },
            {
              label: t('Version'),
              getter: release => release.version,
              sort: true,
            },
            {
              label: t('Status'),
              getter: release => (
                <StatusLabel status={release.info.status === 'deployed' ? 'success' : 'error'}>
                  {release.info.status}
                </StatusLabel>
              ),
            },
            {
              label: t('Updated'),
              getter: release => <DateLabel date={release.info.last_deployed} format="mini" />,
            },
            {
              label: t('Actions'),
              gridTemplate: 'min-content',
              getter: (release: Release) => (
                <ReleaseActionsMenu
                  release={release}
                  onUpgrade={handleUpgrade}
                  onRollback={handleRollback}
                  onDelete={handleDelete}
                />
              ),
            },
          ]}
          data={filteredReleases}
        />
      </SectionBox>
    </>
  );
}

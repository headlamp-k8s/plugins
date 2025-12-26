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

interface ReleaseInfo {
  status: string;
  last_deployed: string;
  description?: string;
}

interface ChartMetadata {
  name: string;
  version: string;
  appVersion: string;
  icon?: string;
}

interface Chart {
  metadata: ChartMetadata;
}

interface Release {
  name: string;
  namespace: string;
  version: number;
  chart: Chart;
  info: ReleaseInfo;
}

interface ReleaseHistory {
  releases: Release[];
}

interface ReleasesResponse {
  releases?: Release[];
}

const DELETE_STATUS_POLLING_INTERVAL = 1000;

interface ReleaseListProps {
  fetchReleases?: () => Promise<ReleasesResponse>;
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
  const [update, setUpdate] = useState<boolean>(false);
  const [selectedReleases, setSelectedReleases] = useState<Set<string>>(new Set());
  const [openBulkDeleteAlert, setOpenBulkDeleteAlert] = useState<boolean>(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const deleteStatusTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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
      });
  }, [update, fetchReleases, enqueueSnackbar]);

  useEffect(() => {
    return () => {
      if (deleteStatusTimeoutRef.current) {
        clearTimeout(deleteStatusTimeoutRef.current);
      }
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

  const checkDeleteReleaseStatus = useCallback(
    (name: string, namespace: string) => {
      getActionStatus(name, 'uninstall')
        .then(response => {
          if (response.status === 'processing') {
            deleteStatusTimeoutRef.current = setTimeout(
              () => checkDeleteReleaseStatus(name, namespace),
              DELETE_STATUS_POLLING_INTERVAL
            );
          } else if (response.status !== 'success') {
            enqueueSnackbar(`Failed to delete release ${name}: ${response.message}`, {
              variant: 'error',
            });
            setIsDeleting(false);
          } else {
            enqueueSnackbar(`Successfully deleted release ${name}`, { variant: 'success' });
            setOpenDeleteAlert(false);
            setIsDeleting(false);
            setUpdate(prev => !prev);
          }
        })
        .catch(error => {
          console.error('Failed to check delete status:', error);
          enqueueSnackbar(`Failed to check delete status for ${name}`, { variant: 'error' });
          setIsDeleting(false);
          if (deleteStatusTimeoutRef.current) {
            clearTimeout(deleteStatusTimeoutRef.current);
          }
        });
    },
    [enqueueSnackbar]
  );

  const handleConfirmDelete = useCallback(() => {
    if (selectedRelease) {
      deleteRelease(selectedRelease.namespace, selectedRelease.name)
        .then(() => {
          setIsDeleting(true);
          enqueueSnackbar(`Delete request for release ${selectedRelease.name} accepted`, {
            variant: 'info',
          });
          setOpenDeleteAlert(false);
          checkDeleteReleaseStatus(selectedRelease.name, selectedRelease.namespace);
        })
        .catch(error => {
          console.error('Failed to delete release:', error);
          enqueueSnackbar(`Failed to delete release ${selectedRelease.name}`, {
            variant: 'error',
          });
        });
    }
  }, [selectedRelease, enqueueSnackbar, checkDeleteReleaseStatus]);

  const handleConfirmRollback = useCallback(() => {
    if (selectedRelease) {
      rollbackRelease(selectedRelease.namespace, selectedRelease.name, revertVersion)
        .then(() => {
          setRollbackPopup(false);
          enqueueSnackbar(`Rollback successful for ${selectedRelease.name}`, {
            variant: 'success',
          });
          setUpdate(prev => !prev);
        })
        .catch(error => {
          console.error('Failed to rollback release:', error);
          enqueueSnackbar(`Failed to rollback ${selectedRelease.name}`, {
            variant: 'error',
          });
        });
    }
  }, [selectedRelease, revertVersion, enqueueSnackbar]);

  const handleSelectRelease = useCallback((releaseName: string, namespace: string) => {
    const key = `${namespace}/${releaseName}`;
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

    setSelectedReleases(prev => {
      if (prev.size === filteredReleases.length) {
        return new Set();
      } else {
        const allKeys = filteredReleases.map(r => `${r.namespace}/${r.name}`);
        return new Set(allKeys);
      }
    });
  }, [filteredReleases]);

  const handleBulkDelete = useCallback(() => {
    setOpenBulkDeleteAlert(true);
  }, []);

  const handleConfirmBulkDelete = useCallback(() => {
    if (selectedReleases.size === 0 || !releases) return;

    setIsBulkDeleting(true);
    const releasesToDelete = Array.from(selectedReleases).map(key => {
      const [namespace, name] = key.split('/');
      return { namespace, name };
    });

    Promise.all(releasesToDelete.map(({ namespace, name }) => deleteRelease(namespace, name)))
      .then(() => {
        enqueueSnackbar(
          `Successfully initiated deletion of ${releasesToDelete.length} release(s)`,
          { variant: 'info' }
        );
        setOpenBulkDeleteAlert(false);
        setSelectedReleases(new Set());
        setIsBulkDeleting(false);
        setUpdate(prev => !prev);
      })
      .catch(error => {
        console.error('Failed to delete releases:', error);
        enqueueSnackbar('Failed to delete some releases', { variant: 'error' });
        setIsBulkDeleting(false);
      });
  }, [selectedReleases, releases, enqueueSnackbar]);

  return (
    <>
      <EditorDialog
        isUpdateRelease={isUpdateRelease}
        openEditor={isEditorOpen}
        handleEditor={open => setIsEditorOpen(open)}
        release={selectedRelease}
        releaseName={selectedRelease?.name}
        releaseNamespace={selectedRelease?.namespace}
        handleUpdate={() => setUpdate(prev => !prev)}
      />
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
        title="Installed"
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
                        selectedReleases.size === filteredReleases.length
                      : false
                  }
                  indeterminate={
                    filteredReleases
                      ? selectedReleases.size > 0 && selectedReleases.size < filteredReleases.length
                      : false
                  }
                  onChange={handleSelectAll}
                />
              ),
              gridTemplate: 'min-content',
              getter: (release: Release) => {
                const key = `${release.namespace}/${release.name}`;
                const isSelected = selectedReleases.has(key);
                return (
                  <Checkbox
                    size="small"
                    checked={isSelected}
                    onChange={() => handleSelectRelease(release.name, release.namespace)}
                  />
                );
              },
            },
            {
              label: 'Name',
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
              label: 'Namespace',
              getter: release => release.namespace,
            },
            {
              label: 'Current Version',
              getter: release => formatVersion(release.chart.metadata.appVersion),
            },
            {
              label: 'Latest Version',
              getter: release => formatVersion(latestMap[release?.name]),
            },
            {
              label: 'Version',
              getter: release => release.version,
              sort: true,
            },
            {
              label: 'Status',
              getter: release => (
                <StatusLabel status={release.info.status === 'deployed' ? 'success' : 'error'}>
                  {release.info.status}
                </StatusLabel>
              ),
            },
            {
              label: 'Updated',
              getter: release => <DateLabel date={release.info.last_deployed} format="mini" />,
            },
            {
              label: 'Actions',
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

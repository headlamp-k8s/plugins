import { Router, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  ActionButton,
  DateLabel,
  Dialog,
  NameValueTable,
  SectionBox,
  SectionHeader,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Button, DialogActions, DialogContent, DialogContentText } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router';
import {
  deleteRelease,
  getActionStatus,
  getRelease,
  getReleaseHistory,
  rollbackRelease,
} from '../../api/releases';
import { EditorDialog } from './EditorDialog';
import { RollbackDialog } from './RollbackDialog';

const { createRouteURL } = Router;
const DELETE_STATUS_POLLING_INTERVAL = 1000;
const DELETE_STATUS_MAX_RETRIES = 60;

export default function ReleaseDetail() {
  const { t } = useTranslation();
  const [update, setUpdate] = useState<boolean>(false);
  const { namespace, releaseName } = useParams<{ namespace: string; releaseName: string }>();
  const [release, setRelease] = useState<any>(null);
  const [releaseHistory, setReleaseHistory] = useState<any>(null);
  const [openDeleteAlert, setOpenDeleteAlert] = useState<boolean>(false);
  const [rollbackPopup, setRollbackPopup] = useState<boolean>(false);
  const [revertVersion, setRevertVersion] = useState<string>('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdateRelease, setIsUpdateRelease] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const history = useHistory();

  useEffect(() => {
    getRelease(namespace, releaseName).then(response => {
      setRelease(response);
    });
  }, [update]);

  useEffect(() => {
    getReleaseHistory(namespace, releaseName).then(response => {
      setReleaseHistory(response);
      if (response?.releases?.length) {
        setRevertVersion(response.releases[0].version.toString());
      }
    });
  }, [update]);

  function checkDeleteReleaseStatus(name: string) {
    getActionStatus(name, 'uninstall').then(response => {
      if (response.status === 'processing') {
        setTimeout(() => checkDeleteReleaseStatus(name), 1000);
      } else if (response.status !== 'success') {
        enqueueSnackbar(
          t('Failed to delete release {{ name }}{{ message }}', {
            name,
            message: response.message,
          }),
          {
            variant: 'error',
          }
        );
      } else {
        enqueueSnackbar(t('Successfully deleted release {{ name }}', { name }), {
          variant: 'success',
        });
        setOpenDeleteAlert(false);
        history.replace(createRouteURL('/apps/installed'));
        setIsDeleting(false);
      }
    });
  }

  function updateReleaseHandler() {
    setIsEditorOpen(true);
    setIsUpdateRelease(true);
  }

  const handleConfirmRollback = useCallback(() => {
    if (release) {
      rollbackRelease(release.namespace, releaseName, Number.parseInt(revertVersion, 10))
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
              setUpdate(prev => !prev);
              return;
            }
            getActionStatus(releaseName, 'rollback')
              .then(response => {
                if (response.status === 'success') {
                  enqueueSnackbar(`Rollback successful for ${releaseName}`, {
                    variant: 'success',
                  });
                  setUpdate(prev => !prev);
                } else if (response.status === 'failed') {
                  enqueueSnackbar(`Rollback failed for ${releaseName}`, { variant: 'error' });
                  setUpdate(prev => !prev);
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
  }, [release, releaseName, revertVersion, enqueueSnackbar]);

  return (
    <>
      <EditorDialog
        isUpdateRelease={isUpdateRelease}
        openEditor={isEditorOpen}
        handleEditor={open => setIsEditorOpen(open)}
        release={release}
        releaseName={release?.name}
        releaseNamespace={release?.namespace}
        handleUpdate={() => setUpdate(!update)}
      />
      <Dialog
        open={openDeleteAlert}
        maxWidth="sm"
        onClose={() => setOpenDeleteAlert(false)}
        title={t('Uninstall App')}
      >
        <DialogContent>
          <DialogContentText>
            {t('Are you sure you want to uninstall this release?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteAlert(false)}>
            {isDeleting ? t('Close') : t('No')}
          </Button>
          <Button
            disabled={isDeleting}
            onClick={() => {
              deleteRelease(namespace, releaseName).then(() => {
                setIsDeleting(true);
                enqueueSnackbar(
                  t('Delete request for release {{ releaseName }} accepted', { releaseName }),
                  {
                    variant: 'info',
                  }
                );
                setOpenDeleteAlert(false);
                checkDeleteReleaseStatus(releaseName);
              });
            }}
          >
            {isDeleting ? t('Deleting') : t('Yes')}
          </Button>
        </DialogActions>
      </Dialog>
      <RollbackDialog
        open={rollbackPopup}
        releaseHistory={releaseHistory}
        revertVersion={revertVersion}
        onVersionChange={setRevertVersion}
        onConfirm={handleConfirmRollback}
        onCancel={() => setRollbackPopup(false)}
        disabled={!revertVersion}
      />

      {release && (
        <SectionBox
          backLink={createRouteURL('Releases')}
          title={
            <SectionHeader
              title={t('App: {{ name }}', { name: release.name })}
              actions={[
                <ActionButton
                  description={t('Values')}
                  onClick={() => {
                    setIsUpdateRelease(false);
                    setIsEditorOpen(true);
                  }}
                  icon="mdi:file-document-box-outline"
                />,
                <ActionButton
                  description={t('Upgrade')}
                  onClick={() => updateReleaseHandler()}
                  icon="mdi:arrow-up-bold"
                />,
                <ActionButton
                  description={t('Rollback')}
                  onClick={() => setRollbackPopup(true)}
                  icon="mdi:undo"
                  iconButtonProps={{ disabled: release.version === 1 }}
                />,
                <ActionButton
                  description={t('Delete')}
                  onClick={() => setOpenDeleteAlert(true)}
                  icon="mdi:delete"
                />,
              ]}
            />
          }
        >
          <NameValueTable
            rows={[
              {
                name: t('Name'),
                value: release.name,
              },
              {
                name: t('Namespace'),
                value: release.namespace,
              },
              {
                name: t('Revisions'),
                value: release.version,
              },
              {
                name: t('Chart Version'),
                value: release.chart.metadata.version,
              },
              {
                name: t('App Version'),
                value: release.chart.metadata.appVersion,
              },
              {
                name: t('Status'),
                value: (
                  <StatusLabel status={release?.info.status === 'deployed' ? 'success' : 'error'}>
                    {release?.info.status}
                  </StatusLabel>
                ),
              },
            ]}
          />
        </SectionBox>
      )}

      {releaseHistory && (
        <SectionBox title={t('History')}>
          <SimpleTable
            data={
              releaseHistory === null
                ? null
                : [...releaseHistory.releases].sort((a, b) => b.version - a.version)
            }
            defaultSortingColumn={1}
            columns={[
              {
                label: t('Revision'),
                getter: data => data.version,
                sort: (n1, n2) => n2.version - n1.version,
              },
              {
                label: t('Description'),
                getter: data => data.info.description,
              },
              {
                label: t('Status'),
                getter: data => (
                  <StatusLabel status={release?.info.status === 'deployed' ? 'success' : 'error'}>
                    {data.info.status}
                  </StatusLabel>
                ),
              },
              {
                label: t('Chart'),
                getter: data => data.chart.metadata.name,
              },
              {
                label: t('App Version'),
                getter: data => data.chart.metadata.appVersion,
              },
              {
                label: t('Updated'),
                // Key by the deploy timestamp (epoch) so TimeAgo remounts when the value
                // changes, instead of showing a reused row's stale age after a re-sort.
                getter: data => {
                  const deployedAt = new Date(data.info.last_deployed).getTime();
                  return <DateLabel key={deployedAt} date={deployedAt} format="mini" />;
                },
              },
            ]}
          />
        </SectionBox>
      )}
    </>
  );
}

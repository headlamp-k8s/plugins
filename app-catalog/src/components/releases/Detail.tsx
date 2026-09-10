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
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router';
import {
  deleteRelease,
  getActionStatus,
  getRelease,
  getReleaseHistory,
  rollbackRelease,
} from '../../api/releases';
import { EditorDialog } from './EditorDialog';
import { RevisionDiffDialog } from './RevisionDiffDialog';
import { RevisionValuesDialog } from './RevisionValuesDialog';

const { createRouteURL } = Router;
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
  const [isValuesDialogOpen, setIsValuesDialogOpen] = useState<boolean>(false);
  const [selectedRevisionForValues, setSelectedRevisionForValues] = useState<any | null>(null);
  const [isDiffDialogOpen, setIsDiffDialogOpen] = useState<boolean>(false);
  const [diffBaseVersion, setDiffBaseVersion] = useState<number | undefined>(undefined);
  const [diffTargetVersion, setDiffTargetVersion] = useState<number | undefined>(undefined);
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
      if (response?.releases?.length && !revertVersion) {
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
      <Dialog
        open={rollbackPopup}
        maxWidth="xs"
        onClose={() => setRollbackPopup(false)}
        title={t('Rollback')}
      >
        <DialogContent
          style={{
            width: '400px',
            height: '100px',
          }}
        >
          <InputLabel id="revert">{t('Select a version')}</InputLabel>
          <Select
            value={revertVersion}
            defaultValue={releaseHistory?.releases[0]?.version}
            onChange={event => setRevertVersion(event.target.value as string)}
            id="revert"
            fullWidth
          >
            {releaseHistory &&
              releaseHistory.releases.map((rel: any) => {
                return (
                  <MenuItem key={rel?.version} value={rel?.version?.toString()}>
                    {rel?.version} - {rel?.info?.description || 'N/A'} (
                    {new Date(rel?.info.last_deployed).toLocaleString()})
                  </MenuItem>
                );
              })}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button
            disabled={!revertVersion}
            onClick={() => {
              rollbackRelease(
                release.namespace,
                release.name,
                Number.parseInt(revertVersion, 10)
              ).then(() => {
                setRollbackPopup(false);
                setUpdate(!update);
              });
            }}
            style={{
              backgroundColor: '#000',
              color: 'white',
              textTransform: 'none',
            }}
          >
            {t('Revert')}
          </Button>
          <Button
            style={{
              backgroundColor: '#000',
              color: 'white',
              textTransform: 'none',
            }}
            onClick={() => setRollbackPopup(false)}
          >
            {t('Cancel')}
          </Button>
        </DialogActions>
      </Dialog>

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
                  onClick={() => {
                    if (releaseHistory?.releases?.length) {
                      setRevertVersion(releaseHistory.releases[0].version.toString());
                    }
                    setRollbackPopup(true);
                  }}
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
        <SectionBox
          title={
            <SectionHeader
              title={t('History')}
              actions={[
                <ActionButton
                  description={t('Compare Revisions')}
                  onClick={() => {
                    const sorted = [...releaseHistory.releases].sort(
                      (a: any, b: any) => b.version - a.version
                    );
                    setDiffTargetVersion(sorted[0]?.version);
                    setDiffBaseVersion(sorted.length > 1 ? sorted[1]?.version : sorted[0]?.version);
                    setIsDiffDialogOpen(true);
                  }}
                  icon="mdi:compare"
                  iconButtonProps={{ disabled: releaseHistory.releases?.length < 2 }}
                />,
              ]}
            />
          }
        >
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
                getter: data => data.info?.description || 'N/A',
              },
              {
                label: t('Status'),
                getter: data => (
                  <StatusLabel status={data?.info?.status === 'deployed' ? 'success' : 'error'}>
                    {data.info?.status}
                  </StatusLabel>
                ),
              },
              {
                label: t('Chart'),
                getter: data => data.chart?.metadata?.name,
              },
              {
                label: t('App Version'),
                getter: data => data.chart?.metadata?.appVersion,
              },
              {
                label: t('Updated'),
                // Key by the deploy timestamp (epoch) so TimeAgo remounts when the value
                // changes, instead of showing a reused row's stale age after a re-sort.
                getter: data => {
                  const deployedAt = new Date(data.info?.last_deployed).getTime();
                  return <DateLabel key={deployedAt} date={deployedAt} format="mini" />;
                },
              },
              {
                label: t('Actions'),
                getter: data => (
                  <Box display="flex" gap={1}>
                    <ActionButton
                      description={t('View Values')}
                      onClick={() => {
                        setSelectedRevisionForValues(data);
                        setIsValuesDialogOpen(true);
                      }}
                      icon="mdi:file-document-box-outline"
                    />
                    <ActionButton
                      description={t('Compare with current')}
                      onClick={() => {
                        setDiffBaseVersion(data.version);
                        setDiffTargetVersion(release?.version);
                        setIsDiffDialogOpen(true);
                      }}
                      icon="mdi:compare"
                      iconButtonProps={{ disabled: data.version === release?.version }}
                    />
                  </Box>
                ),
              },
            ]}
          />
        </SectionBox>
      )}

      <RevisionValuesDialog
        open={isValuesDialogOpen}
        onClose={() => {
          setIsValuesDialogOpen(false);
          setSelectedRevisionForValues(null);
        }}
        releaseName={releaseName}
        releaseNamespace={namespace}
        revision={selectedRevisionForValues}
      />

      <RevisionDiffDialog
        open={isDiffDialogOpen}
        onClose={() => setIsDiffDialogOpen(false)}
        releaseName={releaseName}
        releaseNamespace={namespace}
        releases={releaseHistory?.releases || []}
        initialBaseVersion={diffBaseVersion}
        initialTargetVersion={diffTargetVersion}
      />
    </>
  );
}

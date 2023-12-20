import { Router } from '@kinvolk/headlamp-plugin/lib';
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

const { createRouteURL } = Router;
export default function ReleaseDetail() {
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
    });
  }, [update]);

  function checkDeleteReleaseStatus(name: string) {
    getActionStatus(name, 'uninstall').then(response => {
      if (response.status === 'processing') {
        setTimeout(() => checkDeleteReleaseStatus(name), 1000);
      } else if (response.status !== 'success') {
        enqueueSnackbar(`Failed to delete release ${name}` + response.message, {
          variant: 'error',
        });
      } else {
        enqueueSnackbar(`Successfully deleted release ${name}`, { variant: 'success' });
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
        title="Uninstall App"
      >
        <DialogContent>
          <DialogContentText>Are you sure you want to uninstall this release?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteAlert(false)}>{isDeleting ? 'Close' : 'No'}</Button>
          <Button
            disabled={isDeleting}
            onClick={() => {
              deleteRelease(namespace, releaseName).then(() => {
                setIsDeleting(true);
                enqueueSnackbar(`Delete request for release ${releaseName} accepted`, {
                  variant: 'info',
                });
                setOpenDeleteAlert(false);
                checkDeleteReleaseStatus(releaseName);
              });
            }}
          >
            {isDeleting ? 'Deleting' : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={rollbackPopup}
        maxWidth="xs"
        onClose={() => setRollbackPopup(false)}
        title="Rollback"
      >
        <DialogContent
          style={{
            width: '400px',
            height: '100px',
          }}
        >
          <InputLabel id="revert">Select a version</InputLabel>
          <Select
            value={revertVersion}
            defaultValue={releaseHistory?.releases[0]?.version}
            onChange={event => setRevertVersion(event.target.value as string)}
            id="revert"
            fullWidth
          >
            {releaseHistory &&
              releaseHistory.releases.map((release: any) => {
                return (
                  <MenuItem value={release?.version}>
                    {release?.version} . {release?.info.description}
                  </MenuItem>
                );
              })}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              rollbackRelease(release.namespace, release.name, revertVersion).then(() => {
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
            Revert
          </Button>
          <Button
            style={{
              backgroundColor: '#000',
              color: 'white',
              textTransform: 'none',
            }}
            onClick={() => setRollbackPopup(false)}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {release && (
        <SectionBox
          backLink={createRouteURL('Releases')}
          title={
            <SectionHeader
              title={`App: ${release.name}`}
              actions={[
                <ActionButton
                  description={'Values'}
                  onClick={() => {
                    setIsUpdateRelease(false);
                    setIsEditorOpen(true);
                  }}
                  icon="mdi:file-document-box-outline"
                />,
                <ActionButton
                  description={'Upgrade'}
                  onClick={() => updateReleaseHandler()}
                  icon="mdi:arrow-up-bold"
                />,
                <ActionButton
                  description={'Rollback'}
                  onClick={() => setRollbackPopup(true)}
                  icon="mdi:undo"
                  iconButtonProps={{ disabled: release.version === 1 }}
                />,
                <ActionButton
                  description={'Delete'}
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
                name: 'Name',
                value: release.name,
              },
              {
                name: 'Namespace',
                value: release.namespace,
              },
              {
                name: 'Revisions',
                value: release.version,
              },
              {
                name: 'Chart Version',
                value: release.chart.metadata.version,
              },
              {
                name: 'App Version',
                value: release.chart.metadata.appVersion,
              },
              {
                name: 'Status',
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
        <SectionBox title="History">
          <SimpleTable
            data={releaseHistory === null ? null : releaseHistory.releases}
            defaultSortingColumn={1}
            columns={[
              {
                label: 'Revision',
                getter: data => data.version,
                sort: (n1, n2) => n2.version - n1.version,
              },
              {
                label: 'Description',
                getter: data => data.info.description,
              },
              {
                label: 'Status',
                getter: data => (
                  <StatusLabel status={release?.info.status === 'deployed' ? 'success' : 'error'}>
                    {data.info.status}
                  </StatusLabel>
                ),
              },
              {
                label: 'Chart',
                getter: data => data.chart.metadata.name,
              },
              {
                label: 'App Version',
                getter: data => data.chart.metadata.appVersion,
              },
              {
                label: 'Updated',
                getter: data => <DateLabel date={data.info.last_deployed} format="mini" />,
              },
            ]}
          />
        </SectionBox>
      )}
    </>
  );
}

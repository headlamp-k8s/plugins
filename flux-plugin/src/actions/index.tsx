import { ActionButton, ConfirmDialog, Dialog } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useSnackbar } from 'notistack';
import React from 'react';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';

function SuspendAction(props) {
  //const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { resource } = props;
  const [open, setOpen] = React.useState<boolean>(false);

  return (
    <>
      <ActionButton
        description="Suspend"
        icon={'mdi:pause'}
        iconButtonProps={{
         style: {
            display: resource?.jsonData.spec.hasOwnProperty('suspend') ? resource.jsonData.spec.suspend ? 'none' : 'inline-flex' : 'inline-flex',
          }
        }}
        onClick={() => {
          setOpen(true);
        }}
      />
        <ConfirmDialog
        // @ts-ignore
        open={open}
         handleClose={() => setOpen(false)}
        onConfirm={() => {
            setOpen(false);
            resource.jsonData.spec['suspend'] = true;
            const patch = resource.constructor.apiEndpoint.patch;
            patch({
              spec: {
                suspend: true,
              }
            }, resource.jsonData.metadata.namespace, resource.jsonData.metadata.name).then((response) => {
              if(response.spec.suspend) {
                enqueueSnackbar(`Successfully suspended reconciliation for ${resource.metadata.name}`, { variant: 'success' });
              } else {
                enqueueSnackbar(`Failed to suspend reconciliation for ${resource.metadata.name}`, { variant: 'error' });
              }
            }).catch((error) => {
              enqueueSnackbar(`Failed to suspend reconciliation for ${resource.metadata.name} error ${error}`, { variant: 'error' });
            })
          }}
        title={'Suspend Reconciliation'}
        description={`Are you sure you want to suspend reconciliation for ${resource?.jsonData.metadata.name}?`}
      />
    </>
  );
}

function ResumeAction(props) {
  // const dispatch = useDispatch();
  const { resource } = props;
  const { enqueueSnackbar } = useSnackbar();
  return (
    <ActionButton
      iconButtonProps={{
        style: {
          display: resource?.jsonData.spec.hasOwnProperty('suspend') ? resource.jsonData.spec.suspend ? 'inline-flex' : 'none' : 'none',
        }
      }}
      description="Resume"
      icon={'mdi:play'}
      onClick={() => {
        const patch = resource.constructor.apiEndpoint.patch;
        patch({
          spec: {
            suspend: false,
          }
        }, resource.jsonData.metadata.namespace, resource.jsonData.metadata.name).then((response) => {
          if(!response.spec.suspend) {
            enqueueSnackbar(`Successfully resumed reconciliation for ${response.metadata.name}`, { variant: 'success' });
          } else {
            enqueueSnackbar(`Failed to resume reconciliation for ${response.metadata.name}`, { variant: 'error' });
          }
        }).catch((error) => {
          enqueueSnackbar(`Failed to resume reconciliation for ${resource.metadata.name} error ${error}`, { variant: 'error' });
        })
      }}
    />
  );
}

function syncRequest(resource: KubeObject, enqueueSnackbar, date) {
    const name = resource.jsonData.metadata.name;
    
    const patch = resource.constructor.apiEndpoint.patch;
    return patch({
      metadata: {
        annotations: {
          ...resource.jsonData.metadata.annotations,
          'reconcile.fluxcd.io/requestedAt': date,
        },
      }
    }, resource.jsonData.metadata.namespace, name);
}


function SyncAction(props) {
  // const dispatch = useDispatch();
  const { resource } = props;
  const { enqueueSnackbar } = useSnackbar();

  return (
    <ActionButton
      description="Sync"
      icon={'mdi:sync'}
      onClick={() => {
        const date = new Date().toISOString();
        enqueueSnackbar(`Starting sync for ${resource.metadata.name}`, { variant: 'info' });
        syncRequest(resource, enqueueSnackbar, date).then(() => {
          const get  = resource.constructor.apiEndpoint.get;
          let isResourceSynced = false;
          get(resource.metadata.namespace, resource.metadata.name, (newResource) => {
            if(newResource.status.lastHandledReconcileAt === date && !isResourceSynced) {
              enqueueSnackbar(`Successfully synced ${resource.metadata.name}`, { variant: 'success' });
              isResourceSynced = true;
            }
          }).catch((error) => {
            enqueueSnackbar(`Failed to sync ${resource.metadata.name} error ${error}`, { variant: 'error' });
          })
        });
      }}
    />
  );
}

function SyncWithSourceAction(props) {
  const { resource, source } = props;
  const { enqueueSnackbar } = useSnackbar();
  return (
    <ActionButton
      description="Sync with source"
      onClick={() => {
        enqueueSnackbar(`Starting sync for source ${source.metadata.name}`, { variant: 'info' });
        const date = new Date().toISOString();
        syncRequest(source, enqueueSnackbar, date).then(() => {
          const get = source.constructor.apiEndpoint.get;
          let isSourceSynced = false;
          get(source.metadata.namespace, source.metadata.name, (newSource) => {
            if(newSource.status.lastHandledReconcileAt === date && !isSourceSynced) {
              enqueueSnackbar(`Successfully synced source ${source.metadata.name}`, { variant: 'success' });
              isSourceSynced = true;
              enqueueSnackbar(`Now starting sync for ${resource.metadata.name}`, { variant: 'info' });
              syncRequest(resource, enqueueSnackbar, date).then(() => {
                const getResource = resource.constructor.apiEndpoint.get;
                let isResourceSynced = false;
                getResource(resource.metadata.namespace, resource.metadata.name, (newResource) => {
                  if(newResource.status.lastHandledReconcileAt === date && !isResourceSynced) {
                    enqueueSnackbar(`Successfully synced ${resource.metadata.name}`, { variant: 'success' });
                    isResourceSynced = true;
                  } 
                })
              })
            }
          }).catch((error) => {
            enqueueSnackbar(`Failed to sync source ${source.metadata.name} error ${error}`, { variant: 'error' });
          })
        });
     
      }}
      icon="mdi:file-sync"
    />
  );
}

function SyncWithoutSourceAction(props) {
  const { resource } = props;
  const { enqueueSnackbar } = useSnackbar();
  return (
    <ActionButton
      description="Sync without source"
      onClick={() => {
        const date = new Date().toISOString();
        syncRequest(resource, enqueueSnackbar, date).then(() => {
          const date = new Date().toISOString();
          enqueueSnackbar(`Starting sync for ${resource.metadata.name}`, { variant: 'info' });
          syncRequest(resource, enqueueSnackbar, date).then(() => {
            const get  = resource.constructor.apiEndpoint.get;
            let isResourceSynced = false;
            get(resource.metadata.namespace, resource.metadata.name, (newResource) => {
              if(newResource.status.lastHandledReconcileAt === date && !isResourceSynced) {
                enqueueSnackbar(`Successfully synced ${resource.metadata.name}`, { variant: 'success' });
                isResourceSynced = true;
              }
            }).catch((error) => {
              enqueueSnackbar(`Failed to sync ${resource.metadata.name} error ${error}`, { variant: 'error' });
            })
          });
        });
      }}
      icon="mdi:sync"
    />
  );
}

export { SuspendAction, ResumeAction, SyncAction, SyncWithSourceAction, SyncWithoutSourceAction };

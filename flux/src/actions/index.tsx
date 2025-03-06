import { ActionButton, ConfirmDialog } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { useSnackbar } from 'notistack';
import React from 'react';

function ForceReconciliationAction(props) {
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = React.useState<boolean>(false);
  const { resource } = props;

  return (
    <>
      <ActionButton
        description={
          resource.jsonData.spec.force
            ? `Disable force reconciliation for ${resource.metadata.name}`
            : `Enable force reconciliation for ${resource.metadata.name}`
        }
        icon={resource.jsonData.spec.force ? 'mdi:invoice-text-remove' : 'mdi:invoice-text-new'}
        onClick={() => {
          setOpen(true);
        }}
      />
      <ConfirmDialog
        // @ts-ignore -- Remove this once mui types are working, related to wildcard paths in plugins-tsconfig.json
        open={open}
        handleClose={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          const patch = resource.constructor.apiEndpoint.patch;
          patch(
            {
              spec: {
                force: !resource.jsonData.spec.force,
              },
            },
            resource.jsonData.metadata.namespace,
            resource.jsonData.metadata.name
          )
            .then(response => {
              enqueueSnackbar(
                response.spec.force
                  ? `Successfully Disabled force reconciliation for ${resource.metadata.name}`
                  : `Successfully Enabled force reconciliation for ${resource.metadata.name}`,
                { variant: 'success' }
              );
            })
            .catch(error => {
              enqueueSnackbar(`error ${error}`, { variant: 'error' });
            });
        }}
        title={
          resource.jsonData.force ? 'Enable Force Reconciliation' : 'Disable Force Reconciliation'
        }
        description={`${
          resource.jsonData.force
            ? 'Are you sure you want to enable force reconciliation for '
            : 'Are you sure you want to disable force reconciliation for '
        }${resource?.jsonData.metadata.name}?`}
      />
    </>
  );
}

function SuspendAction(props) {
  const { enqueueSnackbar } = useSnackbar();
  const { resource } = props;
  const [open, setOpen] = React.useState<boolean>(false);

  if (resource?.jsonData?.spec?.suspend) {
    return null;
  }
  return (
    <>
      <ActionButton
        description="Suspend"
        icon={'mdi:pause'}
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
          const patch = resource.constructor.apiEndpoint.patch;
          patch(
            {
              spec: {
                suspend: true,
              },
            },
            resource.jsonData.metadata.namespace,
            resource.jsonData.metadata.name
          )
            .then(response => {
              if (response.spec.suspend) {
                enqueueSnackbar(
                  `Successfully suspended reconciliation for ${resource.metadata.name}`,
                  { variant: 'success' }
                );
              } else {
                enqueueSnackbar(`Failed to suspend reconciliation for ${resource.metadata.name}`, {
                  variant: 'error',
                });
              }
            })
            .catch(error => {
              enqueueSnackbar(
                `Failed to suspend reconciliation for ${resource.metadata.name} error ${error}`,
                { variant: 'error' }
              );
            });
        }}
        title={'Suspend Reconciliation'}
        description={`Are you sure you want to suspend reconciliation for ${resource?.jsonData.metadata.name}?`}
      />
    </>
  );
}

function ResumeAction(props) {
  const { resource } = props;
  const { enqueueSnackbar } = useSnackbar();
  if (!resource.jsonData.spec.suspend) {
    return null;
  }
  return (
    <ActionButton
      description="Resume"
      icon={'mdi:play'}
      onClick={() => {
        const patch = resource.constructor.apiEndpoint.patch;
        patch(
          {
            spec: {
              suspend: false,
            },
          },
          resource.jsonData.metadata.namespace,
          resource.jsonData.metadata.name
        )
          .then(response => {
            if (!response.spec.suspend) {
              enqueueSnackbar(`Successfully resumed reconciliation for ${response.metadata.name}`, {
                variant: 'success',
              });
            } else {
              enqueueSnackbar(`Failed to resume reconciliation for ${response.metadata.name}`, {
                variant: 'error',
              });
            }
          })
          .catch(error => {
            enqueueSnackbar(
              `Failed to resume reconciliation for ${resource.metadata.name} error ${error}`,
              { variant: 'error' }
            );
          });
      }}
    />
  );
}

function syncRequest(resource: KubeObject, enqueueSnackbar, date) {
  const name = resource.jsonData.metadata.name;

  const patch = (resource.constructor as any).apiEndpoint.patch;
  return patch(
    {
      metadata: {
        annotations: {
          ...resource.jsonData.metadata.annotations,
          'reconcile.fluxcd.io/requestedAt': date,
        },
      },
    },
    resource.jsonData.metadata.namespace,
    name
  );
}

function SyncAction(props) {
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
          const get = resource.constructor.apiEndpoint.get;
          let isResourceSynced = false;
          get(resource.metadata.namespace, resource.metadata.name, newResource => {
            if (newResource.status.lastHandledReconcileAt === date && !isResourceSynced) {
              enqueueSnackbar(`Successfully synced ${resource.metadata.name}`, {
                variant: 'success',
              });
              isResourceSynced = true;
            }
          }).catch(error => {
            enqueueSnackbar(`Failed to sync ${resource.metadata.name} error ${error}`, {
              variant: 'error',
            });
          });
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
          get(source.metadata.namespace, source.metadata.name, newSource => {
            if (newSource.status.lastHandledReconcileAt === date && !isSourceSynced) {
              enqueueSnackbar(`Successfully synced source ${source.metadata.name}`, {
                variant: 'success',
              });
              isSourceSynced = true;
              enqueueSnackbar(`Now starting sync for ${resource.metadata.name}`, {
                variant: 'info',
              });
              syncRequest(resource, enqueueSnackbar, date).then(() => {
                const getResource = resource.constructor.apiEndpoint.get;
                let isResourceSynced = false;
                getResource(resource.metadata.namespace, resource.metadata.name, newResource => {
                  if (newResource.status.lastHandledReconcileAt === date && !isResourceSynced) {
                    enqueueSnackbar(`Successfully synced ${resource.metadata.name}`, {
                      variant: 'success',
                    });
                    isResourceSynced = true;
                  }
                });
              });
            }
          }).catch(error => {
            enqueueSnackbar(`Failed to sync source ${source.metadata.name} error ${error}`, {
              variant: 'error',
            });
          });
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
            const get = resource.constructor.apiEndpoint.get;
            let isResourceSynced = false;
            get(resource.metadata.namespace, resource.metadata.name, newResource => {
              if (newResource.status.lastHandledReconcileAt === date && !isResourceSynced) {
                enqueueSnackbar(`Successfully synced ${resource.metadata.name}`, {
                  variant: 'success',
                });
                isResourceSynced = true;
              }
            }).catch(error => {
              enqueueSnackbar(`Failed to sync ${resource.metadata.name} error ${error}`, {
                variant: 'error',
              });
            });
          });
        });
      }}
      icon="mdi:sync"
    />
  );
}

export {
  SuspendAction,
  ResumeAction,
  SyncAction,
  SyncWithSourceAction,
  SyncWithoutSourceAction,
  ForceReconciliationAction,
};

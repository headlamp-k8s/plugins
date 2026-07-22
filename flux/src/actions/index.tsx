import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ActionButton, ConfirmDialog } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useSource } from '../sources/Source';

function ForceReconciliationAction(props) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = React.useState<boolean>(false);
  const { resource } = props;

  return (
    <>
      <ActionButton
        description={
          resource.jsonData.spec.force
            ? t('Disable force reconciliation for {{name}}', { name: resource.metadata.name })
            : t('Enable force reconciliation for {{name}}', { name: resource.metadata.name })
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
                  ? t('Successfully enabled force reconciliation for {{name}}', {
                      name: resource.metadata.name,
                    })
                  : t('Successfully disabled force reconciliation for {{name}}', {
                      name: resource.metadata.name,
                    }),
                { variant: 'success' }
              );
            })
            .catch(error => {
              enqueueSnackbar(t('Error: {{error}}', { error }), { variant: 'error' });
            });
        }}
        title={
          resource.jsonData.spec.force
            ? t('Disable Force Reconciliation')
            : t('Enable Force Reconciliation')
        }
        description={
          resource.jsonData.spec.force
            ? t('Are you sure you want to disable force reconciliation for {{name}}?', {
                name: resource.metadata.name,
              })
            : t('Are you sure you want to enable force reconciliation for {{name}}?', {
                name: resource.metadata.name,
              })
        }
      />
    </>
  );
}

function SuspendAction(props) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { resource } = props;
  const [open, setOpen] = React.useState<boolean>(false);

  if (resource?.jsonData?.spec?.suspend) {
    return null;
  }
  return (
    <>
      <ActionButton
        description={t('Suspend')}
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
                  t('Successfully suspended reconciliation for {{name}}', {
                    name: resource.metadata.name,
                  }),
                  { variant: 'success' }
                );
              } else {
                enqueueSnackbar(
                  t('Failed to suspend reconciliation for {{name}}', {
                    name: resource.metadata.name,
                  }),
                  {
                    variant: 'error',
                  }
                );
              }
            })
            .catch(error => {
              enqueueSnackbar(
                t('Failed to suspend reconciliation for {{name}}: {{error}}', {
                  name: resource.metadata.name,
                  error,
                }),
                { variant: 'error' }
              );
            });
        }}
        title={t('Suspend Reconciliation')}
        description={t('Are you sure you want to suspend reconciliation for {{name}}?', {
          name: resource?.jsonData.metadata.name,
        })}
      />
    </>
  );
}

function ResumeAction(props) {
  const { t } = useTranslation();
  const { resource } = props;
  const { enqueueSnackbar } = useSnackbar();
  if (!resource.jsonData.spec.suspend) {
    return null;
  }
  return (
    <ActionButton
      description={t('Resume')}
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
              enqueueSnackbar(
                t('Successfully resumed reconciliation for {{name}}', {
                  name: response.metadata.name,
                }),
                {
                  variant: 'success',
                }
              );
            } else {
              enqueueSnackbar(
                t('Failed to resume reconciliation for {{name}}', {
                  name: response.metadata.name,
                }),
                {
                  variant: 'error',
                }
              );
            }
          })
          .catch(error => {
            enqueueSnackbar(
              t('Failed to resume reconciliation for {{name}}: {{error}}', {
                name: resource.metadata.name,
                error,
              }),
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
  const { t } = useTranslation();
  const { resource } = props;
  const { enqueueSnackbar } = useSnackbar();

  return (
    <ActionButton
      description={t('Sync')}
      icon={'mdi:sync'}
      onClick={() => {
        const date = new Date().toISOString();
        enqueueSnackbar(t('Starting sync for {{name}}', { name: resource.metadata.name }), {
          variant: 'info',
        });
        syncRequest(resource, enqueueSnackbar, date).then(() => {
          const get = resource.constructor.apiEndpoint.get;
          let isResourceSynced = false;
          get(resource.metadata.namespace, resource.metadata.name, newResource => {
            if (newResource.status.lastHandledReconcileAt === date && !isResourceSynced) {
              enqueueSnackbar(t('Successfully synced {{name}}', { name: resource.metadata.name }), {
                variant: 'success',
              });
              isResourceSynced = true;
            }
          }).catch(error => {
            enqueueSnackbar(
              t('Failed to sync {{name}}: {{error}}', { name: resource.metadata.name, error }),
              {
                variant: 'error',
              }
            );
          });
        });
      }}
    />
  );
}

function SyncWithSourceAction(props) {
  const { t } = useTranslation();
  const { resource } = props;
  const { enqueueSnackbar } = useSnackbar();
  const source = useSource(resource);

  if (!source) return null;

  return (
    <ActionButton
      description={t('Sync with source')}
      onClick={() => {
        enqueueSnackbar(t('Starting sync for source {{name}}', { name: source.metadata.name }), {
          variant: 'info',
        });
        const date = new Date().toISOString();
        syncRequest(source, enqueueSnackbar, date).then(() => {
          const get = (source.constructor as any).apiEndpoint.get;
          let isSourceSynced = false;
          get(source.metadata.namespace, source.metadata.name, newSource => {
            if (newSource.status.lastHandledReconcileAt === date && !isSourceSynced) {
              enqueueSnackbar(
                t('Successfully synced source {{name}}', { name: source.metadata.name }),
                {
                  variant: 'success',
                }
              );
              isSourceSynced = true;
              enqueueSnackbar(
                t('Now starting sync for {{name}}', { name: resource.metadata.name }),
                {
                  variant: 'info',
                }
              );
              syncRequest(resource, enqueueSnackbar, date).then(() => {
                const getResource = resource.constructor.apiEndpoint.get;
                let isResourceSynced = false;
                getResource(resource.metadata.namespace, resource.metadata.name, newResource => {
                  if (newResource.status.lastHandledReconcileAt === date && !isResourceSynced) {
                    enqueueSnackbar(
                      t('Successfully synced {{name}}', { name: resource.metadata.name }),
                      {
                        variant: 'success',
                      }
                    );
                    isResourceSynced = true;
                  }
                });
              });
            }
          }).catch(error => {
            enqueueSnackbar(
              t('Failed to sync source {{name}}: {{error}}', {
                name: source.metadata.name,
                error,
              }),
              {
                variant: 'error',
              }
            );
          });
        });
      }}
      icon="mdi:file-sync"
    />
  );
}

function SyncWithoutSourceAction(props) {
  const { t } = useTranslation();
  const { resource } = props;
  const { enqueueSnackbar } = useSnackbar();
  return (
    <ActionButton
      description={t('Sync without source')}
      onClick={() => {
        const date = new Date().toISOString();
        syncRequest(resource, enqueueSnackbar, date).then(() => {
          const date = new Date().toISOString();
          enqueueSnackbar(t('Starting sync for {{name}}', { name: resource.metadata.name }), {
            variant: 'info',
          });
          syncRequest(resource, enqueueSnackbar, date).then(() => {
            const get = resource.constructor.apiEndpoint.get;
            let isResourceSynced = false;
            get(resource.metadata.namespace, resource.metadata.name, newResource => {
              if (newResource.status.lastHandledReconcileAt === date && !isResourceSynced) {
                enqueueSnackbar(
                  t('Successfully synced {{name}}', { name: resource.metadata.name }),
                  {
                    variant: 'success',
                  }
                );
                isResourceSynced = true;
              }
            }).catch(error => {
              enqueueSnackbar(
                t('Failed to sync {{name}}: {{error}}', { name: resource.metadata.name, error }),
                {
                  variant: 'error',
                }
              );
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

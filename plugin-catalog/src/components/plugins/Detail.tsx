import { PluginManager, Router } from '@kinvolk/headlamp-plugin/lib';
import {
  ActionButton,
  Loader,
  NameValueTable,
  SectionBox,
  SectionHeader,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Button, CardMedia, Link, Snackbar, Tooltip, Typography } from '@mui/material';
import Markdown from 'markdown-to-jsx';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import semver from 'semver';
import LoadingButton from './LoadingButton';

const { createRouteURL } = Router;

declare global {
  interface Window {
    pluginLib: {
      [libName: string]: any;
    };
    plugins: {
      [pluginId: string]: Plugin;
    };
    registerPlugin: (pluginId: string, pluginObj: Plugin) => void;
    desktopApi: any;
  }
}
/**
 * PluginDetailResp interface represents the response from the Artifact Hub API for a plugin detail.
 * For more information refer:
 * https://artifacthub.github.io/hub/api/#/Packages/getHeadlampPluginDetails
 */
export interface PluginDetailResp {
  isInstalled: boolean;
  currentVersion: string;
  packageName: string;
  updateAvailable: boolean;
  package_id: string;
  name: string;
  normalized_name: string;
  is_operator: boolean;
  display_name: string;
  description: string;
  logo_image_id: string;
  readme: string;
  data: {
    'headlamp/plugin/archive-url': string;
    'headlamp/plugin/distro-compat': string;
    'headlamp/plugin/version-compat': string;
    'headlamp/plugin/archive-checksum': string;
  };
  version: string;
  available_versions: {
    version: string;
    contains_security_updates: boolean;
    prerelease: boolean;
    ts: number;
  }[];
  deprecated: boolean;
  contains_security_updates: boolean;
  prerelease: boolean;
  signed: boolean;
  has_values_schema: boolean;
  has_changelog: boolean;
  ts: number;
  repository: {
    repository_id: string;
    name: string;
    display_name: string;
    url: string;
    branch: string;
    private: boolean;
    kind: number;
    verified_publisher: boolean;
    official: boolean;
    scanner_disabled: boolean;
    user_alias: string;
    organization_name: string;
    organization_display_name: string;
  };
  stats: {
    subscriptions: number;
    webhooks: number;
  };
  production_organizations_count: number;
  relative_path: string;
}

/**
 * This interface represents the properties for the PurePluginDetail component.
 *
 * @property {PluginDetailResp | null} pluginDetail - The detailed information about the plugin.
 * @property {'Install' | 'Uninstall' | 'Update' | null} currentAction - The current action being performed on the plugin.
 * @property {string | null} currentActionState - The current state of the action being performed.
 * @property {string | null} currentActionMessage - The message related to the current action.
 * @property {number} currentActionProgress - The progress of the current action.
 * @property {string | null} alertMessage - The message to be displayed in the alert.
 * @property {() => void} onInstall - A function that is called when the plugin is installed.
 * @property {(pluginName: string) => void} onUpdate - A function that is called when the plugin is updated.
 * @property {(pluginName: string) => void} onUninstall - A function that is called when the plugin is uninstalled.
 * @property {() => void} onCancel - A function that is called when the current action is cancelled.
 * @property {() => void} onAlertClose - A function that is called when the alert is closed.
 */
export interface PurePluginDetailProps {
  pluginDetail: PluginDetailResp | null;
  currentAction: 'Install' | 'Uninstall' | 'Update' | null;
  currentActionState: string | null;
  currentActionMessage: string | null;
  currentActionProgress: number;
  alertMessage: string | null;
  onInstall: () => void;
  onUpdate: (pluginName: string) => void;
  onUninstall: (pluginName: string) => void;
  onCancel: () => void;
  onAlertClose: () => void;
}

export function PurePluginDetail({
  pluginDetail,
  currentAction,
  currentActionState,
  currentActionMessage,
  currentActionProgress,
  alertMessage,
  onInstall,
  onUpdate,
  onUninstall,
  onCancel,
  onAlertClose,
}: PurePluginDetailProps) {
  const [repoUrl, orgUrl] = React.useMemo(() => {
    const artifactHubURLBase = 'https://artifacthub.io/packages/search?sort=relevance&page=1';
    if (!pluginDetail) {
      return ['', ''];
    }

    return [
      `${artifactHubURLBase}&repo=${pluginDetail.repository.name}`,
      `${artifactHubURLBase}&org=${pluginDetail.repository.organization_name}`,
    ];
  },
  [pluginDetail]);

  return (
    <>
      <Snackbar
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: 'rgb(49, 49, 49)',
            color: '#fff',
          },
        }}
        open={!!alertMessage}
        autoHideDuration={6000}
        onClose={onAlertClose}
        message={
          <Tooltip title={alertMessage || ''} arrow>
            <Typography>
              {alertMessage ? alertMessage.substring(0, Math.min(50, alertMessage.length)) : null}
            </Typography>{' '}
          </Tooltip>
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        action={<Button onClick={onAlertClose}>Close</Button>}
      />
      <SectionBox
        title={
          <SectionHeader
            title={pluginDetail ? pluginDetail.display_name : ''}
            titleSideActions={[
              pluginDetail?.logo_image_id && (
                <CardMedia
                  image={`https://artifacthub.io/image/${pluginDetail.logo_image_id}`}
                  sx={{
                    width: '60px',
                    margin: '1rem',
                    alignSelf: 'flex-start',
                  }}
                  component="img"
                />
              )
            ]}
            actions={[
              currentAction === null ? (
                pluginDetail ? (
                  pluginDetail.isInstalled ? (
                    <>
                      {pluginDetail.updateAvailable && (
                        <ActionButton
                          description="Update"
                          onClick={() => onUpdate(pluginDetail.packageName)}
                          icon="mdi:arrow-up-bold"
                        />
                      )}
                      <ActionButton
                        description="Uninstall"
                        onClick={() => onUninstall(pluginDetail.packageName)}
                        icon="mdi:delete"
                      />
                    </>
                  ) : (
                    <Button
                      sx={{
                        backgroundColor: '#000',
                        color: 'white',
                        textTransform: 'none',
                        '&:hover': {
                          color: 'black',
                        },
                      }}
                      onClick={onInstall}
                    >
                      Install
                    </Button>
                  )
                ) : null
              ) : (
                <>
                  <LoadingButton progress={currentActionProgress} onCancel={onCancel} />
                  <Tooltip title={`${currentActionState}:${currentActionMessage}`}>
                    <Typography variant="body1" sx={{ marginLeft: 1 }}>
                      {currentAction}
                    </Typography>
                  </Tooltip>
                </>
              ),
            ]}
          />
        }
        backLink={createRouteURL('Plugin Catalog')}
      />
      {!pluginDetail ? (
        <Loader title="" />
      ) : (
        <>
          <NameValueTable
            rows={[
              { name: 'Name', value: pluginDetail.display_name },
              { name: 'Description', value: pluginDetail.description },
              {
                name: 'Available Version',
                value: pluginDetail.version,
              },
              {
                name: 'Installed Version',
                value: pluginDetail.currentVersion,
                hide: !pluginDetail.isInstalled,
              },
              {
                name: 'Repository',
                value: (
                  repoUrl && (
                    <Link href={repoUrl} target="_blank">
                      {pluginDetail.repository.display_name}
                    </Link>
                  )
                )
              },
              {
                name: 'Author',
                value: (
                  orgUrl && (
                    <Link href={orgUrl} target="_blank">
                      {pluginDetail.repository.organization_display_name}
                    </Link>
                  )
                )
              },
            ]}
          />
          <Markdown>{pluginDetail.readme}</Markdown>
        </>
      )}
    </>
  );
}

function fetchHeadlampPluginDetail(repoName: string, pluginName: string) {
  const url = `https://artifacthub.io/api/v1/packages/headlamp/${repoName}/${pluginName}`;

  return fetch(`http://localhost:4466/externalproxy`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Forward-To': url,
    },
  })
    .then(response => (response.ok ? response.json() : Promise.reject('Request failed')))
    .catch(error => {
      throw new Error(`Request failed! ${error}`);
    });
}

async function checkIfPluginIsInstalled(pluginDetail: PluginDetailResp) {
  try {
    const data = await PluginManager.list();
    const currentPlugin = data.find(plugin => plugin.folderName === pluginDetail.name) || null;
    pluginDetail.isInstalled = false;
    pluginDetail.currentVersion = '';
    pluginDetail.packageName = '';
    pluginDetail.updateAvailable = false;
    if (currentPlugin) {
      pluginDetail.isInstalled = true;
      pluginDetail.packageName = currentPlugin.pluginName;
      pluginDetail.currentVersion = currentPlugin.artifacthubVersion;
      if (semver.gt(pluginDetail.version, currentPlugin.artifacthubVersion)) {
        pluginDetail.updateAvailable = true;
      }
    }
    return pluginDetail;
  } catch (error) {
    return pluginDetail;
  }
}

export function PluginDetail() {
  const { repoName, pluginName } = useParams<{ repoName: string; pluginName: string }>();
  const identifier = `${repoName}_${pluginName}`;
  const [pluginDetail, setPluginDetail] = useState<PluginDetailResp | null>(null);
  const [currentAction, setCurrentAction] = useState<'Install' | 'Uninstall' | 'Update' | null>(
    null
  );
  const [currentActionState, setCurrentActionState] = useState<string | null>(null);
  const [currentActionMessage, setCurrentActionMessage] = useState<string | null>(null);
  const [currentActionProgress, setCurrentActionProgress] = useState<number>(0);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const url = `https://artifacthub.io/packages/headlamp/${repoName}/${pluginName}`;

  const fetchStatus = async () => {
    try {
      let status = await PluginManager.getStatus(identifier);
      if (status.type === 'error' && status.message === 'No such operation in progress') {
        setCurrentActionState(null);
        setCurrentActionProgress(0);
        setCurrentAction(null);
        return;
      }
      while (status && currentAction) {
        if (status.type === 'error' || status.type === 'success') {
          const enrichedPluginData = await checkIfPluginIsInstalled(pluginDetail!);
          setPluginDetail(enrichedPluginData);
          setCurrentActionState(null);
          setCurrentActionMessage(null);
          setCurrentActionProgress(0);
          setCurrentAction(null);

          // Set alert message
          setAlertMessage(
            status.type === 'success'
              ? `${currentAction} completed successfully.`
              : `Error: ${status.message}`
          );

          break;
        }
        if (status.percentage !== undefined) {
          setCurrentActionProgress(status.percentage);
        }
        setCurrentActionState(status.type);
        setCurrentActionMessage(status.message);

        await new Promise(resolve => setTimeout(resolve, 1000));
        status = await PluginManager.getStatus(identifier);
      }
    } catch (error) {
      setCurrentActionState(null);
      setCurrentActionMessage(null);
      setCurrentActionProgress(0);
      setAlertMessage(`An unexpected error occurred: ${error}`);
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (isMounted) {
        const data = await fetchHeadlampPluginDetail(repoName, pluginName);
        const enrichedPluginData = await checkIfPluginIsInstalled(data);
        setPluginDetail(enrichedPluginData);
      }

      fetchStatus();
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [repoName, pluginName, currentAction]);

  useEffect(() => {
    if (currentAction) {
      fetchStatus();
    }
  }, [currentAction]);

  const handleInstall = (pluginName: string) => {
    setCurrentAction('Install');
    PluginManager.install(identifier, pluginName, url);
  };

  const handleUpdate = (pluginName: string) => {
    setCurrentAction('Update');
    PluginManager.update(identifier, pluginName);
  };

  const handleUninstall = (pluginName: string) => {
    setCurrentAction('Uninstall');
    PluginManager.uninstall(identifier, pluginName);
  };

  const handleCancel = () => {
    PluginManager.cancel(identifier);
    setCurrentAction(null);
  };

  const handleAlertClose = () => {
    setAlertMessage(null);
  };

  return (
    <PurePluginDetail
      pluginDetail={pluginDetail}
      currentAction={currentAction}
      currentActionState={currentActionState}
      currentActionMessage={currentActionMessage}
      currentActionProgress={currentActionProgress}
      alertMessage={alertMessage}
      onInstall={() => handleInstall(pluginDetail!.display_name)}
      onUpdate={handleUpdate}
      onUninstall={handleUninstall}
      onCancel={handleCancel}
      onAlertClose={handleAlertClose}
    />
  );
}

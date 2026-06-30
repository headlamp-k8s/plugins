import { PluginManager, Router, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  ActionButton,
  Link as HeadlampLink,
  Loader,
  NameValueTable,
  SectionBox,
  SectionHeader,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import {
  Button,
  CardMedia,
  FormControl,
  Link,
  MenuItem,
  Select,
  SelectChangeEvent,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';
import Markdown from 'markdown-to-jsx';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import semver from 'semver';
import LoadingButton from './LoadingButton';

const { createRouteURL } = Router;

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
    organization_name?: string;
    organization_display_name?: string;
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
 * @property {string} selectedVersion - The version currently selected for installation.
 * @property {(version: string) => void} onVersionChange - A function that is called when the user selects a different version to install.
 * @property {(version: string) => void} onInstall - A function that is called when the plugin is installed, with the version selected for installation.
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
  selectedVersion: string;
  onVersionChange: (version: string) => void;
  onInstall: (version: string) => void;
  onUpdate: (pluginName: string) => void;
  onUninstall: (pluginName: string) => void;
  onCancel: () => void;
  onAlertClose: () => void;
}

const pluginSnackbarAction = (closeCallback: () => void, t: (key: string) => string) => {
  return (
    <>
      <Button
        color="inherit"
        onClick={() => {
          window.location.reload();
        }}
      >
        {t('Reload Now')}
      </Button>
      <Button color="inherit" onClick={closeCallback}>
        {t('Close')}
      </Button>
    </>
  );
};

export function PurePluginDetail({
  pluginDetail,
  currentAction,
  currentActionState,
  currentActionMessage,
  currentActionProgress,
  alertMessage,
  selectedVersion,
  onVersionChange,
  onInstall,
  onUpdate,
  onUninstall,
  onCancel,
  onAlertClose,
}: PurePluginDetailProps) {
  const { t } = useTranslation();
  const [repoUrl, orgUrl] = React.useMemo(() => {
    const artifactHubURLBase = 'https://artifacthub.io/packages/search?sort=relevance&page=1';
    if (!pluginDetail) {
      return ['', ''];
    }

    return [
      `${artifactHubURLBase}&repo=${pluginDetail.repository.name}`,
      `${artifactHubURLBase}&org=${pluginDetail.repository.organization_name}`,
    ];
  }, [pluginDetail]);

  // Versions available for installation, sorted newest first.
  const sortedVersions = React.useMemo(() => {
    if (!pluginDetail?.available_versions?.length) {
      return [];
    }
    return [...pluginDetail.available_versions].sort((a, b) => {
      // Compare valid semver directly so prerelease ordering is preserved
      // (e.g. 0.1.0-beta-1 < 0.1.0-beta-2 < 0.1.0); coercing would drop it.
      if (semver.valid(a.version) && semver.valid(b.version)) {
        return semver.rcompare(a.version, b.version);
      }
      return b.version.localeCompare(a.version);
    });
  }, [pluginDetail]);

  // Only offer a selector when there is more than one version to choose from;
  // otherwise the single available version is shown as plain text.
  const showVersionSelector =
    !!pluginDetail && !pluginDetail.isInstalled && sortedVersions.length > 1;

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
        onClose={onAlertClose}
        message={
          <Tooltip title={alertMessage || ''} arrow>
            <Typography>
              {alertMessage ? alertMessage.substring(0, Math.min(50, alertMessage.length)) : null}{' '}
            </Typography>
          </Tooltip>
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        action={pluginSnackbarAction(onAlertClose, t)}
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
              ),
            ]}
            actions={[
              currentAction === null ? (
                pluginDetail ? (
                  pluginDetail.isInstalled ? (
                    <>
                      <HeadlampLink routeName="plugins">{t('Settings')}</HeadlampLink>
                      {pluginDetail.updateAvailable && (
                        <ActionButton
                          description={t('Update')}
                          onClick={() => onUpdate(pluginDetail.packageName)}
                          icon="mdi:arrow-up-bold"
                        />
                      )}
                      <ActionButton
                        description={t('Uninstall')}
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
                          color: 'inherit',
                        },
                      }}
                      onClick={() => onInstall(selectedVersion)}
                    >
                      {t('Install')}
                    </Button>
                  )
                ) : null
              ) : (
                <>
                  <Tooltip title={`${currentActionState}:${currentActionMessage}`}>
                    <LoadingButton progress={currentActionProgress} onCancel={onCancel} />
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
              { name: t('Name'), value: pluginDetail.display_name },
              { name: t('Description'), value: pluginDetail.description },
              {
                name: t('Available Version'),
                value: showVersionSelector ? (
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <Select
                      value={selectedVersion}
                      onChange={(event: SelectChangeEvent) => onVersionChange(event.target.value)}
                      disabled={currentAction !== null}
                    >
                      {sortedVersions.map(availableVersion => (
                        <MenuItem key={availableVersion.version} value={availableVersion.version}>
                          {availableVersion.version}
                          {availableVersion.version === pluginDetail.version
                            ? ` ${t('(latest)')}`
                            : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  pluginDetail.version
                ),
              },
              {
                name: t('Installed Version'),
                value: pluginDetail.currentVersion,
                hide: !pluginDetail.isInstalled,
              },
              {
                name: t('Repository'),
                value: repoUrl && (
                  <Link href={repoUrl} target="_blank">
                    {pluginDetail.repository.display_name}
                  </Link>
                ),
              },
              {
                name: t('Author'),
                value: orgUrl && (
                  <Link href={orgUrl} target="_blank">
                    {pluginDetail.repository.organization_display_name}
                  </Link>
                ),
              },
            ]}
          />
          <Markdown>{pluginDetail.readme}</Markdown>
        </>
      )}
    </>
  );
}

function fetchHeadlampPluginDetail(repoName: string, pluginName: string, version?: string) {
  // ArtifactHub serves a specific version's metadata (including its readme) when the
  // version is appended as a path segment; without it the latest version is returned.
  // Encode each path segment so special characters don't break the proxied request.
  const basePath = `https://artifacthub.io/api/v1/packages/headlamp/${encodeURIComponent(
    repoName
  )}/${encodeURIComponent(pluginName)}`;
  const url = version ? `${basePath}/${encodeURIComponent(version)}` : basePath;

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
  // The version selected for installation; defaults to the latest once details load.
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  // Tracks the most recent version-readme request so out-of-order responses are ignored.
  const latestReadmeRequest = React.useRef<string>('');
  const url = `https://artifacthub.io/packages/headlamp/${repoName}/${pluginName}`;
  const { t } = useTranslation();

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
              ? t('{{action}} completed successfully.', { action: t(currentAction ?? '') })
              : t('Error: {{message}}', { message: status.message })
          );

          break;
        }
        // @todo: PluginManager ProgressResp doesn't have a percentage.
        // if (status.percentage !== undefined) {
        //   setCurrentActionProgress(status.percentage);
        // }
        setCurrentActionState(status.type);
        setCurrentActionMessage(status.message);

        await new Promise(resolve => setTimeout(resolve, 1000));
        status = await PluginManager.getStatus(identifier);
      }
    } catch (error) {
      setCurrentActionState(null);
      setCurrentActionMessage(null);
      setCurrentActionProgress(0);
      setAlertMessage(t('An unexpected error occurred: {{error}}', { error: String(error) }));
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
        // Default to the latest version, but don't override a version the user
        // has already picked (this runs again whenever currentAction changes).
        setSelectedVersion(prev => prev || enrichedPluginData.version);
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

  const handleInstall = (pluginName: string, version?: string) => {
    setCurrentAction('Install');
    // ArtifactHub serves a specific version's metadata at the same URL with the
    // version appended as a path segment, which the desktop backend resolves.
    const installURL = version ? `${url}/${encodeURIComponent(version)}` : url;
    PluginManager.install(identifier, pluginName, installURL);
  };

  const handleVersionChange = async (version: string) => {
    setSelectedVersion(version);
    latestReadmeRequest.current = version;
    try {
      const versionDetail = await fetchHeadlampPluginDetail(repoName, pluginName, version);
      // Ignore the response if the user has since selected another version.
      if (latestReadmeRequest.current !== version) {
        return;
      }
      setPluginDetail(prev => (prev ? { ...prev, readme: versionDetail.readme } : prev));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setAlertMessage(
        t('Failed to load details for version {{version}}: {{message}}', { version, message })
      );
    }
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
      selectedVersion={selectedVersion}
      onVersionChange={handleVersionChange}
      onInstall={(version: string) => handleInstall(pluginDetail!.display_name, version)}
      onUpdate={handleUpdate}
      onUninstall={handleUninstall}
      onCancel={handleCancel}
      onAlertClose={handleAlertClose}
    />
  );
}

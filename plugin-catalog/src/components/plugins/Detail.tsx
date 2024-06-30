import { PluginManager, Router } from '@kinvolk/headlamp-plugin/lib';
import {
  ActionButton,
  Loader,
  NameValueTable,
  SectionBox,
  SectionHeader,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Button, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useParams } from 'react-router';
import semver from 'semver';
import LoadingButton from './LoadingButton';

const { createRouteURL } = Router;

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

/**
 * PluginDetailResp interface represents the response from the Artifact Hub API for a plugin detail.
 * For more information refer:
 * https://artifacthub.github.io/hub/api/#/Packages/getHeadlampPluginDetails
 */
interface PluginDetailResp {
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
  };
  stats: {
    subscriptions: number;
    webhooks: number;
  };
  production_organizations_count: number;
  relative_path: string;
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
          const enrichedPluginData = await checkIfPluginIsInstalled(pluginDetail);
          setPluginDetail(enrichedPluginData);
          setCurrentActionState(null);
          setCurrentActionMessage(null);
          setCurrentActionProgress(0);
          setCurrentAction(null);
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
      fetchStatus(); // Fetch status when an action is triggered
    }
  }, [currentAction]);

  const handleInstall = () => {
    setCurrentAction('Install');
    PluginManager.install(identifier, url);
  };

  const handleUpdate = (pluginName: string) => {
    setCurrentAction('Update');
    PluginManager.update(identifier, pluginName);
  };

  const handleUninstall = (pluginName: string) => {
    setCurrentAction('Uninstall');
    PluginManager.uninstall(identifier, pluginName);
  };

  return (
    <>
      <SectionBox
        title={
          <SectionHeader
            title={pluginDetail ? pluginDetail.display_name : pluginName}
            actions={[
              currentAction === null ? (
                pluginDetail ? (
                  pluginDetail.isInstalled ? (
                    <>
                      <ActionButton
                        description="Upgrade"
                        onClick={() => handleUpdate(pluginDetail.packageName)}
                        icon="mdi:arrow-up-bold"
                        iconButtonProps={{ disabled: !pluginDetail.updateAvailable }}
                      />
                      <ActionButton
                        description="Uninstall"
                        onClick={() => handleUninstall(pluginDetail.packageName)}
                        icon="mdi:delete"
                      />
                    </>
                  ) : (
                    <Button
                      sx={{ backgroundColor: '#000', color: 'white', textTransform: 'none' }}
                      onClick={handleInstall}
                    >
                      Install
                    </Button>
                  )
                ) : null
              ) : (
                <>
                  <LoadingButton
                    progress={currentActionProgress}
                    onCancel={() => {
                      PluginManager.cancel(identifier);
                      setCurrentAction(null);
                    }}
                  />
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
              { name: 'App Version', value: pluginDetail.version },
              { name: 'Repository', value: pluginDetail.repository.name },
              { name: 'Current Version', value: pluginDetail.currentVersion },
            ]}
          />
          <ReactMarkdown>{pluginDetail.readme}</ReactMarkdown>
        </>
      )}
    </>
  );
}

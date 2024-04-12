import { Router, runPluginCommand } from '@kinvolk/headlamp-plugin/lib';
import {
  ActionButton,
  Dialog,
  Loader,
  NameValueTable,
  SectionBox,
  SectionHeader,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Button, DialogContent, DialogContentText, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useParams } from 'react-router';
import semver from 'semver';

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
    .then(response => {
      if (response.ok) {
        return response.json();
      }
    })
    .catch(error => {
      throw new Error(`Request failed!${error}`);
    });
}

interface InstalledPluginList {
  pluginName: string;
  pluginVersion: string;
  folderName: string;
  artifacthubURL: string;
  repoName: string;
  artifacthubVersion: string;
}

async function checkIfPluginIsInstalled(pluginDetail: PluginDetailResp) {
  try {
    const headlampPlugin = runPluginCommand('list');
    const data = await new Promise<string>((resolve, reject) => {
      headlampPlugin.stdout.on('data', (data: string) => {
        resolve(data);
      });
      headlampPlugin.stderr.on('data', (data: string) => {
        reject(data);
      });
    });

    const parsedData = JSON.parse(data) as InstalledPluginList[];

    const currentPlugin =
      parsedData.find(plugin => plugin.folderName === pluginDetail.name) || null;
    pluginDetail.isInstalled = false;
    pluginDetail.currentVersion = '';
    pluginDetail.packageName = '';
    pluginDetail.updateAvailable = false;

    if (currentPlugin) {
      pluginDetail.isInstalled = true;
      pluginDetail.packageName = currentPlugin?.pluginName;
      pluginDetail.currentVersion = currentPlugin?.artifacthubVersion;
      if (semver.gt(pluginDetail.version, currentPlugin?.artifacthubVersion)) {
        pluginDetail.updateAvailable = true;
      }
    }

    return pluginDetail;
  } catch (error) {
    return pluginDetail;
  }
}

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

interface PluginCommandStep {
  message: string;
  status: string;
}

export function PluginDetail() {
  const { repoName, pluginName } = useParams<{ repoName: string; pluginName: string }>();
  const [pluginDetail, setPluginDetail] = useState<PluginDetailResp | null>(null);
  const [currentAction, setCurrentAction] = useState<'Install' | 'Uninstall' | 'Update' | null>(
    null
  );
  const [currentActionMessage, setCurrentActionMessage] = useState<string | null>(null);
  const [currentActionState, setCurrentActionState] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const url = `https://artifacthub.io/packages/headlamp/${repoName}/${pluginName}`;

  function handleInstall(url) {
    setOpenDialog(true);
    setCurrentAction('Install');
    const headlampPlugin = runPluginCommand('install', url);

    headlampPlugin.stdout.on('data', (data: string) => {
      const parsedData = JSON.parse(data) as PluginCommandStep;
      setCurrentActionMessage(parsedData.message);
      setCurrentActionState(parsedData.status);
    });
    headlampPlugin.stderr.on('data', (data: string) => {
      setCurrentActionMessage(data);
      setCurrentActionState('error');
    });
  }

  function handleUpdate(pluginName) {
    setOpenDialog(true);
    setCurrentAction('Update');

    const headlampPlugin = runPluginCommand('update', pluginName);

    headlampPlugin.stdout.on('data', (data: string) => {
      const parsedData = JSON.parse(data) as PluginCommandStep;
      setCurrentActionMessage(parsedData.message);
      setCurrentActionState(parsedData.status);
    });
    headlampPlugin.stderr.on('data', (data: string) => {
      setCurrentActionMessage(data);
      setCurrentActionState('error');
    });
  }

  function handleUninstall(pluginName) {
    setOpenDialog(true);
    setCurrentAction('Uninstall');

    const headlampPlugin = runPluginCommand('uninstall', pluginName);

    headlampPlugin.stdout.on('data', (data: string) => {
      const parsedData = JSON.parse(data) as PluginCommandStep;
      setCurrentActionMessage(parsedData.message);
      setCurrentActionState(parsedData.status);
    });
    headlampPlugin.stderr.on('data', (data: string) => {
      setCurrentActionMessage(data);
      setCurrentActionState('error');
    });
  }

  useEffect(() => {
    fetchHeadlampPluginDetail(repoName, pluginName).then(async data => {
      const enrichedPluginData = await checkIfPluginIsInstalled(data);
      setPluginDetail(enrichedPluginData);
    });
  }, [openDialog]);

  function handleDialogClose() {
    setCurrentAction(null);
    setCurrentActionState(null);
    setCurrentActionMessage(null);
    setOpenDialog(false);
  }

  return (
    <>
      <Dialog
        open={openDialog}
        maxWidth="sm"
        title={currentAction ? `${currentAction} Plugin` : ''}
        onClose={() => handleDialogClose()}
      >
        <DialogContent>
          <DialogContentText
            sx={{
              'text-align': 'center',
            }}
          >
            {(currentActionState !== 'success' && currentActionState !== 'error') ||
            currentActionState === null ? (
              <Loader title="" />
            ) : (
              <></>
            )}
            <Typography variant="h5" component="h2">
              {currentActionState &&
                currentActionState.charAt(0).toUpperCase() + currentActionState.slice(1)}
            </Typography>
            <Typography variant="body1" component="p">
              {currentActionMessage}
            </Typography>
          </DialogContentText>
        </DialogContent>
      </Dialog>
      <SectionBox
        title={
          <SectionHeader
            title={pluginDetail ? pluginDetail.display_name : pluginName}
            actions={[
              pluginDetail ? (
                pluginDetail?.isInstalled ? (
                  <>
                    <ActionButton
                      description={'Upgrade'}
                      onClick={() => handleUpdate(pluginDetail?.packageName)}
                      icon="mdi:arrow-up-bold"
                      iconButtonProps={{ disabled: !pluginDetail.updateAvailable }}
                    />
                    <ActionButton
                      description={'Uninstall'}
                      onClick={() => handleUninstall(pluginDetail?.packageName)}
                      icon="mdi:delete"
                    />
                  </>
                ) : (
                  <Button
                    style={{
                      backgroundColor: '#000',
                      color: 'white',
                      textTransform: 'none',
                    }}
                    variant="contained"
                    color="primary"
                    onClick={() => handleInstall(url)}
                  >
                    Install
                  </Button>
                )
              ) : (
                <></>
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
              { name: 'Repository', value: pluginDetail.repository?.name },
              { name: 'Current Version', value: pluginDetail.currentVersion },
            ]}
          />
          <ReactMarkdown>{pluginDetail.readme}</ReactMarkdown>
        </>
      )}
    </>
  );
}

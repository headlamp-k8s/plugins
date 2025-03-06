// src/components/PluginInstalledList.tsx

import { PluginManager } from '@kinvolk/headlamp-plugin/lib';
import { Link, SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Typography } from '@mui/material';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

// this will need to import the store from the main project after everything is merged in from the refactor

interface Plugin {
  pluginName: string;
  pluginTitle: string;
  pluginVersion: string;
  folderName: boolean;
  repoName: string;
  author: string;
}

export interface PurePluginInstalledListProps {
  installedPlugins: Plugin[] | null;
  otherInstalledPlugins: any[] | null;
  error: string | null;
}

export function PurePluginInstalledList({
  installedPlugins,
  otherInstalledPlugins,
  error,
}: PurePluginInstalledListProps) {
  return (
    <SectionBox
      title="Installed"
      paddingTop={2}
      headerProps={{
        noPadding: false, headerStyle: 'subsection',
        actions: [
          <Link routeName="plugins">Go to all installed plugins</Link>,
        ]
      }}
    >
      {error ? (
        <Typography>{`Error loading Installed plugins: ${error}`}</Typography>
      ) : (
        <>
          <Typography component="h2">
            Plugins installed from the Plugin Catalog.
          </Typography>
          <SimpleTable
            columns={[
              {
                label: 'Name',
                getter: plugin => (
                  <Box>
                    <Link
                      routeName="/plugin-catalog/:repoName/:pluginName"
                      params={{ repoName: plugin.repoName, pluginName: plugin.folderName }}
                    >
                      {plugin.pluginTitle}
                    </Link>
                  </Box>
                ),
              },
              {
                label: 'Version',
                getter: plugin => plugin.pluginVersion,
              },
              {
                label: 'Repo',
                getter: plugin => plugin.repoName,
              },
              {
                label: 'Author',
                getter: plugin => plugin.author,
              },
            ]}
            emptyMessage="No plugins installed"
            data={installedPlugins || []}
          />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                alignItems: 'start',
              }}
            >
              <Typography variant="h6" components="h2">
                Installed from the Plugin Catalog
              </Typography>
              <SimpleTable
                columns={[
                  {
                    label: 'Name',
                    getter: plugin => (
                      <Box>
                        <Link
                          routeName="/plugin-catalog/:repoName/:pluginName"
                          params={{ repoName: plugin.repoName, pluginName: plugin.folderName }}
                        >
                          {plugin.pluginTitle}
                        </Link>
                      </Box>
                    ),
                  },
                  {
                    label: 'Version',
                    getter: plugin => plugin.pluginVersion,
                  },
                  {
                    label: 'Repo',
                    getter: plugin => plugin.repoName,
                  },
                  {
                    label: 'Author',
                    getter: plugin => plugin.author,
                  },
                ]}
                emptyMessage="No plugins installed"
                data={installedPlugins || []}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                alignItems: 'start',
              }}
            >
              <Typography variant="h6" components="h2">
                Other Installed Plugins
              </Typography>

              <SimpleTable
                columns={[
                  {
                    label: 'Name',
                    getter: otherInstalledPlugins => (
                      <Box>
                        <Link
                          routeName={`pluginDetails`}
                          params={{ name: otherInstalledPlugins.name }}
                        >
                          {otherInstalledPlugins.name}
                        </Link>
                      </Box>
                    ),
                  },
                  {
                    label: 'Version',
                    getter: otherInstalledPlugins => otherInstalledPlugins.version,
                  },
                  {
                    label: 'Repo',
                    getter: plugin => plugin.repoName,
                  },
                  {
                    label: 'Author',
                    getter: plugin => plugin.author,
                  },
                ]}
                emptyMessage="No plugins installed"
                data={otherInstalledPlugins || []}
              />
            </Box>
          </Box>
        </>
      )}
    </SectionBox>
  );
}

export function PluginInstalledList() {

  // const mainPlugins = useTypedSelector(state => state.plugins.PluginSettings);

  const [installedPlugins, setInstalledPlugins] = useState<Plugin[] | null>(null);
  const [otherInstalledPlugins, setOtherInstalledPlugins] = useState<Plugin[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pluginInfo = useSelector((state: any) => state.plugins.pluginSettings);

  console.log("WORKING", pluginInfo);

  useEffect(() => {
    async function fetchInstalledPlugins() {
      try {
        const data = await PluginManager.list();
        setInstalledPlugins(data);
      } catch (error: any) {
        // @todo: We should have a better way to determine if the error is an ENOENT
        if (error.message.startsWith('ENOENT')) {
          setInstalledPlugins([]);
        } else {
          setError(error.message);
        }
      }
    }

    function fetchOtherInstalledPlugins() {
      const storedPlugins = localStorage.getItem('headlampPluginSettings');
      if (storedPlugins) {
        const parsedPlugins = JSON.parse(storedPlugins);
        setOtherInstalledPlugins(parsedPlugins);
      } else {
        setOtherInstalledPlugins([]);
      }
    }

    fetchInstalledPlugins();
    fetchOtherInstalledPlugins();
  }, []);

  return (
    <PurePluginInstalledList
      installedPlugins={installedPlugins}
      otherInstalledPlugins={otherInstalledPlugins}
      error={error}
    />
  );
}


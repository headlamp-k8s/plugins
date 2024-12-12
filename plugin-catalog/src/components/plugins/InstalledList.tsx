// src/components/PluginInstalledList.tsx

import { PluginManager } from '@kinvolk/headlamp-plugin/lib';
import { Link, SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Typography } from '@mui/material';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';

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
  error: string | null;
}

export function PurePluginInstalledList({ installedPlugins, error }: PurePluginInstalledListProps) {
  return (
    <SectionBox
      title="Installed"
      paddingTop={2}
      headerProps={{
        noPadding: false, headerStyle: 'subsection' ,
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
        </>
      )}
    </SectionBox>
  );
}

export function PluginInstalledList() {
  const [installedPlugins, setInstalledPlugins] = useState<Plugin[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    fetchInstalledPlugins();
  }, []);

  return <PurePluginInstalledList installedPlugins={installedPlugins} error={error} />;
}

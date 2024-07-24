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
    <SectionBox title="Installed" textAlign="center" paddingTop={2}>
      {error ? (
        <Typography>{`Error loading Installed plugins: ${error}`}</Typography>
      ) : (
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
          emptyMessage='No plugins installed'
          data={installedPlugins || []}
        />
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
        setError(error.message);
      }
    }

    fetchInstalledPlugins();
  }, []);

  return <PurePluginInstalledList installedPlugins={installedPlugins} error={error} />;
}

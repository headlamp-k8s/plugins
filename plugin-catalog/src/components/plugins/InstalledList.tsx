import { runPluginCommand } from '@kinvolk/headlamp-plugin/lib';
import { Link, SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';

interface Plugin {
  pluginName: string;
  pluginTitle: string;
  pluginVersion: string;
  folderName: boolean;
}

export function PluginInstalledList() {
  const [installedPlugins, setInstalledPlugins] = useState<Plugin[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const headlampPlugin = runPluginCommand('list');
    headlampPlugin.stdout.on('data', (data: string) => {
      const plugins = JSON.parse(data);
      setInstalledPlugins(plugins);
    });
    headlampPlugin.stderr.on('data', (data: string) => {
      setError(data);
    });
  }, []);

  return (
    <SectionBox title="Installed" textAlign="center" paddingTop={2}>
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
        ]}
        data={installedPlugins}
        errorMessage={error && `Error loading Installed plugins: ${error}`}
      />
    </SectionBox>
  );
}

// import { runPluginCommand } from '@kinvolk/headlamp-plugin/lib';
import { PluginManager } from '@kinvolk/headlamp-plugin/lib';
import { Link, SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';

/**
 * Plugin interface represents the installed plugin detail.
 *
 * @property {string} pluginName - The name of the plugin.
 * @property {string} pluginTitle - The title of the plugin.
 * @property {string} pluginVersion - The version of the plugin.
 * @property {boolean} folderName - The name of the folder containing the plugin. It's a boolean indicating whether the folder exists or not.
 */
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
    async function fetchInstalledPlugins() {
      try {
        const data = await PluginManager.list();
        setInstalledPlugins(data);
      } catch (error) {
        setError(error);
      }
    }

    fetchInstalledPlugins();
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

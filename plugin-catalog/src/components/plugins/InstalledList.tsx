// src/components/PluginInstalledList.tsx

import { PluginManager } from '@kinvolk/headlamp-plugin/lib';
import { Link, SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Chip, Link as MuiLink, Typography } from '@mui/material';
import { Box } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import semver from 'semver';
import { fetchOrgPlugins, PluginPackage } from './List';

interface Plugin {
  pluginName: string;
  pluginTitle: string;
  pluginVersion: string;
  folderName: string;
  repoName: string;
  author: string;
  artifacthubVersion: string;
}

export interface PurePluginInstalledListProps {
  catalogPlugins: Plugin[] | null;
  nonCatalogPlugins: PluginInfo[] | null;
  availableVersions: Record<string, string>;
  error: string | null;
}

export type PluginInfo = {
  name: string;
  displayName?: string;
  origin?: string;
  repository?: any;
  version?: string;
  artifacthub?: boolean;
};

function hasUpdate(plugin: Plugin, availableVersions: Record<string, string>): string | null {
  const availableVersion = availableVersions[plugin.folderName];
  if (!availableVersion || !plugin.artifacthubVersion) return null;
  if (semver.valid(availableVersion) && semver.valid(plugin.artifacthubVersion)) {
    return semver.gt(availableVersion, plugin.artifacthubVersion) ? availableVersion : null;
  }
  return null;
}

export function PurePluginInstalledList({
  catalogPlugins,
  nonCatalogPlugins,
  availableVersions,
  error,
}: PurePluginInstalledListProps) {
  return (
    <SectionBox
      title="Installed"
      paddingTop={2}
      headerProps={{
        noPadding: false,
        headerStyle: 'subsection',
        actions: [<Link routeName="plugins">Go to all installed plugins</Link>],
      }}
    >
      {error ? (
        <Typography>{`Error loading Installed plugins: ${error}`}</Typography>
      ) : (
        <>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h6" component="h2">
                From the Plugin Catalog
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
                    getter: plugin => {
                      const newVersion = hasUpdate(plugin, availableVersions);
                      return (
                        <Box display="flex" alignItems="center" gap={1}>
                          {plugin.pluginVersion}
                          {newVersion && (
                            <Chip
                              label={`v${newVersion} available`}
                              color="primary"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      );
                    },
                  },
                  {
                    label: 'Repository',
                    getter: plugin => plugin.repoName,
                  },
                ]}
                emptyMessage="No plugins installed from the Plugin Catalog"
                data={catalogPlugins || []}
              />
            </Box>

            <Box>
              <Typography variant="h6" component="h2">
                Other Plugins
              </Typography>

              <SimpleTable
                columns={[
                  {
                    label: 'Name',
                    getter: otherInstalledPlugins => (
                      <Box>
                        <Link
                          routeName="pluginDetails"
                          params={{ name: otherInstalledPlugins.name }}
                        >
                          {otherInstalledPlugins.displayName}
                        </Link>
                      </Box>
                    ),
                  },
                  {
                    label: 'Version',
                    getter: otherInstalledPlugins => otherInstalledPlugins.version,
                  },
                  {
                    label: 'Author',
                    getter: plugin => {
                      const url = plugin?.homepage || plugin?.repository?.url;
                      return plugin?.origin ? (
                        url ? (
                          <MuiLink href={url}>{plugin.origin}</MuiLink>
                        ) : (
                          plugin?.origin
                        )
                      ) : (
                        'Unknown'
                      );
                    },
                  },
                ]}
                emptyMessage="No plugins installed"
                data={nonCatalogPlugins || []}
              />
            </Box>
          </Box>
        </>
      )}
    </SectionBox>
  );
}

async function fetchAvailableVersions(): Promise<Record<string, string>> {
  try {
    const packages: PluginPackage[] = await fetchOrgPlugins('headlamp');
    const versions: Record<string, string> = {};
    for (const pkg of packages) {
      versions[pkg.name] = pkg.version;
    }
    return versions;
  } catch {
    return {};
  }
}

export function PluginInstalledList() {
  const [catalogPlugins, setCatalogPlugins] = useState<Plugin[] | null>(null);
  const [availableVersions, setAvailableVersions] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const allInstalledPlugins = useSelector((state: any) => state.plugins.pluginSettings);
  const nonCatalogPlugins = useMemo(() => {
    const pluginList = allInstalledPlugins.filter((plugin: PluginInfo) => !plugin.artifacthub);

    // Let's ensure we split the origin from the name
    return pluginList.map((plugin: PluginInfo) => {
      const [author, name] = plugin.name.includes('@')
        ? plugin.name.split(/\/(.+)/)
        : [null, plugin.name];

      return {
        ...plugin,
        displayName: name ?? plugin.name,
        origin: plugin.origin ?? author?.substring(1) ?? 'Unknown',
      };
    });
  }, [allInstalledPlugins]);

  useEffect(() => {
    async function fetchInstalledPlugins() {
      try {
        // @todo: Note: PluginManager.list is badly typed at time of writing
        const data = (await PluginManager.list()) as Plugin[];
        setCatalogPlugins(data);
      } catch (error: any) {
        // @todo: We should have a better way to determine if the error is an ENOENT
        if (error.message.startsWith('ENOENT')) {
          setCatalogPlugins([]);
        } else {
          setError(error.message);
        }
      }
    }

    fetchInstalledPlugins();
    fetchAvailableVersions().then(setAvailableVersions);
  }, []);

  return (
    <PurePluginInstalledList
      catalogPlugins={catalogPlugins}
      nonCatalogPlugins={nonCatalogPlugins}
      availableVersions={availableVersions}
      error={error}
    />
  );
}

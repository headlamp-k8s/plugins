// src/components/PluginInstalledList.tsx

import { PluginManager, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Link, SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Link as MuiLink, Typography } from '@mui/material';
import { Box } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

interface Plugin {
  pluginName: string;
  pluginTitle: string;
  pluginVersion: string;
  folderName: boolean;
  repoName: string;
  author: string;
}

export interface PurePluginInstalledListProps {
  catalogPlugins: Plugin[] | null;
  nonCatalogPlugins: PluginInfo[] | null;
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

export function PurePluginInstalledList({
  catalogPlugins,
  nonCatalogPlugins,
  error,
}: PurePluginInstalledListProps) {
  const { t } = useTranslation();
  return (
    <SectionBox
      title={t('Installed')}
      paddingTop={2}
      headerProps={{
        noPadding: false,
        headerStyle: 'subsection',
        actions: [<Link routeName="plugins">{t('Go to all installed plugins')}</Link>],
      }}
    >
      {error ? (
        <Typography>{t('Error loading Installed plugins: {{error}}', { error })}</Typography>
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
                {t('From the Plugin Catalog')}
              </Typography>
              <SimpleTable
                columns={[
                  {
                    label: t('Name'),
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
                    label: t('Version'),
                    getter: plugin => plugin.pluginVersion,
                  },
                  {
                    label: t('Repository'),
                    getter: plugin => plugin.repoName,
                  },
                ]}
                emptyMessage={t('No plugins installed from the Plugin Catalog')}
                data={catalogPlugins || []}
              />
            </Box>

            <Box>
              <Typography variant="h6" component="h2">
                {t('Other Plugins')}
              </Typography>

              <SimpleTable
                columns={[
                  {
                    label: t('Name'),
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
                    label: t('Version'),
                    getter: otherInstalledPlugins => otherInstalledPlugins.version,
                  },
                  {
                    label: t('Author'),
                    getter: plugin => {
                      const url = plugin?.homepage || plugin?.repository?.url;
                      return plugin?.origin ? (
                        url ? (
                          <MuiLink href={url}>{plugin.origin}</MuiLink>
                        ) : (
                          plugin?.origin
                        )
                      ) : (
                        t('Unknown')
                      );
                    },
                  },
                ]}
                emptyMessage={t('No plugins installed')}
                data={nonCatalogPlugins || []}
              />
            </Box>
          </Box>
        </>
      )}
    </SectionBox>
  );
}

export function PluginInstalledList() {
  const { t } = useTranslation();
  const [catalogPlugins, setCatalogPlugins] = useState<Plugin[] | null>(null);
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
        origin: plugin.origin ?? author?.substring(1) ?? t('Unknown'),
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
  }, []);

  return (
    <PurePluginInstalledList
      catalogPlugins={catalogPlugins}
      nonCatalogPlugins={nonCatalogPlugins}
      error={error}
    />
  );
}

import { PluginManager, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ConfirmDialog, SectionHeader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Loader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Alert, Box, Pagination, TextField } from '@mui/material';
import { Typography } from '@mui/material';
import { Switch } from '@mui/material';
import { FormControlLabel } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import semver from 'semver';
import { isAksOptimizedPlugin, useCatalogMode } from '../../aks';
import { configStore, PluginCatalogConfig, usePluginCatalogConfig } from '../../config';
import { getExternalProxyEndpoint } from './externalProxy';
import { fetchAllPages } from './pagination';
import { PluginCard } from './PluginCard';

const PAGE_SIZE = 60; // Maximum allowed by the API
const ARTIFACTHUB_HEADLAMP_PLUGIN_KIND = '21';
const ORGANIZATION_NAME = 'headlamp';

type PluginSearchResult = {
  packages: PluginPackage[];
  total?: number;
};

export interface PluginPackage {
  package_id: string;
  name: string;
  normalized_name: string;
  logo_image_id: string;
  stars: number;
  display_name: string;
  description: string;
  version: string;
  deprecated: boolean;
  has_values_schema: boolean;
  signed: boolean;
  production_organizations_count: number;
  ts: number;
  official: boolean;
  repository: {
    url: string;
    kind: number;
    name: string;
    official: boolean;
    user_alias: string;
    display_name: string;
    repository_id: string;
    scanner_disabled: boolean;
    verified_publisher: boolean;
    organization_name?: string;
  };
  isInstalled?: boolean;
  isUpdateAvailable?: boolean;
}

async function fetchPlugins(
  offset: number,
  config: PluginCatalogConfig,
  aksMode: boolean,
  org?: string
): Promise<PluginSearchResult> {
  const url = 'https://artifacthub.io/api/v1/packages/search';

  const params: Record<string, string> = {
    kind: ARTIFACTHUB_HEADLAMP_PLUGIN_KIND,
    limit: PAGE_SIZE.toString(),
    offset: offset.toString(),
  };

  if (org) {
    params.org = org;
  } else if (!aksMode) {
    const onlyOfficialPlugins = config?.displayOnlyOfficialPlugins ?? true;
    const onlyVerifiedPlugins = config?.displayOnlyVerifiedPlugins ?? true;

    params.official = onlyOfficialPlugins.toString();
    params.verified_publisher = onlyVerifiedPlugins.toString();
  }

  const queryString = new URLSearchParams(params).toString();
  const finalUrl = `${url}?${queryString}`;

  const response = await fetch(getExternalProxyEndpoint(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Forward-To': finalUrl,
    },
  });

  if (response.ok) {
    const data = await response.json();
    const total = data?.metadata?.total;

    return {
      packages: data.packages,
      total: Number.isFinite(total) && total > 0 ? total : undefined,
    };
  } else {
    throw new Error('Request failed');
  }
}

async function fetchAllPlugins(config: PluginCatalogConfig, aksMode: boolean) {
  return fetchAllPages(offset => fetchPlugins(offset, config, aksMode), PAGE_SIZE);
}

async function fetchOrgPlugins(org: string, config: PluginCatalogConfig, aksMode: boolean) {
  if (aksMode) {
    return fetchAllPages(offset => fetchPlugins(offset, config, aksMode, org), PAGE_SIZE);
  }
  const { packages } = await fetchPlugins(0, config, aksMode, org);
  return packages;
}

async function processPlugins(config: PluginCatalogConfig, aksMode: boolean) {
  const [allPlugins, orgPlugins] = await Promise.all([
    aksMode && config.displayOnlyAksOptimizedPlugins === false
      ? Promise.resolve([])
      : fetchAllPlugins(config, aksMode),
    fetchOrgPlugins(ORGANIZATION_NAME, config, aksMode),
  ]);

  let pluginData: Record<string, any>[] = [];
  try {
    // @todo: Note: PluginManager.list is badly typed at time of writing
    pluginData = (await PluginManager.list()) as Record<string, any>[];
  } catch (err) {
    console.log('plugin-catalog: Failed to list plugins', err);
  }
  const installedVersions: Record<string, string> = pluginData.reduce((acc, plugin) => {
    if (plugin.folderName && plugin.artifacthubVersion) {
      acc[plugin.folderName] = plugin.artifacthubVersion;
    }
    return acc;
  }, {});

  // Merge all plugins and org-specific plugins, removing duplicates
  const mergedPlugins = [...allPlugins, ...orgPlugins];
  const uniquePlugins = Array.from(
    new Map(mergedPlugins.map(plugin => [plugin.package_id, plugin])).values()
  );

  const pluginsWithInstallStatus = uniquePlugins
    .map((pkg: PluginPackage) => {
      const installedVersion = installedVersions[pkg.name];
      let isInstalled = false;
      let isUpdateAvailable = false;

      if (installedVersion) {
        isInstalled = true;
        if (semver.valid(pkg.version) && semver.valid(installedVersion)) {
          isUpdateAvailable = semver.gt(pkg.version, installedVersion);
        }
      }

      return {
        ...pkg,
        isInstalled,
        isUpdateAvailable,
      };
    })
    // Reorder so plugins with logos show first.
    .sort((a, b) => (!!b.logo_image_id ? 1 : 0) - (!!a.logo_image_id ? 1 : 0));

  if (!aksMode) {
    return { plugins: pluginsWithInstallStatus };
  }
  return {
    plugins: pluginsWithInstallStatus.filter(plugin =>
      config.displayOnlyAksOptimizedPlugins !== false
        ? isAksOptimizedPlugin(plugin)
        : plugin.repository?.organization_name === ORGANIZATION_NAME
    ),
  };
}

export interface PurePluginListProps {
  aksMode?: boolean;
  plugins: PluginPackage[] | null;
  totalPages: number;
  page: number;
  search: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPageChange: (event: React.ChangeEvent<unknown>, page: number) => void;
  isOfficialSwitchChecked: boolean;
  onOfficialSwitchChange: (isChecked: boolean) => void;
}

interface CatalogFilterSwitchProps {
  aksMode?: boolean;
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
}

function CatalogFilterSwitch({ onChange, isChecked, aksMode = false }: CatalogFilterSwitchProps) {
  const { t } = useTranslation();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const label = aksMode ? t('AKS optimized') : t('Only Official');
  return (
    <>
      <FormControlLabel
        control={<Switch defaultChecked size="small" inputProps={{ 'aria-label': label }} />}
        label={<Typography>{label}</Typography>}
        checked={isChecked}
        onChange={() => {
          if (isChecked) {
            setIsConfirmOpen(true);
          } else {
            onChange(true);
          }
        }}
      />
      <ConfirmDialog
        // @ts-ignore
        open={isConfirmOpen}
        title={
          aksMode
            ? t('Do you want to show plugins that are not AKS optimized?')
            : t('Do you want to show non-official plugins?')
        }
        description={
          aksMode
            ? t(
                'Important: Plugins that are not AKS optimized are published by third parties and have not been validated for use with AKS Desktop. Are you sure you want to show them?'
              )
            : t(
                "Important: Non-official plugins may not be published by the actual projects they are related to, nor by Headlamp's maintainers. Are you sure you want to show them?"
              )
        }
        handleClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          onChange(false);
        }}
      />
    </>
  );
}

export function PurePluginList({
  aksMode = false,
  plugins,
  totalPages,
  page,
  search,
  onSearchChange,
  onPageChange,
  isOfficialSwitchChecked,
  onOfficialSwitchChange,
}: PurePluginListProps) {
  const { t } = useTranslation();
  return (
    <>
      <SectionHeader
        title={t('Plugins')}
        titleSideActions={[
          <Box pl={2}>
            <CatalogFilterSwitch
              key={aksMode ? 'aks' : 'headlamp'}
              aksMode={aksMode}
              isChecked={isOfficialSwitchChecked}
              onChange={onOfficialSwitchChange}
            />
          </Box>,
        ]}
        actions={[
          <TextField
            key="search"
            sx={{ width: '20vw', margin: '0 1rem' }}
            id="outlined-basic"
            label={t('Search')}
            value={search}
            onChange={onSearchChange}
          />,
        ]}
      />
      <Box
        display="flex"
        flexWrap="wrap"
        justifyContent="flex-start"
        alignContent="stretch"
        sx={{ gap: 2 }}
      >
        {plugins ? (
          plugins.length > 0 ? (
            plugins.map(plugin => <PluginCard key={plugin.package_id} plugin={plugin} />)
          ) : (
            <Box textAlign="center" paddingTop={2} sx={{ width: '100%' }}>
              <Typography align="center">{t('No plugins found')}</Typography>
            </Box>
          )
        ) : (
          <Box mt={2} mx="auto" maxWidth="max-content">
            <Loader title={t('Loading')} />
          </Box>
        )}
      </Box>
      {totalPages > 1 && (
        <Box mt={2} mx="auto" maxWidth="max-content">
          <Pagination
            size="large"
            shape="rounded"
            page={page}
            count={totalPages}
            color="primary"
            onChange={onPageChange}
          />
        </Box>
      )}
    </>
  );
}

export function PluginList() {
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<{ key: string; plugins: PluginPackage[] } | null>(null);
  const [error, setError] = useState<{ key: string } | null>(null);
  const [page, setPage] = useState(1);
  const conf = usePluginCatalogConfig();
  const mode = useCatalogMode();
  const aksMode = mode === 'aks';
  const onlyOfficial = conf?.displayOnlyOfficialPlugins ?? true;
  const onlyVerified = conf?.displayOnlyVerifiedPlugins ?? true;
  const onlyAksOptimized = conf?.displayOnlyAksOptimizedPlugins ?? true;
  const key = aksMode ? `aks:${onlyAksOptimized}` : `${mode}:${onlyOfficial}:${onlyVerified}`;
  const { t } = useTranslation();

  useEffect(() => {
    if (mode === 'loading') return;
    let active = true;
    setPage(1);
    const fetchAndProcessPlugins = async () => {
      try {
        const { plugins } = await processPlugins(
          {
            displayOnlyOfficialPlugins: onlyOfficial,
            displayOnlyVerifiedPlugins: onlyVerified,
            displayOnlyAksOptimizedPlugins: onlyAksOptimized,
          },
          aksMode
        );
        if (active) {
          setResult({ key, plugins });
          setError(null);
        }
      } catch (error) {
        console.error('plugin-catalog: Failed to fetch plugins', error);
        if (active) setError({ key });
      }
    };
    fetchAndProcessPlugins();
    return () => {
      active = false;
    };
  }, [mode, aksMode, onlyOfficial, onlyVerified, onlyAksOptimized, key]);

  const allPlugins = result?.key === key ? result.plugins : null;

  const filteredPlugins = useMemo(() => {
    if (!allPlugins) return null;
    return allPlugins.filter(
      plugin =>
        plugin.name.toLowerCase().includes(search.toLowerCase()) ||
        plugin.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [allPlugins, search]);

  const paginatedPlugins = useMemo(() => {
    if (!filteredPlugins) return null;
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredPlugins.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredPlugins, page]);

  const totalPages = useMemo(() => {
    if (!filteredPlugins) return 0;
    return Math.ceil(filteredPlugins.length / PAGE_SIZE);
  }, [filteredPlugins]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  return (
    <>
      {error?.key === key && <Alert severity="error">{t('Failed to fetch plugins')}</Alert>}
      <PurePluginList
        aksMode={aksMode}
        plugins={paginatedPlugins}
        totalPages={totalPages}
        page={page}
        search={search}
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
        isOfficialSwitchChecked={aksMode ? onlyAksOptimized : onlyOfficial}
        onOfficialSwitchChange={(isChecked: boolean) => {
          configStore.update(
            aksMode
              ? { displayOnlyAksOptimizedPlugins: isChecked }
              : { displayOnlyOfficialPlugins: isChecked }
          );
        }}
      />
    </>
  );
}

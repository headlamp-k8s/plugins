import { PluginManager } from '@kinvolk/headlamp-plugin/lib';
import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';
import { ConfirmDialog, SectionHeader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Loader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Pagination, TextField } from '@mui/material';
import { Typography } from '@mui/material';
import { Switch } from '@mui/material';
import { FormControlLabel } from '@mui/material';
import { isEqual } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import semver from 'semver';
import { PluginCard } from './PluginCard';

const PAGE_SIZE = 60; // Maximum allowed by the API
const ARTIFACTHUB_HEADLAMP_PLUGIN_KIND = '21';
const ORGANIZATION_NAME = 'headlamp';

type conf = {
  displayOnlyOfficialPlugins: boolean;
  displayOnlyVerifiedPlugins: boolean;
};

const configStore = new ConfigStore<conf>('@headlamp-k8s/plugin-catalog');

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

async function fetchPlugins(offset: number, org?: string) {
  const url = 'https://artifacthub.io/api/v1/packages/search';

  const params: Record<string, string> = {
    kind: ARTIFACTHUB_HEADLAMP_PLUGIN_KIND,
    limit: PAGE_SIZE.toString(),
    offset: offset.toString(),
  };

  if (org) {
    params.org = org;
  } else {
    const config = configStore.get();
    const onlyOfficialPlugins = config?.displayOnlyOfficialPlugins ?? true;
    const onlyVerifiedPlugins = config?.displayOnlyVerifiedPlugins ?? true;

    params.official = onlyOfficialPlugins.toString();
    params.verified_publisher = onlyVerifiedPlugins.toString();
  }

  const queryString = new URLSearchParams(params).toString();
  const finalUrl = `${url}?${queryString}`;

  const response = await fetch(`http://localhost:4466/externalproxy`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Forward-To': finalUrl,
    },
  });

  if (response.ok) {
    const data = await response.json();
    return { packages: data.packages, total: data?.metadata?.total ?? 0 };
  } else {
    throw new Error('Request failed');
  }
}

async function fetchAllPlugins() {
  let allPlugins: PluginPackage[] = [];
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const { packages, total: newTotal } = await fetchPlugins(offset);
    allPlugins = [...allPlugins, ...packages];
    total = newTotal;
    offset += PAGE_SIZE;

    if (packages.length < PAGE_SIZE) {
      break;
    }
  }

  return allPlugins;
}

async function fetchOrgPlugins(org: string) {
  const { packages } = await fetchPlugins(0, org);
  return packages;
}

async function processPlugins() {
  const [allPlugins, orgPlugins] = await Promise.all([
    fetchAllPlugins(),
    fetchOrgPlugins(ORGANIZATION_NAME),
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

  const totalPages = Math.ceil(pluginsWithInstallStatus.length / PAGE_SIZE);

  return { plugins: pluginsWithInstallStatus, totalPages };
}

export interface PurePluginListProps {
  plugins: PluginPackage[] | null;
  totalPages: number;
  page: number;
  search: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPageChange: (event: React.ChangeEvent<unknown>, page: number) => void;
  isOfficialSwitchChecked: boolean;
  onOfficialSwitchChange: (isChecked: boolean) => void;
}

interface OfficialSwitchProps {
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
}

function OfficialSwitch(props: OfficialSwitchProps) {
  const { onChange: onOfficialSwitchChange, isChecked } = props;
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  return (
    <>
      <FormControlLabel
        control={<Switch defaultChecked size="small" />}
        label={<Typography>Only Official</Typography>}
        checked={isChecked}
        onChange={() => {
          if (isChecked) {
            setIsConfirmOpen(true);
          } else {
            onOfficialSwitchChange(true);
          }
        }}
      />
      <ConfirmDialog
        // @ts-ignore
        open={isConfirmOpen}
        title="Do you want to show non-official plugins?"
        description="Important: Non-official plugins may not be published by the actual projects they are related to, nor by Headlamp's maintainers. Are you sure you want to show them?"
        handleClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          onOfficialSwitchChange(false);
        }}
      />
    </>
  );
}

export function PurePluginList({
  plugins,
  totalPages,
  page,
  search,
  onSearchChange,
  onPageChange,
  isOfficialSwitchChecked,
  onOfficialSwitchChange,
}: PurePluginListProps) {
  return (
    <>
      <SectionHeader
        title="Plugins"
        titleSideActions={[
          <Box pl={2}>
            <OfficialSwitch isChecked={isOfficialSwitchChecked} onChange={onOfficialSwitchChange} />
          </Box>,
        ]}
        actions={[
          <TextField
            key="search"
            sx={{ width: '20vw', margin: '0 1rem' }}
            id="outlined-basic"
            label="Search"
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
              <Typography align="center">No plugins found</Typography>
            </Box>
          )
        ) : (
          <Box mt={2} mx="auto" maxWidth="max-content">
            <Loader title="Loading" />
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
  const [allPlugins, setAllPlugins] = useState<PluginPackage[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const conf = configStore.useConfig()();
  const [fetchSettings, setFetchSettings] = useState<conf | null>({
    displayOnlyOfficialPlugins: true,
    displayOnlyVerifiedPlugins: true,
  });

  useEffect(() => {
    const fetchAndProcessPlugins = async () => {
      const { plugins, totalPages } = await processPlugins();
      setAllPlugins(plugins);
      setTotalPages(totalPages);
      console.log(plugins, totalPages);
    };
    fetchAndProcessPlugins();
  }, [fetchSettings]);

  useEffect(() => {
    if (!conf) {
      return;
    }

    setFetchSettings(oldSettings => {
      const newSettings = {
        ...oldSettings,
        ...conf,
      };

      if (!isEqual(oldSettings, newSettings)) {
        return newSettings;
      }

      return oldSettings;
    });
  }, [conf]);

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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  return (
    <PurePluginList
      plugins={paginatedPlugins}
      totalPages={totalPages}
      page={page}
      search={search}
      onSearchChange={handleSearchChange}
      onPageChange={handlePageChange}
      isOfficialSwitchChecked={conf?.displayOnlyOfficialPlugins ?? true}
      onOfficialSwitchChange={(isChecked: boolean) => {
        configStore.update({ displayOnlyOfficialPlugins: isChecked });
      }}
    />
  );
}

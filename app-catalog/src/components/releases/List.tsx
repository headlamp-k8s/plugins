import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
// import { getCluster } from '@kinvolk/headlamp-plugin/lib/util';
import {
  DateLabel,
  Link,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { fetchLatestAppVersion } from '../../api/charts';
import { listReleases } from '../../api/releases';

/**
 * @returns formatted version string
 * @param v - version string
 */
function formatVersion(v?: string) {
  const s = (v ?? '').trim();

  if (!s || s === '—') {
    return '—';
  }

  return s;
}

/**
 * ReleaseList component displays a list of installed Helm releases.
 *
 * @param props - Component properties.
 * @param [props.fetchReleases=listReleases] - Function to fetch the list of releases.
 * @returns ReleaseList component.
 */
export default function ReleaseList({ fetchReleases = listReleases }) {
  const { t } = useTranslation();
  const [releases, setReleases] = useState<Array<any> | null>(null);
  const [latestMap, setLatestMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchReleases().then(response => {
      if (!response.releases) {
        setReleases([]);
        return;
      }
      setReleases(response.releases);
    });
  }, []);

  useEffect(() => {
    if (!releases?.length) {
      setLatestMap({});
      return;
    }

    Promise.all(
      releases.map(async r => {
        const chartName = r?.chart?.metadata?.name;
        const v = chartName ? await fetchLatestAppVersion(chartName).catch(() => '—') : '—';
        return [r.name, v] as const;
      })
    ).then(entries => setLatestMap(Object.fromEntries(entries)));
  }, [releases]);

  return (
    <SectionBox title={t('Installed')} textAlign="center" paddingTop={2}>
      <SimpleTable
        columns={[
          {
            label: t('Name'),
            getter: release => (
              <Box display="flex" alignItems="center">
                {release.chart.metadata.icon && (
                  <Box>
                    <img
                      width={50}
                      src={release.chart.metadata.icon}
                      alt={release.chart.metadata.name}
                    />
                  </Box>
                )}
                <Box ml={1}>
                  <Link
                    routeName="/helm/:namespace/releases/:releaseName"
                    params={{ releaseName: release.name, namespace: release.namespace }}
                  >
                    {release.name}
                  </Link>
                </Box>
              </Box>
            ),
          },
          {
            label: t('Namespace'),
            getter: release => release.namespace,
          },
          {
            label: t('Current Version'),
            getter: release => formatVersion(release.chart.metadata.appVersion),
          },
          {
            label: t('Latest Version'),
            getter: release => formatVersion(latestMap[release?.name]),
          },
          {
            label: t('Version'),
            getter: release => release.version,
            sort: true,
          },
          {
            label: t('Status'),
            getter: release => (
              <StatusLabel status={release.info.status === 'deployed' ? 'success' : 'error'}>
                {release.info.status}
              </StatusLabel>
            ),
          },
          {
            label: t('Updated'),
            getter: release => <DateLabel date={release.info.last_deployed} format="mini" />,
          },
        ]}
        data={releases}
      />
    </SectionBox>
  );
}

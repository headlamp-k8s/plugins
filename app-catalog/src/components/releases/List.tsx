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
import { listReleases } from '../../api/releases';

export default function ReleaseList({ fetchReleases = listReleases }) {
  const [releases, setReleases] = useState<Array<any> | null>(null);

  useEffect(() => {
    fetchReleases().then(response => {
      if (!response.releases) {
        setReleases([]);
        return;
      }
      setReleases(response.releases);
    });
  }, []);

  return (
    <SectionBox title="Installed" textAlign="center" paddingTop={2}>
      <SimpleTable
        columns={[
          {
            label: 'Name',
            getter: release => (
              <Box display="flex" alignItems="center">
                <Box>
                  <img
                    width={50}
                    src={release.chart.metadata.icon}
                    alt={release.chart.metadata.name}
                  />
                </Box>
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
            label: 'Namespace',
            getter: release => release.namespace,
          },
          {
            label: 'App Version',
            getter: release => release.chart.metadata.appVersion,
          },
          {
            label: 'Version',
            getter: release => release.version,
            sort: true,
          },
          {
            label: 'Status',
            getter: release => (
              <StatusLabel status={release.info.status === 'deployed' ? 'success' : 'error'}>
                {release.info.status}
              </StatusLabel>
            ),
          },
          {
            label: 'Updated',
            getter: release => <DateLabel date={release.info.last_deployed} format="mini" />,
          },
        ]}
        data={releases}
      />
    </SectionBox>
  );
}

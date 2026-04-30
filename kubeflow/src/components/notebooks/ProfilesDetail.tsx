import { Icon } from '@iconify/react';
import {
  ConditionsTable,
  DetailsGrid,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import { ProfileClass } from '../../resources/profile';
import { ProfileStatusBadge } from '../common/ProfileStatusBadge';
import { SectionPage } from '../common/SectionPage';

export function ProfilesDetail(props: { name?: string }) {
  const params = useParams<{ name: string }>();
  const { name = params.name } = props;

  return (
    <SectionPage title="Profile Detail" apiPath="/apis/kubeflow.org/v1">
      <DetailsGrid
        resourceType={ProfileClass}
        name={name}
        withEvents
        extraInfo={item =>
          item && [
            {
              name: 'Owner Kind',
              value: item?.jsonData?.spec?.owner?.kind || '-',
            },
            {
              name: 'Owner Name',
              value: (() => {
                const owner = item?.jsonData?.spec?.owner;
                if (!owner) return '-';
                const icon =
                  owner.kind === 'User'
                    ? 'mdi:account'
                    : owner.kind === 'Group'
                    ? 'mdi:account-group'
                    : 'mdi:account-question';
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Icon icon={icon} width="16" height="16" />
                    {owner.name || '-'}
                  </Box>
                );
              })(),
            },
            {
              name: 'Status',
              value: <ProfileStatusBadge jsonData={item?.jsonData} />,
            },
          ]
        }
        extraSections={item =>
          item && [
            {
              id: 'resource-quota',
              section: (() => {
                const hard = item?.jsonData?.spec?.resourceQuotaSpec?.hard;
                if (!hard) return null;
                return (
                  <SectionBox title="Resource Quota">
                    <NameValueTable
                      rows={Object.entries(hard).map(([key, val]) => ({
                        name: key,
                        value: String(val),
                      }))}
                    />
                  </SectionBox>
                );
              })(),
            },
            {
              id: 'plugins',
              section: (() => {
                const plugins = item?.jsonData?.spec?.plugins || [];
                if (plugins.length === 0) return null;
                return (
                  <SectionBox title="Plugins">
                    <NameValueTable
                      rows={plugins.map((p: any, i: number) => ({
                        name: `Plugin ${i + 1} (${p.kind || 'Unknown'})`,
                        value: (
                          <Box
                            sx={{
                              fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap',
                              backgroundColor: 'action.hover',
                              p: 1,
                              borderRadius: 1,
                            }}
                          >
                            {JSON.stringify(p.spec || {}, null, 2)}
                          </Box>
                        ),
                      }))}
                    />
                  </SectionBox>
                );
              })(),
            },
            {
              id: 'conditions',
              section: (() => {
                const conditions = item?.jsonData?.status?.conditions || [];
                if (conditions.length === 0) return null;
                return (
                  <SectionBox title="Conditions">
                    <ConditionsTable resource={item.jsonData} />
                  </SectionBox>
                );
              })(),
            },
          ]
        }
      />
    </SectionPage>
  );
}

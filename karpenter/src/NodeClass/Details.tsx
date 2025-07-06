import {
  ConditionsSection,
  DetailsGrid,
  NameValueTable,
  SectionBox,
  StatusLabel as NStausLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import { EditConfigButton } from '../common/EditConfigButton';
import { StatusLabel } from '../common/StatusLabel';
import { nodeClassClass } from './List';

export function NodeClassDetailView(props: { name?: string }) {
  const params = useParams<{ name: string }>();
  const { name = params.name } = props;
  const NodeClass = nodeClassClass();

  return (
    <DetailsGrid
      resourceType={NodeClass}
      name={name}
      withEvents
      actions={item =>
        item && [
          {
            id: 'Nodeclass-config-editor',
            action: () => <EditConfigButton resource={item} />,
          },
        ]
      }
      extraInfo={item =>
        item && [
          {
            name: 'Status',
            value: <StatusLabel item={item} />,
          },
          {
            name: 'IAM Role',
            value: item.jsonData.spec?.role || '-',
          },
          {
            name: 'Instance Profile',
            value: item.jsonData.status?.instanceProfile || '-',
          },
          {
            name: 'AMI Family',
            value: item.jsonData.spec?.amiFamily || '-',
          },
        ]
      }
      extraSections={item =>
        item && [
          {
            id: 'nodeclass-config',
            section: (
              <SectionBox title="NodeClass Configuration">
                <NameValueTable
                  rows={[
                    {
                      name: 'Subnet Selectors',
                      value: renderSelectorTerms(item.jsonData.spec?.subnetSelectorTerms),
                    },
                    {
                      name: 'Security Group Selectors',
                      value: renderSelectorTerms(item.jsonData.spec?.securityGroupSelectorTerms),
                    },
                  ]}
                />
              </SectionBox>
            ),
          },
          {
            id: 'status',
            section: (
              <SectionBox title="Status">
                <NameValueTable
                  rows={[
                    {
                      name: 'Security Group IDs',
                      value: renderStatusItems(
                        item.jsonData.status?.securityGroups?.map(g => g.id)
                      ),
                    },
                    {
                      name: 'Subnet IDs',
                      value: renderStatusItems(item.jsonData.status?.subnets?.map(s => s.id)),
                    },
                    {
                      name: 'Availability Zones',
                      value: renderStatusItems(item.jsonData.status?.subnets?.map(s => s.zone)),
                    },
                  ]}
                />
              </SectionBox>
            ),
          },
          {
            id: 'conditions',
            section: <ConditionsSection resource={item.jsonData} />,
          },
        ]
      }
    />
  );
}

function renderStatusItems(items: string[] = []) {
  if (!items || items.length === 0) return '-';

  return (
    <Box sx={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {items.map((item, index) => (
        <NStausLabel key={index} status="">
          {item}
        </NStausLabel>
      ))}
    </Box>
  );
}

function renderSelectorTerms(terms: any[] = []) {
  if (!terms || terms.length === 0) return '-';

  return (
    <Box sx={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {terms.flatMap(term =>
        Object.entries(term.tags || {}).map(([key, value]) => (
          <NStausLabel key={`${key}=${value}`} status="">
            {`${key}=${value}`}
          </NStausLabel>
        ))
      )}
    </Box>
  );
}

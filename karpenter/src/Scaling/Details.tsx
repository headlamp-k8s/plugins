import {
  ConditionsSection,
  DetailsGrid,
  Link,
  NameValueTable,
  SectionBox,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import CustomObjectEventList from '../common/EventList';
import { nodeClaimClass } from './List';

export function ScalingDetailView(props: { name?: string }) {
  const params = useParams<{ name: string }>();

  const { name = params.name } = props;
  const NodeClaimClass = nodeClaimClass();

  return (
    <DetailsGrid
      resourceType={NodeClaimClass}
      name={name}
      withEvents
      extraInfo={item => {
        const conditionsLength = item.jsonData.status?.conditions?.length || 0;
        const nodepool = item.jsonData.metadata?.ownerReferences?.find(x => x.kind === 'NodePool');

        return (
          item && [
            {
              name: 'UID',
              value: item.jsonData.metadata?.uid || '-',
            },
            {
              name: 'NodePool',
              value: (
                <Link
                  routeName={'nodepools-detail'}
                  params={{
                    name: nodepool?.name,
                  }}
                >
                  {nodepool?.name || '-'}
                </Link>
              ),
            },
            {
              name: 'Status',
              value: (
                <StatusLabel>
                  {item.jsonData.status?.conditions[conditionsLength - 1]?.reason || '-'}
                </StatusLabel>
              ),
            },
            {
              name: 'Instance Type',
              value: item.jsonData.metadata?.labels['node.kubernetes.io/instance-type'] || '-',
            },
            {
              name: 'Capacity Type',
              value: item.jsonData.metadata?.labels['karpenter.sh/capacity-type'] || '-',
            },
          ]
        );
      }}
      extraSections={item =>
        item && [
          {
            id: 'karpenter-scaling-pods',
            section: (
              <CustomObjectEventList
                source="karpenter"
                kind="Pod"
                reason="Nominated"
                title="Pod Placement Decisions"
              />
            ),
          },
          {
            id: 'resources',
            section: (
              <SectionBox title={'Resource Requested'}>
                <NameValueTable
                  rows={[
                    {
                      name: 'CPU',
                      value: item.jsonData.spec?.resources?.requests?.cpu || '-',
                    },
                    {
                      name: 'Pods',
                      value: item.jsonData.spec?.resources?.requests?.pods || '-',
                    },
                  ]}
                />
              </SectionBox>
            ),
          },
          {
            id: 'resources',
            section: (
              <SectionBox title={'Resource Allocated'}>
                <NameValueTable
                  rows={[
                    {
                      name: 'CPU',
                      value: item.jsonData.status?.allocatable?.cpu || '-',
                    },
                    {
                      name: 'Pods',
                      value: item.jsonData.status?.allocatable?.pods || '-',
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
          {
            id: 'karpenter-scaling-pods',
            section: (
              <CustomObjectEventList source="karpenter" kind="Node" title="Node Decisions" />
            ),
          },
        ]
      }
    />
  );
}

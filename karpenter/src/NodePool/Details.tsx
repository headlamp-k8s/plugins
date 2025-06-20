import {
  DetailsGrid,
  Link,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { getResourceStr } from '@kinvolk/headlamp-plugin/lib/Utils';
import { useParams } from 'react-router-dom';
import { renderInstanceRequirements } from '../helpers/instanceRequirements';
import { parseRam } from '../helpers/parseRam';
import { renderDisruptionBudgets } from '../helpers/renderBudgets';
import { nodePoolClass } from './List';

export function NodePoolDetailView(props: { name?: string }) {
  const params = useParams<{ name: string }>();
  const { name = params.name } = props;
  const NodePoolClass = nodePoolClass();

  return (
    <DetailsGrid
      resourceType={NodePoolClass}
      name={name}
      withEvents
      extraInfo={item => {
        const usedCPU = parseInt(item.jsonData.status?.resources?.cpu || '0');
        const CPUlimit = parseInt(item.jsonData.spec?.limits?.cpu || '0');

        const usedMemory = parseRam(item.jsonData.status?.resources?.memory || '0');
        const memoryLimit = parseRam(item.jsonData.spec?.limits?.memory || '0');

        return (
          item && [
            {
              name: 'CPU',
              value: `${usedCPU} ${CPUlimit > 0 ? `of ${CPUlimit}` : '(No limit set)'}`,
            },
            {
              name: 'Memory',
              value: `${getResourceStr(usedMemory, 'memory')} ${
                memoryLimit > 0 ? `of ${getResourceStr(memoryLimit, 'memory')}` : '(No limit set)'
              }`,
            },
            {
              name: 'Nodes',
              value: item.jsonData.status?.resources?.nodes,
            },
            {
              name: 'Pods',
              value: item.jsonData.status?.resources?.pods,
            },
          ]
        );
      }}
      extraSections={item =>
        item && [
          {
            id: 'nodepool-disruption',
            section: (
              <SectionBox title="Disruption Settings">
                <NameValueTable
                  rows={[
                    {
                      name: 'Consolidation Policy',
                      value: item.jsonData.spec?.disruption?.consolidationPolicy || '-',
                    },
                    {
                      name: 'Consolidate After',
                      value: item.jsonData.spec?.disruption?.consolidateAfter || '-',
                    },
                    {
                      name: 'Disruption Budgets',
                      value:
                        renderDisruptionBudgets(item.jsonData.spec?.disruption?.budgets) || '-',
                    },
                    {
                      name: 'Expire After',
                      value: item.jsonData.spec?.template?.spec?.expireAfter || '-',
                    },
                  ]}
                />
              </SectionBox>
            ),
          },
          {
            id: 'nodepool-template',
            section: (
              <SectionBox title="Node Template Configuration">
                <NameValueTable
                  rows={[
                    {
                      name: 'Node Class',
                      value: (
                        <Link
                          routeName={'nodeclasses-detail'}
                          params={{ name: item.jsonData.spec?.template?.spec?.nodeClassRef?.name }}
                        >
                          {item.jsonData.spec?.template?.spec?.nodeClassRef?.name || '-'}
                        </Link>
                      ),
                    },
                    {
                      name: 'Instance Requirements',
                      value: renderInstanceRequirements(
                        item.jsonData.spec?.template?.spec?.requirements
                      ),
                    },
                    {
                      name: 'Expire After',
                      value: item.jsonData.spec?.template?.spec?.expireAfter || '-',
                    },
                  ]}
                />
              </SectionBox>
            ),
          },
        ]
      }
    />
  );
}

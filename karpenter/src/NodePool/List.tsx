import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Link, ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { PercentageBar } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import { getResourceStr } from '@kinvolk/headlamp-plugin/lib/Utils';
import { parseRam } from '../helpers/parseRam';
import { CPUtooltip, Memorytooltip } from '../helpers/tooltip';

interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export function NodePools() {
  return <NodePoolsList />;
}

export function nodePoolClass() {
  const nodePoolGroup = 'karpenter.sh';
  const nodePoolVersion = 'v1';

  const NodePool = makeCustomResourceClass({
    apiInfo: [{ group: nodePoolGroup, version: nodePoolVersion }],
    isNamespaced: false,
    singularName: 'NodePool',
    pluralName: 'nodepools',
    kind: 'NodePool',
    customResourceDefinition: {
      getMainAPIGroup: () => [nodePoolGroup, nodePoolVersion],
    } as any,
  });

  return class extendedNodePoolClass extends NodePool {
    static get detailsRoute() {
      return 'nodepools-detail';
    }

    static getMainAPIGroup() {
      return [nodePoolGroup, nodePoolVersion];
    }
  };
}

function NodePoolsList() {
  const { t } = useTranslation();

  return (
    <ResourceListView
      title={t('NodePools')}
      resourceClass={nodePoolClass()}
      columns={[
        'name',
        {
          id: 'nodeclass-ref',
          label: t('NodeClass'),
          getValue: nodePool => nodePool.jsonData.spec?.template?.spec?.nodeClassRef?.name || '-',
          render: nodePool => {
            const nodePoolName = nodePool.jsonData.spec?.template?.spec?.nodeClassRef?.name;
            return (
              <Link
                routeName={'nodeclasses-detail'}
                params={{
                  name: nodePoolName || '',
                }}
              >
                {nodePoolName}
              </Link>
            );
          },
        },
        {
          id: 'nodepool-cpu',
          label: t('CPU'),
          getValue: nodePool => {
            const used = parseInt(nodePool.jsonData.status?.resources?.cpu || '0');
            const limit = parseInt(nodePool.jsonData.spec?.limits?.cpu || '0');

            return limit > 0 ? `${used}/${limit}` : t('{{used}} (No limit)', { used });
          },
          render: nodePool => {
            const used = parseInt(nodePool.jsonData.status?.resources?.cpu || 0);
            const limit = parseInt(nodePool.jsonData.spec?.limits?.cpu || 0);
            const data: ChartDataPoint[] = [
              {
                name: 'CPU',
                value: used,
              },
            ];

            const effectiveLimit = limit > 0 ? limit : used || 1;

            return (
              <PercentageBar
                data={data}
                total={effectiveLimit}
                tooltipFunc={() => CPUtooltip(used, limit, t)}
              />
            );
          },
        },
        {
          id: 'nodepool-memory',
          label: t('Memory'),
          getValue: nodePool => {
            const used = parseRam(nodePool.jsonData.status?.resources?.memory || '0');
            const limit = parseRam(nodePool.jsonData.spec?.limits?.memory || '0');
            return limit > 0
              ? `${getResourceStr(used, 'memory')}/${getResourceStr(limit, 'memory')}`
              : t('{{used}} (No limit)', { used: getResourceStr(used, 'memory') });
          },
          render: nodePool => {
            const used = parseRam(nodePool.jsonData.status?.resources?.memory || '0');
            const limit = parseRam(nodePool.jsonData.spec?.limits?.memory || '0');

            const data: ChartDataPoint[] = [
              {
                name: 'Memory',
                value: limit > 0 ? used : 0,
              },
            ];

            return (
              <PercentageBar
                data={data}
                total={limit > 0 ? limit : 1}
                tooltipFunc={() => Memorytooltip(used, limit, t)}
              />
            );
          },
        },
        {
          id: 'nodepool-nodes',
          label: t('Nodes'),
          getValue: nodePool => nodePool.jsonData.status?.resources?.nodes || 0,
        },
        {
          id: 'nodepool-status',
          label: t('Status'),
          getValue: nodePool => {
            const conditions = nodePool.jsonData?.status?.conditions || [];
            const readyCondition = conditions.find(c => c.type === 'Ready');
            return readyCondition?.status === 'True' ? t('Ready') : t('Not Ready');
          },
        },
        'age',
      ]}
    />
  );
}

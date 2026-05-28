import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Link, ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/K8s/crd';

export function nodeClaimClass() {
  const nodeClaimGroup = 'karpenter.sh';
  const nodeClaimVersion = 'v1';

  const NodeClaim = makeCustomResourceClass({
    apiInfo: [{ group: nodeClaimGroup, version: nodeClaimVersion }],
    isNamespaced: false,
    singularName: 'NodeClaim',
    pluralName: 'nodeclaims',
    kind: 'NodeClaim',
    customResourceDefinition: {
      getMainAPIGroup: () => [nodeClaimGroup, nodeClaimVersion],
    } as any,
  });

  return class extendedNodeClaim extends NodeClaim {
    static get detailsRoute() {
      return 'nodeclaims-detail';
    }

    static getMainAPIGroup() {
      return [nodeClaimGroup, nodeClaimVersion];
    }
  };
}

export const ScalingView = () => {
  return <NodeClaimList />;
};

export function NodeClaimList() {
  const { t } = useTranslation();

  return (
    <ResourceListView
      defaultSortingColumn={{
        id: 'age',
        desc: false,
      }}
      title={t('Node Claims')}
      resourceClass={nodeClaimClass()}
      columns={[
        {
          id: 'name',
          label: t('Name'),
          getValue: item => item?.jsonData?.metadata?.name || t('Unnamed'),
          render: item => (
            <Link
              routeName={'nodeclaims-detail'}
              params={{
                name: item?.jsonData?.metadata?.name || '',
              }}
            >
              {item?.jsonData?.metadata?.name || t('Unnamed')}
            </Link>
          ),
        },
        {
          id: 'status',
          label: t('Status'),
          getValue: item => item.jsonData?.status?.conditions,
          render: item => {
            const finalCondition = item.jsonData?.status?.conditions?.length;
            return (
              <StatusLabel>
                {item.jsonData?.status?.conditions[finalCondition - 1]?.reason || '-'}
              </StatusLabel>
            );
          },
        },
        {
          id: 'instance-type',
          label: t('Instance Type'),
          getValue: item => item.jsonData?.metadata?.labels['node.kubernetes.io/instance-type'],
          render: item => {
            return item.jsonData?.metadata?.labels['node.kubernetes.io/instance-type'] || '-';
          },
        },
        {
          id: 'cpu',
          label: t('CPU'),
          getValue: item => item.jsonData.spec?.resources?.requests?.cpu,
          render: item => {
            return item.jsonData.spec?.resources?.requests?.cpu || '-';
          },
        },
        {
          id: 'zone',
          label: t('Zone'),
          getValue: item => item.jsonData.metadata?.labels['topology.kubernetes.io/zone'],
          render: item => {
            return item.jsonData.metadata?.labels['topology.kubernetes.io/zone'] || '-';
          },
        },
        'age',
      ]}
    />
  );
}

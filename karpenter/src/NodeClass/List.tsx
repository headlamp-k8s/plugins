import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';

export function NodeClasses() {
  return <NodeClassesList />;
}

export function nodeClassClass() {
  const nodeClassGroup = 'karpenter.k8s.aws';
  const nodeClassVersion = 'v1';

  const NodeClass = makeCustomResourceClass({
    apiInfo: [{ group: nodeClassGroup, version: nodeClassVersion }],
    isNamespaced: false,
    singularName: 'EC2NodeClass',
    pluralName: 'ec2nodeclasses',
  });

  return class extendedNodeClass extends NodeClass {
    static get detailsRoute() {
      return '/karpenter/nodeclass/:name';
    }
  };
}

function NodeClassesList() {
  return (
    <ResourceListView
      title="EC2 NodeClasses"
      resourceClass={nodeClassClass()}
      columns={[
        'name',
        {
          id: 'nodeclass-cluster',
          label: 'Cluster',
          getValue: nodeClass => nodeClass._clusterName || '',
        },
        {
          id: 'nodeclass-instanceProfile',
          label: 'Instance Profile',
          getValue: nodeClass => nodeClass.jsonData?.status?.instanceProfile || '-',
        },
        {
          id: 'nodeclass-status',
          label: 'Status',
          getValue: nodeClass => {
            const conditions = nodeClass.jsonData?.status?.conditions || [];
            const readyCondition = conditions.find(c => c.type === 'Ready');
            return readyCondition?.status === 'True' ? 'Ready' : 'Not Ready';
          },
        },
        {
          id: 'nodeclass-role',
          label: 'IAM Role',
          getValue: nodeClass => nodeClass.jsonData?.spec?.role || '-',
        },
        'age',
      ]}
    />
  );
}

export const AWS_DEPLOYMENT_CONFIGS = {
  EKS_AUTOMODE: {
    group: 'eks.amazonaws.com',
    version: 'v1',
    singularName: 'nodeclass',
    pluralName: 'nodeclasses',
    kind: 'NodeClass',
    displayName: 'Node Classes',
    apiVersion: 'eks.amazonaws.com/v1',
    annotationPrefix: 'eks.amazonaws.com',
    detailsRoute: 'nodeclasses-detail',
    columns: [
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
    ],
  },
  SELF_INSTALLED: {
    group: 'karpenter.k8s.aws',
    version: 'v1',
    singularName: 'ec2nodeclass',
    pluralName: 'ec2nodeclasses',
    kind: 'EC2NodeClass',
    displayName: 'EC2 Node Classes (Self-Installed)',
    apiVersion: 'karpenter.k8s.aws/v1',
    annotationPrefix: 'karpenter.k8s.aws',
    detailsRoute: 'nodeclasses-detail',
    columns: [
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
    ],
  },
  GENERIC_KARPENTER: {
    group: 'karpenter.sh',
    version: 'v1',
    singularName: 'nodeclass',
    pluralName: 'nodeclasses',
    kind: 'NodeClass',
    displayName: 'Node Classes (Karpenter)',
    apiVersion: 'karpenter.sh/v1',
    annotationPrefix: 'karpenter.sh',
    detailsRoute: 'nodeclasses-detail',
    columns: [
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
    ],
  },
};

export function getAWSConfig(deploymentType) {
  return AWS_DEPLOYMENT_CONFIGS[deploymentType] || AWS_DEPLOYMENT_CONFIGS.SELF_INSTALLED;
}

export const CLOUD_PROVIDERS = {
  AWS: {
    // AWS configuration for self-installed Karpenter
    group: 'karpenter.k8s.aws',
    version: 'v1',
    singularName: 'ec2nodeclass',
    pluralName: 'ec2nodeclasses',
    detailsRoute: 'nodeclasses-detail',
    displayName: 'EC2 Node Classes',
    columns: [
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
    ],
  },
  AZURE: {
    group: 'karpenter.azure.com',
    version: 'v1beta1',
    singularName: 'aksnodeclass',
    pluralName: 'aksnodeclasses',
    detailsRoute: 'nodeclasses-detail',
    displayName: 'AKS Node Classes',
    columns: [
      'name',
      {
        id: 'nodeclass-cluster',
        label: 'Cluster',
        getValue: nodeClass => nodeClass._clusterName || '',
      },
      {
        id: 'nodeclass-imageFamily',
        label: 'Image Family',
        getValue: nodeClass => nodeClass.jsonData?.spec?.imageFamily || '-',
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
        id: 'nodeclass-maxPods',
        label: 'Max Pods',
        getValue: nodeClass => nodeClass.jsonData?.spec?.maxPods || '-',
      },
      {
        id: 'nodeclass-osDiskSize',
        label: 'OS Disk Size (GB)',
        getValue: nodeClass => nodeClass.jsonData?.spec?.osDiskSizeGB || '-',
      },
      'age',
    ],
  },
};

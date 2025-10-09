import { Icon } from '@iconify/react';
import { addIcon } from '@iconify/react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { useMemo } from 'react';
import { useCloudProviderDetection } from './hook/useCloudProviderDetection';
import { NodeClassDetailView } from './NodeClass/Details';
import { awsNodeClassClass, azureNodeClassClass } from './NodeClass/List';
import { NodePoolDetailView } from './NodePool/Details';
import { nodePoolClass } from './NodePool/List';
import { ScalingDetailView } from './Scaling/Details';
import { nodeClaimClass } from './Scaling/List';

addIcon('simple-icons:karpenter', {
  body: `<svg viewBox="0 0 500 443" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M237.704918.0C314.662629.0 377.04918 62.3865513 377.04918 139.344262L377.049 336.352 442.622951 336.351852C474.31142 336.351852 5e2 362.040432 5e2 393.728901V443h-7.546066c-18.225271.0-33.094961-14.592764-33.437541-32.814815V401.960534L459.013099 401.553891C458.795948 388.160675 447.871194 377.37037 434.42623 377.37037H106.557377C47.7073627 377.37037.0 329.663008.0 270.812993L-100611761e-22 139.344262C-100611761e-22 62.3865513 62.3865513.0 139.344262.0zm-8.196721 41.0185185H147.540984L145.778863 41.0327942C87.7415928 41.97378 40.9836066 89.3143814 40.9836066 147.575896V270.778081L40.9923916 271.862464C41.5714598 307.577706 70.7041376 336.351852 106.557377 336.351852H270.491803c36.215394.0 65.573771-29.358377 65.573771-65.573771V147.575896L336.051298 145.813774C335.110312 87.7765047 287.769711 41.0185185 229.508197 41.0185185zM147.868852 106.648148C157.213115 106.648148 164.590164 114.277593 164.590164 123.875926v49.960555l56.803279-58.574444C228.770492 108.370926 238.852459 107.878704 245.983607 114.523704V114.769815C252.868852 121.168704 252.377049 131.751481 244.754098 138.642593l-42.04918 43.315555 48.934426 69.895556C257.540984 260.467593 255.819672 271.296481 247.95082 276.464815 239.344262 281.387037 229.508197 278.679815 223.606557 270.065926l-44.016393-64.481111-15 15.751111v40.362222c0 9.84444500000001-7.377049 17.227778-16.721312 17.227778C138.52459 278.925926 131.147541 271.542593 131.147541 261.698148V123.875926c0-9.59833300000001 7.377049-17.227778 16.721311-17.227778z" />
  </svg>`,
  width: 24,
  height: 24,
});

const makeKubeToKubeEdge = (from: any, to: any): any => ({
  id: `${from.metadata.uid}-${to.metadata.uid}`,
  source: from.metadata.uid,
  target: to.metadata.uid,
});

const useNodeClassClass = () => {
  const { cloudProvider } = useCloudProviderDetection();

  return useMemo(() => {
    // Handle null/undefined cloudProvider during initialization
    if (!cloudProvider) {
      return awsNodeClassClass(); // Default fallback
    }

    // Handle new cloudProvider object structure
    const providerName = typeof cloudProvider === 'object' ? cloudProvider.provider : cloudProvider;
    
    switch (providerName) {
      case 'AWS':
        return awsNodeClassClass();
      case 'AZURE':
        return azureNodeClassClass();
      default:
        // Default to AWS if provider is unknown
        return awsNodeClassClass();
    }
  }, [cloudProvider]);
};

class NodePool extends nodePoolClass() {}
class NodeClaim extends nodeClaimClass() {}

const findNodePoolEdges = (nodeClaims: NodeClaim[], nodePools: NodePool[]) => {
  const edges = [];

  nodeClaims?.forEach(nodeClaim => {
    const ownerRefs = nodeClaim.metadata.ownerReferences || [];
    const nodePoolOwner = ownerRefs.find(ref => ref.kind === 'NodePool');

    if (nodePoolOwner) {
      const nodePool = nodePools?.find(np => np.metadata.name === nodePoolOwner.name);
      if (nodePool) {
        edges.push(makeKubeToKubeEdge(nodePool, nodeClaim));
      }
    }
  });

  return edges;
};

const findNodeClassEdges = (nodePools: NodePool[], nodeClasses: any[]) => {
  const edges = [];

  nodePools?.forEach(nodePool => {
    const nodeClassName = nodePool.jsonData.spec.template.spec.nodeClassRef?.name;
    if (nodeClassName) {
      const nodeClass = nodeClasses?.find(nc => nc.metadata.name === nodeClassName);
      if (nodeClass) {
        edges.push(makeKubeToKubeEdge(nodePool, nodeClass));
      }
    }
  });

  return edges;
};

const findNodeClaimToNodeEdges = (nodeClaims: NodeClaim[], nodes: any[]) => {
  const edges = [];

  nodeClaims?.forEach(nodeClaim => {
    const relatedNode = nodes?.find(node => {
      const ownerRefs = node.metadata?.ownerReferences || [];
      return ownerRefs.some(
        ref => ref.kind === 'NodeClaim' && ref.name === nodeClaim.metadata.name
      );
    });

    if (relatedNode) {
      edges.push(makeKubeToKubeEdge(nodeClaim, relatedNode));
    }
  });

  return edges;
};

const findNodeToPodEdges = (nodes: any[], pods: any[]) => {
  const edges = [];

  pods?.forEach(pod => {
    const nodeName = pod.spec?.nodeName;
    if (nodeName) {
      const node = nodes?.find(n => n.metadata.name === nodeName);
      if (node) {
        edges.push(makeKubeToKubeEdge(node, pod));
      }
    }
  });

  return edges;
};

const filterKarpenterManagedPods = (pods: any[], nodes: any[]) => {
  const karpenterNodeNames = new Set(
    nodes
      ?.filter(node => {
        const labels = node.metadata?.labels || {};
        const annotations = node.metadata?.annotations || {};
        return (
          labels['karpenter.sh/nodepool'] ||
          labels['node.kubernetes.io/instance-type'] ||
          annotations['karpenter.sh/nodepool']
        );
      })
      .map(node => node.metadata.name)
  );

  return pods?.filter(pod => pod.spec?.nodeName && karpenterNodeNames.has(pod.spec.nodeName));
};

const nodeClassSource = {
  id: 'karpenter-node-classes',
  label: 'nodeclasses',
  icon: <Icon icon="mdi:file-cog" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  useData() {
    const NodeClassClass = useNodeClassClass();
    const [nodeClasses] = NodeClassClass.useList();

    return useMemo(() => {
      if (!nodeClasses) return null;

      const nodes = nodeClasses?.map(it => ({
        id: it.metadata.uid,
        kubeObject: it,
        weight: 5000,
        detailsComponent: ({ node }) => (
          <NodeClassDetailView name={node.kubeObject.jsonData.metadata.name} />
        ),
      }));

      return {
        nodes,
      };
    }, [nodeClasses]);
  },
};

const nodePoolSource = {
  id: 'karpenter-node-pools',
  label: 'nodepools',
  icon: <Icon icon="mdi:pool" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  useData() {
    const [nodePools] = nodePoolClass().useList();
    const NodeClassClass = useNodeClassClass();
    const [nodeClasses] = NodeClassClass.useList();

    return useMemo(() => {
      if (!nodePools) return null;

      const nodes = nodePools?.map(it => ({
        id: it.metadata.uid,
        kubeObject: it,
        weight: 4500,
        detailsComponent: ({ node }) => (
          <NodePoolDetailView name={node.kubeObject.jsonData.metadata.name} />
        ),
      }));

      const edges = findNodeClassEdges(nodePools, nodeClasses);

      return {
        nodes,
        edges,
      };
    }, [nodePools, nodeClasses]);
  },
};

const nodeClaimSource = {
  id: 'karpenter-node-claims',
  label: 'nodeclaims',
  icon: <Icon icon="mdi:hand-extended" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  useData() {
    const [nodeClaims] = NodeClaim.useList();
    const [nodePools] = NodePool.useList();

    return useMemo(() => {
      if (!nodeClaims) return null;

      const nodes = nodeClaims?.map(it => ({
        id: it.metadata.uid,
        kubeObject: it,
        weight: 4000,
        detailsComponent: ({ node }) => (
          <ScalingDetailView name={node.kubeObject.jsonData.metadata.name} />
        ),
      }));

      const edges = findNodePoolEdges(nodeClaims, nodePools);

      return {
        nodes,
        edges,
      };
    }, [nodeClaims, nodePools]);
  },
};

const karpenterNodesSource = {
  id: 'karpenter-nodes',
  label: 'nodes',
  icon: <Icon icon="mdi:desktop-tower" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  useData() {
    const [nodes] = K8s.ResourceClasses.Node.useList();
    const [nodeClaims] = NodeClaim.useList();

    return useMemo(() => {
      if (!nodes) return null;

      const karpenterNodes = nodes?.filter(node => {
        const labels = node.metadata?.labels || {};
        const annotations = node.metadata?.annotations || {};
        return (
          labels['karpenter.sh/nodepool'] ||
          labels['node.kubernetes.io/instance-type'] ||
          annotations['karpenter.sh/nodepool'] ||
          nodeClaims?.some(nc => nc.jsonData.status?.nodeName === node.metadata.name)
        );
      });

      const nodesList = karpenterNodes?.map(it => ({
        id: it.metadata.uid,
        kubeObject: it,
        weight: 2000,
      }));

      const edges = findNodeClaimToNodeEdges(nodeClaims, karpenterNodes);

      return {
        nodes: nodesList,
        edges,
      };
    }, [nodes, nodeClaims]);
  },
};

const karpenterPodsSource = {
  id: 'karpenter-pods',
  label: 'pods',
  icon: <Icon icon="mdi:cube" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  useData() {
    const [pods] = K8s.ResourceClasses.Pod.useList();
    const [nodes] = K8s.ResourceClasses.Node.useList();

    return useMemo(() => {
      if (!pods || !nodes) return null;

      const karpenterNodes = nodes?.filter(node => {
        const labels = node.metadata?.labels || {};
        const annotations = node.metadata?.annotations || {};
        return (
          labels['karpenter.sh/nodepool'] ||
          labels['node.kubernetes.io/instance-type'] ||
          annotations['karpenter.sh/nodepool']
        );
      });

      const karpenterPods = filterKarpenterManagedPods(pods, karpenterNodes);

      const podNodes = karpenterPods?.map(it => ({
        id: it.metadata.uid,
        kubeObject: it,
        weight: 1000,
      }));

      const edges = findNodeToPodEdges(karpenterNodes, karpenterPods);

      return {
        nodes: podNodes,
        edges,
      };
    }, [pods, nodes]);
  },
};

export const karpenterSource = {
  id: 'karpenter',
  label: 'Karpenter',
  icon: <Icon icon="simple-icons:karpenter" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  sources: [
    nodePoolSource,
    nodeClaimSource,
    nodeClassSource,
    karpenterNodesSource,
    karpenterPodsSource,
  ],
};

import { Icon } from '@iconify/react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { useMemo } from 'react';
import { NodeClassDetailView } from './NodeClass/Details';
import { NodePoolDetailView } from './NodePool/Details';
import { ScalingDetailView } from './Scaling/Details';
import { nodeClassClass } from './NodeClass/List';
import { nodeClaimClass } from './Scaling/List';
import { nodePoolClass } from './NodePool/List';

const makeKubeToKubeEdge = (from: any, to: any): any => ({
  id: `${from.metadata.uid}-${to.metadata.uid}`,
  source: from.metadata.uid,
  target: to.metadata.uid,
});

class NodePool extends nodePoolClass(){}
class NodeClass extends nodeClassClass(){}
class NodeClaim extends nodeClaimClass(){}

const findNodePoolEdges = (
  nodeClaims: NodeClaim[],
  nodePools: NodePool[]
) => {
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

const findNodeClassEdges = (
  nodePools: NodePool[],
  nodeClasses: NodeClass[]
) => {
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

const findNodeClaimToNodeEdges = (
  nodeClaims: NodeClaim[],
  nodes: any[]
) => {
  const edges = [];

  nodeClaims?.forEach(nodeClaim => {
    // Finding nodes that are managed by this NodeClaim
    const relatedNode = nodes?.find(node => {
      const ownerRefs = node.metadata?.ownerReferences || [];
      return ownerRefs.some(ref => 
        ref.kind === 'NodeClaim' && 
        ref.name === nodeClaim.metadata.name
      );
    });

    if (relatedNode) {
      edges.push(makeKubeToKubeEdge(nodeClaim, relatedNode));
    }
  });

  return edges;
};

const findNodeToPodEdges = (
  nodes: any[],
  pods: any[]
) => {
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

const filterKarpenterManagedPods = (
  pods: any[],
  nodes: any[]
) => {
  const karpenterNodeNames = new Set(
    nodes?.filter(node => {
      const labels = node.metadata?.labels || {};
      const annotations = node.metadata?.annotations || {};
      return (
        labels['karpenter.sh/nodepool'] ||
        labels['node.kubernetes.io/instance-type'] ||
        annotations['karpenter.sh/nodepool']
      );
    }).map(node => node.metadata.name)
  );

  return pods?.filter(pod => 
    pod.spec?.nodeName && karpenterNodeNames.has(pod.spec.nodeName)
  );
};

const nodeClassSource = {
  id: 'karpenter-node-classes',
  label: 'nodeclasses',
  icon: <Icon icon="mdi:server" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  useData() {
    const [nodeClasses] = nodeClassClass().useList();

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
  icon: <Icon icon="mdi:server-network" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  useData() {
    const [nodePools] = nodePoolClass().useList();
    const [nodeClasses] = nodeClassClass().useList();

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
  icon: <Icon icon="mdi:server-plus" width="100%" height="100%" color="rgb(50, 108, 229)" />,
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
          <ScalingDetailView
            name={node.kubeObject.jsonData.metadata.name}
          />
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

      // Filtering nodes that are managed by Karpenter
      const karpenterNodes = nodes?.filter(node => {
        const labels = node.metadata?.labels || {};
        const annotations = node.metadata?.annotations || {};
        return (
          labels['karpenter.sh/nodepool'] ||
          labels['node.kubernetes.io/instance-type'] ||
          annotations['karpenter.sh/nodepool'] ||

          nodeClaims?.some(nc => 
            nc.jsonData.status?.nodeName === node.metadata.name
          )
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

      // Filter nodes managed by Karpenter
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
  icon: <Icon icon="mdi:server" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  sources: [
    nodePoolSource,
    nodeClaimSource,
    nodeClassSource,
    karpenterNodesSource,
    karpenterPodsSource,
  ],
};
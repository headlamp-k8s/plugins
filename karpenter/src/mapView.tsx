import { Icon } from '@iconify/react';
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
        weight: 1000,
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
        weight: 2000,
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
        weight: 1500,
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

export const karpenterSource = {
  id: 'karpenter',
  label: 'Karpenter',
  icon: <Icon icon="mdi:server" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  sources: [
    nodePoolSource,
    nodeClaimSource,
    nodeClassSource,
  ],
};
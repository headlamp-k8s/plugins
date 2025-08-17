import { Icon } from '@iconify/react';
import { useMemo } from 'react';
import { NodeClassDetailView } from './NodeClass/Details';
import { nodeClassClass } from './NodeClass/List';

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


export const karpenterSource = {
  id: 'karpenter',
  label: 'Karpenter',
  icon: <Icon icon="mdi:server" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  sources: [
    nodeClassSource,
  ],
};
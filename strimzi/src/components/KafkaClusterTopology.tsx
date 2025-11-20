import React from 'react';
import {
  ReactFlow,
  Node,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Kafka, KafkaNodePool, isKRaftMode } from '../crds';
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

interface TopologyProps {
  kafka: Kafka;
}

interface Pod {
  metadata?: {
    name?: string;
  };
  status?: {
    podIP?: string;
    phase?: string;
    conditions?: Array<{
      type: string;
      status: string;
    }>;
  };
}

// Modern color scheme with better contrast and readability
const COLORS = {
  cluster: {
    border: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.05)',
    label: '#6366f1',
  },
  nodePool: {
    border: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.08)',
    label: '#8b5cf6',
  },
  controller: {
    border: '#10b981',
    bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    label: '#059669',
  },
  broker: {
    border: '#3b82f6',
    bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    label: '#2563eb',
  },
  zookeeper: {
    border: '#f59e0b',
    bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    label: '#d97706',
  },
  dual: {
    border: '#8b5cf6',
    bg: 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%)',
    label: '#7c3aed',
  },
};

// Helper to determine if pod is ready
function isPodReady(pod: Pod | undefined): boolean {
  if (!pod?.status?.conditions) return false;
  const readyCondition = pod.status.conditions.find(c => c.type === 'Ready');
  return readyCondition?.status === 'True';
}

// Modern node component for individual pods
function createPodNode(params: {
  id: string;
  name: string;
  nodeId: number;
  role: string;
  parentId: string;
  position: { x: number; y: number };
  color: typeof COLORS.broker;
  pod?: Pod;
}): Node {
  const { id, name, nodeId, role, parentId, position, color, pod } = params;
  const podIP = pod?.status?.podIP || 'N/A';
  const ready = isPodReady(pod);
  const phase = pod?.status?.phase || 'Unknown';

  return {
    id,
    type: 'default',
    position,
    data: {
      label: (
        <div style={{ padding: '4px' }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: color.label,
              marginBottom: '8px',
              textAlign: 'center',
            }}
          >
            {name}-{nodeId}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: '#64748b',
              lineHeight: '1.6',
            }}
          >
            <div>
              <strong>ID:</strong> {nodeId}
            </div>
            <div>
              <strong>Role:</strong> {role}
            </div>
            <div>
              <strong>IP:</strong> {podIP}
            </div>
            <div>
              <strong>Phase:</strong> {phase}
            </div>
          </div>
          <div
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              textAlign: 'center',
              backgroundColor: ready ? '#d1fae5' : '#fee2e2',
              color: ready ? '#059669' : '#dc2626',
            }}
          >
            {ready ? '✓ Ready' : '✗ Not Ready'}
          </div>
        </div>
      ),
    },
    style: {
      background: color.bg,
      border: `2px solid ${color.border}`,
      borderRadius: '12px',
      padding: '16px',
      width: 180,
      minHeight: 160,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    parentId,
    extent: 'parent' as const,
  };
}

// Modern group label component
function createGroupLabel(params: {
  id: string;
  title: string;
  subtitle: string;
  parentId: string;
  color: typeof COLORS.nodePool;
}): Node {
  const { id, title, subtitle, parentId, color } = params;

  return {
    id,
    type: 'default',
    position: { x: 16, y: 16 },
    data: {
      label: (
        <div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'white',
              marginBottom: '2px',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 500,
            }}
          >
            {subtitle}
          </div>
        </div>
      ),
    },
    style: {
      background: color.label,
      border: 'none',
      borderRadius: '8px',
      padding: '10px 16px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    parentId,
    draggable: false,
    selectable: false,
  };
}

function TopologyFlow({ kafka }: TopologyProps) {
  const [nodePools, setNodePools] = React.useState<KafkaNodePool[]>([]);
  const [pods, setPods] = React.useState<Pod[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [nodes, setNodes] = React.useState<Node[]>([]);

  const isKRaft = React.useMemo(() => isKRaftMode(kafka), [kafka]);
  const clusterReady = React.useMemo(
    () => kafka.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True',
    [kafka.status]
  );

  // Fetch node pools and pods
  React.useEffect(() => {
    const clusterName = kafka.metadata.name;
    const namespace = kafka.metadata.namespace;

    Promise.all([
      ApiProxy.request('/apis/kafka.strimzi.io/v1beta2/kafkanodepools'),
      ApiProxy.request(
        `/api/v1/namespaces/${namespace}/pods?labelSelector=strimzi.io/cluster=${clusterName}`
      ),
    ])
      .then(([nodePoolData, podData]: [{ items?: KafkaNodePool[] }, { items?: Pod[] }]) => {
        if (nodePoolData?.items) {
          const pools = nodePoolData.items.filter(
            (pool: KafkaNodePool) =>
              pool.metadata.labels?.['strimzi.io/cluster'] === clusterName &&
              pool.metadata.namespace === namespace
          );
          setNodePools(pools);
        }
        if (podData?.items) {
          setPods(podData.items);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [kafka.metadata.name, kafka.metadata.namespace]);

  // Generate topology nodes
  React.useEffect(() => {
    if (loading) return;

    const clusterName = kafka.metadata.name;
    const generatedNodes: Node[] = [];

    // Calculate dimensions
    const nodeWidth = 200;
    const nodeSpacing = 24;
    const labelHeight = 70;
    const podNodeHeight = 200;
    const groupPadding = { top: labelHeight + 16, right: 20, bottom: 20, left: 20 };

    // Root cluster node
    let clusterWidth = 400;
    let clusterHeight = 400;

    if (nodePools.length > 0) {
      // Calculate size based on node pools
      const poolsPerRow = 3;
      const rows = Math.ceil(nodePools.length / poolsPerRow);

      let maxPoolHeight = 0;
      let totalWidth = groupPadding.left + groupPadding.right;

      nodePools.forEach((pool, idx) => {
        const replicas = pool.spec.replicas;
        const poolHeight =
          groupPadding.top + groupPadding.bottom + replicas * (podNodeHeight + nodeSpacing);
        maxPoolHeight = Math.max(maxPoolHeight, poolHeight);

        if ((idx + 1) % poolsPerRow !== 0 && idx < nodePools.length - 1) {
          totalWidth += nodeWidth + nodeSpacing;
        }
      });

      clusterWidth = Math.max(
        totalWidth + Math.min(nodePools.length, poolsPerRow) * (nodeWidth + nodeSpacing),
        600
      );
      clusterHeight = labelHeight + 40 + rows * (maxPoolHeight + nodeSpacing);
    } else if (isKRaft) {
      const brokerCount = kafka.spec.kafka.replicas;
      clusterHeight =
        labelHeight +
        60 +
        brokerCount * (podNodeHeight + nodeSpacing) +
        groupPadding.top +
        groupPadding.bottom;
      clusterWidth = Math.max(nodeWidth + groupPadding.left + groupPadding.right + 80, 500);
    } else {
      const zkCount = kafka.spec.zookeeper?.replicas || 0;
      const brokerCount = kafka.spec.kafka.replicas;
      const maxCount = Math.max(zkCount, brokerCount);
      clusterHeight =
        labelHeight +
        60 +
        maxCount * (podNodeHeight + nodeSpacing) +
        groupPadding.top +
        groupPadding.bottom;
      clusterWidth =
        (zkCount > 0 ? 2 : 1) * (nodeWidth + groupPadding.left + groupPadding.right + nodeSpacing) +
        80;
    }

    // Cluster node
    generatedNodes.push({
      id: 'cluster',
      type: 'group',
      position: { x: 0, y: 0 },
      data: { label: '' },
      style: {
        width: clusterWidth,
        height: clusterHeight,
        backgroundColor: COLORS.cluster.bg,
        border: `3px dashed ${COLORS.cluster.border}`,
        borderRadius: '16px',
        padding: `${labelHeight + 20}px 20px 20px 20px`,
      },
    });

    // Cluster label
    generatedNodes.push({
      id: 'cluster-label',
      type: 'default',
      position: { x: 20, y: 16 },
      data: {
        label: (
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
              {clusterName}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.95)', fontWeight: 500 }}>
              {isKRaft ? 'KRaft Mode' : 'ZooKeeper Mode'} • {kafka.metadata.namespace} •{' '}
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: clusterReady
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(239, 68, 68, 0.3)',
                  marginLeft: '4px',
                }}
              >
                {clusterReady ? '✓ Ready' : '✗ Not Ready'}
              </span>
            </div>
          </div>
        ),
      },
      style: {
        background: COLORS.cluster.label,
        border: 'none',
        borderRadius: '10px',
        padding: '12px 20px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        minWidth: '300px',
      },
      parentId: 'cluster',
      draggable: false,
      selectable: false,
    });

    const startY = labelHeight + 40;

    if (nodePools.length > 0) {
      // KRaft with NodePools
      const poolsPerRow = 3;

      nodePools.forEach((pool, poolIndex) => {
        const row = Math.floor(poolIndex / poolsPerRow);
        const col = poolIndex % poolsPerRow;

        const poolName = pool.metadata.name;
        const roles = pool.spec.roles || [];
        const replicas = pool.spec.replicas;
        const nodeIds = pool.status?.nodeIds || Array.from({ length: replicas }, (_, i) => i);

        const isController = roles.includes('controller');
        const isBroker = roles.includes('broker');
        const isDual = isController && isBroker;

        const roleLabel = isDual ? 'Controller + Broker' : isController ? 'Controller' : 'Broker';
        const poolColor = isDual ? COLORS.dual : isController ? COLORS.controller : COLORS.broker;

        const poolHeight =
          groupPadding.top +
          groupPadding.bottom +
          replicas * (podNodeHeight + nodeSpacing) -
          nodeSpacing;
        const poolX = 40 + col * (nodeWidth + groupPadding.left + groupPadding.right + nodeSpacing);
        const poolY = startY + row * (poolHeight + nodeSpacing + 20);

        // Node pool group
        generatedNodes.push({
          id: `pool-${poolName}`,
          type: 'group',
          position: { x: poolX, y: poolY },
          data: { label: '' },
          style: {
            width: nodeWidth + groupPadding.left + groupPadding.right,
            height: poolHeight,
            backgroundColor: COLORS.nodePool.bg,
            border: `2px solid ${COLORS.nodePool.border}`,
            borderRadius: '12px',
            padding: `${groupPadding.top}px ${groupPadding.right}px ${groupPadding.bottom}px ${groupPadding.left}px`,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          },
          parentId: 'cluster',
          extent: 'parent' as const,
        });

        // Pool label
        generatedNodes.push(
          createGroupLabel({
            id: `pool-label-${poolName}`,
            title: poolName,
            subtitle: `${roleLabel} • ${replicas} replicas`,
            parentId: `pool-${poolName}`,
            color: COLORS.nodePool,
          })
        );

        // Individual pod nodes
        nodeIds.forEach((nodeId, index) => {
          const podName = `${clusterName}-${poolName}-${nodeId}`;
          const pod = pods.find(p => p.metadata?.name === podName);

          generatedNodes.push(
            createPodNode({
              id: `pod-${poolName}-${nodeId}`,
              name: poolName,
              nodeId,
              role: isDual ? 'C+B' : isController ? 'Ctrl' : 'Broker',
              parentId: `pool-${poolName}`,
              position: { x: 20, y: labelHeight + index * (podNodeHeight + nodeSpacing) },
              color: poolColor,
              pod,
            })
          );
        });
      });
    } else if (isKRaft) {
      // KRaft legacy (no node pools)
      const brokerCount = kafka.spec.kafka.replicas;
      const groupHeight =
        groupPadding.top +
        groupPadding.bottom +
        brokerCount * (podNodeHeight + nodeSpacing) -
        nodeSpacing;

      generatedNodes.push({
        id: 'broker-group',
        type: 'group',
        position: { x: 40, y: startY },
        data: { label: '' },
        style: {
          width: nodeWidth + groupPadding.left + groupPadding.right,
          height: groupHeight,
          backgroundColor: COLORS.nodePool.bg,
          border: `2px solid ${COLORS.controller.border}`,
          borderRadius: '12px',
          padding: `${groupPadding.top}px ${groupPadding.right}px ${groupPadding.bottom}px ${groupPadding.left}px`,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        },
        parentId: 'cluster',
        extent: 'parent' as const,
      });

      generatedNodes.push(
        createGroupLabel({
          id: 'broker-group-label',
          title: 'KRaft Brokers',
          subtitle: `Controller + Broker • ${brokerCount} replicas`,
          parentId: 'broker-group',
          color: COLORS.controller,
        })
      );

      for (let i = 0; i < brokerCount; i++) {
        const podName = `${clusterName}-kafka-${i}`;
        const pod = pods.find(p => p.metadata?.name === podName);

        generatedNodes.push(
          createPodNode({
            id: `pod-broker-${i}`,
            name: 'kafka',
            nodeId: i,
            role: 'C+B',
            parentId: 'broker-group',
            position: { x: 20, y: labelHeight + i * (podNodeHeight + nodeSpacing) },
            color: COLORS.controller,
            pod,
          })
        );
      }
    } else {
      // ZooKeeper mode
      const zkCount = kafka.spec.zookeeper?.replicas || 0;
      const brokerCount = kafka.spec.kafka.replicas;

      let currentX = 40;

      // ZooKeeper group
      if (zkCount > 0) {
        const zkGroupHeight =
          groupPadding.top +
          groupPadding.bottom +
          zkCount * (podNodeHeight + nodeSpacing) -
          nodeSpacing;

        generatedNodes.push({
          id: 'zk-group',
          type: 'group',
          position: { x: currentX, y: startY },
          data: { label: '' },
          style: {
            width: nodeWidth + groupPadding.left + groupPadding.right,
            height: zkGroupHeight,
            backgroundColor: COLORS.nodePool.bg,
            border: `2px solid ${COLORS.zookeeper.border}`,
            borderRadius: '12px',
            padding: `${groupPadding.top}px ${groupPadding.right}px ${groupPadding.bottom}px ${groupPadding.left}px`,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          },
          parentId: 'cluster',
          extent: 'parent' as const,
        });

        generatedNodes.push(
          createGroupLabel({
            id: 'zk-group-label',
            title: 'ZooKeeper',
            subtitle: `Ensemble • ${zkCount} nodes`,
            parentId: 'zk-group',
            color: COLORS.zookeeper,
          })
        );

        for (let i = 0; i < zkCount; i++) {
          const podName = `${clusterName}-zookeeper-${i}`;
          const pod = pods.find(p => p.metadata?.name === podName);

          generatedNodes.push(
            createPodNode({
              id: `pod-zk-${i}`,
              name: 'zookeeper',
              nodeId: i,
              role: 'Metadata',
              parentId: 'zk-group',
              position: { x: 20, y: labelHeight + i * (podNodeHeight + nodeSpacing) },
              color: COLORS.zookeeper,
              pod,
            })
          );
        }

        currentX += nodeWidth + groupPadding.left + groupPadding.right + nodeSpacing + 20;
      }

      // Broker group
      const brokerGroupHeight =
        groupPadding.top +
        groupPadding.bottom +
        brokerCount * (podNodeHeight + nodeSpacing) -
        nodeSpacing;

      generatedNodes.push({
        id: 'broker-group',
        type: 'group',
        position: { x: currentX, y: startY },
        data: { label: '' },
        style: {
          width: nodeWidth + groupPadding.left + groupPadding.right,
          height: brokerGroupHeight,
          backgroundColor: COLORS.nodePool.bg,
          border: `2px solid ${COLORS.broker.border}`,
          borderRadius: '12px',
          padding: `${groupPadding.top}px ${groupPadding.right}px ${groupPadding.bottom}px ${groupPadding.left}px`,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        },
        parentId: 'cluster',
        extent: 'parent' as const,
      });

      generatedNodes.push(
        createGroupLabel({
          id: 'broker-group-label',
          title: 'Kafka Brokers',
          subtitle: `Data Nodes • ${brokerCount} replicas`,
          parentId: 'broker-group',
          color: COLORS.broker,
        })
      );

      for (let i = 0; i < brokerCount; i++) {
        const podName = `${clusterName}-kafka-${i}`;
        const pod = pods.find(p => p.metadata?.name === podName);

        generatedNodes.push(
          createPodNode({
            id: `pod-broker-${i}`,
            name: 'kafka',
            nodeId: i,
            role: 'Broker',
            parentId: 'broker-group',
            position: { x: 20, y: labelHeight + i * (podNodeHeight + nodeSpacing) },
            color: COLORS.broker,
            pod,
          })
        );
      }
    }

    setNodes(generatedNodes);
  }, [kafka, isKRaft, nodePools, pods, loading, clusterReady]);

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          height: '700px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
        }}
      >
        <div
          style={{
            fontSize: '16px',
            color: '#64748b',
            fontWeight: 500,
          }}
        >
          Loading topology...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '700px',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        fitView
        fitViewOptions={{ padding: 0.15, maxZoom: 1.0 }}
        minZoom={0.3}
        maxZoom={2.0}
      >
        <Background color="#e2e8f0" gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={node => {
            if (node.id === 'cluster') return COLORS.cluster.border;
            if (node.id.startsWith('pool-')) return COLORS.nodePool.border;
            if (node.id.includes('zk')) return COLORS.zookeeper.border;
            if (node.id.includes('controller')) return COLORS.controller.border;
            return COLORS.broker.border;
          }}
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
          }}
        />
        <Panel position="top-right">
          <div
            style={{
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '10px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontSize: '13px',
              minWidth: '180px',
            }}
          >
            <div
              style={{ fontWeight: 700, marginBottom: '12px', color: '#1e293b', fontSize: '14px' }}
            >
              Legend
            </div>

            {nodePools.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    backgroundColor: COLORS.nodePool.border,
                    borderRadius: '3px',
                    marginRight: '8px',
                  }}
                />
                <span style={{ color: '#475569' }}>NodePool</span>
              </div>
            )}

            {isKRaft && (
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    backgroundColor: COLORS.controller.border,
                    borderRadius: '3px',
                    marginRight: '8px',
                  }}
                />
                <span style={{ color: '#475569' }}>Controller</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span
                style={{
                  width: '14px',
                  height: '14px',
                  backgroundColor: COLORS.broker.border,
                  borderRadius: '3px',
                  marginRight: '8px',
                }}
              />
              <span style={{ color: '#475569' }}>Broker</span>
            </div>

            {!isKRaft && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    backgroundColor: COLORS.zookeeper.border,
                    borderRadius: '3px',
                    marginRight: '8px',
                  }}
                />
                <span style={{ color: '#475569' }}>ZooKeeper</span>
              </div>
            )}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function KafkaClusterTopology({ kafka }: TopologyProps) {
  return (
    <ReactFlowProvider>
      <TopologyFlow kafka={kafka} />
    </ReactFlowProvider>
  );
}

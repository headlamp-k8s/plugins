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

// Dark theme color scheme with better contrast and readability
const COLORS = {
  cluster: {
    border: '#818cf8',
    bg: 'rgba(129, 140, 248, 0.1)',
    label: '#6366f1',
  },
  nodePool: {
    border: '#a78bfa',
    bg: 'rgba(167, 139, 250, 0.12)',
    label: '#8b5cf6',
  },
  controller: {
    border: '#34d399',
    bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.2) 100%)',
    label: '#10b981',
  },
  broker: {
    border: '#60a5fa',
    bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.2) 100%)',
    label: '#3b82f6',
  },
  zookeeper: {
    border: '#fbbf24',
    bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.2) 100%)',
    label: '#f59e0b',
  },
  dual: {
    border: '#a78bfa',
    bg: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(124, 58, 237, 0.2) 100%)',
    label: '#8b5cf6',
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
        <div style={{ padding: '6px' }}>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: color.label,
              marginBottom: '10px',
              textAlign: 'center',
              letterSpacing: '0.3px',
            }}
          >
            {name}-{nodeId}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#e2e8f0',
              lineHeight: '1.8',
              fontWeight: 500,
            }}
          >
            <div>
              <strong style={{ color: '#f1f5f9' }}>ID:</strong> {nodeId}
            </div>
            <div>
              <strong style={{ color: '#f1f5f9' }}>Role:</strong> {role}
            </div>
            <div>
              <strong style={{ color: '#f1f5f9' }}>IP:</strong> {podIP}
            </div>
            <div>
              <strong style={{ color: '#f1f5f9' }}>Phase:</strong> {phase}
            </div>
          </div>
          <div
            style={{
              marginTop: '10px',
              padding: '6px 10px',
              borderRadius: '5px',
              fontSize: '12px',
              fontWeight: 700,
              textAlign: 'center',
              backgroundColor: ready ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
              color: ready ? '#34d399' : '#f87171',
              letterSpacing: '0.5px',
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
              fontSize: '16px',
              fontWeight: 700,
              color: 'white',
              marginBottom: '3px',
              letterSpacing: '0.3px',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 500,
              letterSpacing: '0.2px',
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
    const nodeSpacing = 16;
    const labelHeight = 70;
    const podNodeHeight = 200;
    const groupPadding = { top: labelHeight + 48, right: 20, bottom: 20, left: 20 };

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
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '5px', letterSpacing: '0.4px' }}>
              {clusterName}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.98)', fontWeight: 500, letterSpacing: '0.2px' }}>
              {isKRaft ? 'KRaft Mode' : 'ZooKeeper Mode'} • {kafka.metadata.namespace} •{' '}
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: '5px',
                  backgroundColor: clusterReady
                    ? 'rgba(16, 185, 129, 0.35)'
                    : 'rgba(239, 68, 68, 0.35)',
                  marginLeft: '5px',
                  fontWeight: 600,
                  letterSpacing: '0.3px',
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
      // KRaft with KafkaNodePools
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
              position: { x: 20, y: labelHeight + 32 + index * (podNodeHeight + nodeSpacing) },
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
            position: { x: 20, y: labelHeight + 32 + i * (podNodeHeight + nodeSpacing) },
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
              position: { x: 20, y: labelHeight + 32 + i * (podNodeHeight + nodeSpacing) },
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
            position: { x: 20, y: labelHeight + 32 + i * (podNodeHeight + nodeSpacing) },
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
          backgroundColor: '#0f172a',
        }}
      >
        <div
          style={{
            fontSize: '17px',
            color: '#cbd5e1',
            fontWeight: 600,
            letterSpacing: '0.3px',
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
        backgroundColor: '#0f172a',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
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
        <Background color="#1e293b" gap={20} size={1} />
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
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
          }}
          maskColor="rgba(15, 23, 42, 0.7)"
        />
        <Panel position="top-right">
          <div
            style={{
              backgroundColor: '#1e293b',
              padding: '16px',
              borderRadius: '10px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
              fontSize: '13px',
              minWidth: '180px',
              border: '1px solid #334155',
            }}
          >
            <div
              style={{ fontWeight: 700, marginBottom: '12px', color: '#f1f5f9', fontSize: '15px', letterSpacing: '0.3px' }}
            >
              Legend
            </div>

            {nodePools.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: COLORS.nodePool.border,
                    borderRadius: '3px',
                    marginRight: '10px',
                  }}
                />
                <span style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 500, letterSpacing: '0.2px' }}>KafkaNodePool</span>
              </div>
            )}

            {isKRaft && (
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: COLORS.controller.border,
                    borderRadius: '3px',
                    marginRight: '10px',
                  }}
                />
                <span style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 500, letterSpacing: '0.2px' }}>Controller</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: COLORS.broker.border,
                  borderRadius: '3px',
                  marginRight: '10px',
                }}
              />
              <span style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 500, letterSpacing: '0.2px' }}>Broker</span>
            </div>

            {!isKRaft && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: COLORS.zookeeper.border,
                    borderRadius: '3px',
                    marginRight: '10px',
                  }}
                />
                <span style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 500, letterSpacing: '0.2px' }}>ZooKeeper</span>
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

// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Angelo Cesaro

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
    border: '#f472b6',
    bg: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(219, 39, 119, 0.2) 100%)',
    label: '#ec4899',
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
  role: string;
  replicas: number;
  parentId: string;
  color: typeof COLORS.nodePool;
}): Node {
  const { id, title, role, replicas, parentId, color } = params;

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
            {role}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 500,
              letterSpacing: '0.2px',
            }}
          >
            Replicas: {replicas}
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

    // Calculate dimensions - horizontal pod layout
    const podNodeWidth = 180;
    const podNodeHeight = 200;
    const nodeSpacing = 24;
    const labelHeight = 150;
    const groupLabelHeight = 95;
    const groupPadding = { top: groupLabelHeight + 25, right: 30, bottom: 30, left: 30 };
    const groupSpacing = 30;

    // Root cluster node
    let clusterWidth = 400;
    let clusterHeight = 400;

    if (nodePools.length > 0) {
      // KRaft with KafkaNodePools - stack groups vertically
      let maxGroupWidth = 0;
      let totalGroupHeight = 0;

      nodePools.forEach((pool) => {
        const replicas = pool.spec.replicas;
        const groupWidth = groupPadding.left + groupPadding.right + replicas * (podNodeWidth + nodeSpacing) - nodeSpacing;
        const groupHeight = groupPadding.top + groupPadding.bottom + podNodeHeight;
        maxGroupWidth = Math.max(maxGroupWidth, groupWidth);
        totalGroupHeight += groupHeight + groupSpacing;
      });

      clusterWidth = Math.max(maxGroupWidth + 80, 600);
      clusterHeight = labelHeight + 40 + totalGroupHeight;
    } else if (isKRaft) {
      // KRaft legacy - single group with horizontal pods
      const brokerCount = kafka.spec.kafka.replicas;
      const groupWidth = groupPadding.left + groupPadding.right + brokerCount * (podNodeWidth + nodeSpacing) - nodeSpacing;
      const groupHeight = groupPadding.top + groupPadding.bottom + podNodeHeight;
      clusterWidth = Math.max(groupWidth + 80, 600);
      clusterHeight = labelHeight + 60 + groupHeight;
    } else {
      // ZooKeeper mode - two groups stacked vertically
      const zkCount = kafka.spec.zookeeper?.replicas || 0;
      const brokerCount = kafka.spec.kafka.replicas;
      const maxPods = Math.max(zkCount, brokerCount);
      const groupWidth = groupPadding.left + groupPadding.right + maxPods * (podNodeWidth + nodeSpacing) - nodeSpacing;
      const groupHeight = groupPadding.top + groupPadding.bottom + podNodeHeight;
      clusterWidth = Math.max(groupWidth + 80, 600);
      clusterHeight = labelHeight + 60 + (zkCount > 0 ? 2 : 1) * (groupHeight + groupSpacing);
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
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '5px', letterSpacing: '0.4px' }}>
              {clusterName}
            </div>
            <div style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.95)', fontWeight: 500, marginBottom: '4px' }}>
              Mode: {isKRaft ? 'KRaft' : 'ZooKeeper'}
            </div>
            <div style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.95)', fontWeight: 500, marginBottom: '8px' }}>
              Namespace: {kafka.metadata.namespace}
            </div>
            <div>
              <span
                style={{
                  padding: '5px 12px',
                  borderRadius: '5px',
                  fontSize: '14px',
                  backgroundColor: clusterReady
                    ? 'rgba(16, 185, 129, 0.35)'
                    : 'rgba(239, 68, 68, 0.35)',
                  fontWeight: 600,
                  letterSpacing: '0.3px',
                  color: 'white',
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
      // KRaft with KafkaNodePools - groups stacked vertically, pods horizontal
      // Sort: controllers first, then brokers (brokers always last)
      const sortedPools = [...nodePools].sort((a, b) => {
        const aRoles = a.spec.roles || [];
        const bRoles = b.spec.roles || [];
        const aIsController = aRoles.includes('controller');
        const bIsController = bRoles.includes('controller');
        const aIsBroker = aRoles.includes('broker') && !aIsController;
        const bIsBroker = bRoles.includes('broker') && !bIsController;

        // Controllers first, pure brokers last
        if (aIsController && !bIsController) return -1;
        if (!aIsController && bIsController) return 1;
        if (aIsBroker && !bIsBroker) return 1;
        if (!aIsBroker && bIsBroker) return -1;
        return 0;
      });

      let currentY = startY;

      sortedPools.forEach((pool) => {
        const poolName = pool.metadata.name;
        const roles = pool.spec.roles || [];
        const replicas = pool.spec.replicas;
        const nodeIds = pool.status?.nodeIds || Array.from({ length: replicas }, (_, i) => i);

        const isController = roles.includes('controller');
        const isBroker = roles.includes('broker');
        const isDual = isController && isBroker;

        const roleLabel = isDual ? 'Controller + Broker' : isController ? 'Controller' : 'Broker';
        const poolColor = isDual ? COLORS.dual : isController ? COLORS.controller : COLORS.broker;

        // Horizontal layout: width based on number of pods
        const groupWidth = groupPadding.left + groupPadding.right + replicas * (podNodeWidth + nodeSpacing) - nodeSpacing;
        const groupHeight = groupPadding.top + groupPadding.bottom + podNodeHeight;

        // Center the group horizontally in the cluster
        const groupX = (clusterWidth - groupWidth) / 2;

        // Node pool group
        generatedNodes.push({
          id: `pool-${poolName}`,
          type: 'group',
          position: { x: groupX, y: currentY },
          data: { label: '' },
          style: {
            width: groupWidth,
            height: groupHeight,
            backgroundColor: COLORS.nodePool.bg,
            border: `2px solid ${COLORS.nodePool.border}`,
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          },
          parentId: 'cluster',
          extent: 'parent' as const,
        });

        // Pool label - centered
        generatedNodes.push(
          createGroupLabel({
            id: `pool-label-${poolName}`,
            title: poolName,
            role: roleLabel,
            replicas: replicas,
            parentId: `pool-${poolName}`,
            color: COLORS.nodePool,
          })
        );

        // Individual pod nodes - horizontal layout
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
              position: { x: groupPadding.left + index * (podNodeWidth + nodeSpacing), y: groupPadding.top },
              color: poolColor,
              pod,
            })
          );
        });

        currentY += groupHeight + groupSpacing;
      });
    } else if (isKRaft) {
      // KRaft legacy (no node pools) - single group, horizontal pods
      const brokerCount = kafka.spec.kafka.replicas;
      const groupWidth = groupPadding.left + groupPadding.right + brokerCount * (podNodeWidth + nodeSpacing) - nodeSpacing;
      const groupHeight = groupPadding.top + groupPadding.bottom + podNodeHeight;
      const groupX = (clusterWidth - groupWidth) / 2;

      generatedNodes.push({
        id: 'broker-group',
        type: 'group',
        position: { x: groupX, y: startY },
        data: { label: '' },
        style: {
          width: groupWidth,
          height: groupHeight,
          backgroundColor: COLORS.nodePool.bg,
          border: `2px solid ${COLORS.controller.border}`,
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        },
        parentId: 'cluster',
        extent: 'parent' as const,
      });

      generatedNodes.push(
        createGroupLabel({
          id: 'broker-group-label',
          title: 'KRaft Brokers',
          role: 'Controller + Broker',
          replicas: brokerCount,
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
            position: { x: groupPadding.left + i * (podNodeWidth + nodeSpacing), y: groupPadding.top },
            color: COLORS.controller,
            pod,
          })
        );
      }
    } else {
      // ZooKeeper mode - two groups stacked vertically (ZK on top, Brokers below), horizontal pods
      const zkCount = kafka.spec.zookeeper?.replicas || 0;
      const brokerCount = kafka.spec.kafka.replicas;

      const groupHeight = groupPadding.top + groupPadding.bottom + podNodeHeight;

      let currentY = startY;

      // ZooKeeper group (on top)
      if (zkCount > 0) {
        const zkGroupWidth = groupPadding.left + groupPadding.right + zkCount * (podNodeWidth + nodeSpacing) - nodeSpacing;
        const groupX = (clusterWidth - zkGroupWidth) / 2;

        generatedNodes.push({
          id: 'zk-group',
          type: 'group',
          position: { x: groupX, y: currentY },
          data: { label: '' },
          style: {
            width: zkGroupWidth,
            height: groupHeight,
            backgroundColor: COLORS.nodePool.bg,
            border: `2px solid ${COLORS.zookeeper.border}`,
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          },
          parentId: 'cluster',
          extent: 'parent' as const,
        });

        generatedNodes.push(
          createGroupLabel({
            id: 'zk-group-label',
            title: 'ZooKeeper',
            role: 'Ensemble',
            replicas: zkCount,
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
              position: { x: groupPadding.left + i * (podNodeWidth + nodeSpacing), y: groupPadding.top },
              color: COLORS.zookeeper,
              pod,
            })
          );
        }

        currentY += groupHeight + groupSpacing;
      }

      // Broker group (below ZK)
      const brokerGroupWidth = groupPadding.left + groupPadding.right + brokerCount * (podNodeWidth + nodeSpacing) - nodeSpacing;
      const brokerGroupX = (clusterWidth - brokerGroupWidth) / 2;

      generatedNodes.push({
        id: 'broker-group',
        type: 'group',
        position: { x: brokerGroupX, y: currentY },
        data: { label: '' },
        style: {
          width: brokerGroupWidth,
          height: groupHeight,
          backgroundColor: COLORS.nodePool.bg,
          border: `2px solid ${COLORS.broker.border}`,
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        },
        parentId: 'cluster',
        extent: 'parent' as const,
      });

      generatedNodes.push(
        createGroupLabel({
          id: 'broker-group-label',
          title: 'Kafka Brokers',
          role: 'Data Nodes',
          replicas: brokerCount,
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
            position: { x: groupPadding.left + i * (podNodeWidth + nodeSpacing), y: groupPadding.top },
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
      <style>{`
        /* Improve ReactFlow Controls visibility */
        .react-flow__controls {
          background-color: #475569 !important;
          border: 1px solid #64748b !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4) !important;
        }
        .react-flow__controls-button {
          background-color: #64748b !important;
          border-bottom: 1px solid #475569 !important;
          color: #f1f5f9 !important;
        }
        .react-flow__controls-button:hover {
          background-color: #94a3b8 !important;
        }
        .react-flow__controls-button svg {
          fill: #f1f5f9 !important;
        }

        /* Improve ReactFlow MiniMap visibility */
        .react-flow__minimap {
          background-color: #475569 !important;
          border: 1px solid #64748b !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4) !important;
        }
      `}</style>
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

            {isKRaft && (
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: COLORS.dual.border,
                    borderRadius: '3px',
                    marginRight: '10px',
                  }}
                />
                <span style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 500, letterSpacing: '0.2px' }}>Controller + Broker</span>
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

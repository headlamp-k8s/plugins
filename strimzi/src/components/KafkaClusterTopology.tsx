// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Angelo Cesaro

import React from 'react';
import {
  ReactFlow,
  Node,
  Background,
  Controls,
  ReactFlowProvider,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Kafka, KafkaNodePool, isKRaftMode } from '../crds';
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { useTopologyTheme } from '../hooks/useTopologyTheme';
import { getSemanticColors, SemanticColors } from '../utils/topologyColors';

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
  color: { border: string; bg: string; label: string };
  pod?: Pod;
  theme: ReturnType<typeof useTopologyTheme>;
}): Node {
  const { id, name, nodeId, role, parentId, position, color, pod, theme } = params;
  const podIP = pod?.status?.podIP || 'N/A';
  const ready = isPodReady(pod);
  const phase = pod?.status?.phase || 'Unknown';

  return {
    id,
    type: 'default',
    position,
    data: {
      label: (
        <div style={{ padding: theme.spacing.sm }}>
          <div
            style={{
              fontSize: theme.typography.fontSize.medium,
              fontWeight: theme.typography.fontWeight.bold,
              fontFamily: theme.typography.fontFamily,
              color: theme.colors.nodeText,
              marginBottom: theme.spacing.sm,
              textAlign: 'center',
              letterSpacing: theme.typography.letterSpacing,
            }}
          >
            {name}-{nodeId}
          </div>
          <div
            style={{
              fontSize: theme.typography.fontSize.small,
              fontFamily: theme.typography.fontFamily,
              color: theme.colors.nodeTextSecondary,
              lineHeight: theme.typography.lineHeight.relaxed,
              fontWeight: theme.typography.fontWeight.medium,
            }}
          >
            <div>
              <strong style={{ color: theme.colors.nodeText }}>ID: </strong> {nodeId}
            </div>
            <div>
              <strong style={{ color: theme.colors.nodeText }}>Role: </strong> {role}
            </div>
            <div>
              <strong style={{ color: theme.colors.nodeText }}>IP: </strong> {podIP}
            </div>
            <div>
              <strong style={{ color: theme.colors.nodeText }}>Phase: </strong> {phase}
            </div>
          </div>
          <div
            style={{
              marginTop: theme.spacing.sm,
              padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
              borderRadius: '5px',
              fontSize: theme.typography.fontSize.small,
              fontFamily: theme.typography.fontFamily,
              fontWeight: theme.typography.fontWeight.bold,
              textAlign: 'center',
              backgroundColor: ready
                ? theme.colors.statusReadyBg
                : theme.colors.statusNotReadyBg,
              color: ready ? theme.colors.statusReady : theme.colors.statusNotReady,
              letterSpacing: theme.typography.letterSpacing,
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
      padding: theme.spacing.md,
      width: 'fit-content',
      minHeight: 'fit-content',
      boxShadow: theme.colors.nodeShadow,
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
  color: { border: string; bg: string; label: string };
  theme: ReturnType<typeof useTopologyTheme>;
}): Node {
  const { id, title, role, replicas, parentId, color, theme } = params;

  return {
    id,
    type: 'default',
    position: { x: 16, y: 16 },
    data: {
      label: (
        <div>
          <div
            style={{
              fontSize: theme.typography.fontSize.large,
              fontWeight: theme.typography.fontWeight.bold,
              fontFamily: theme.typography.fontFamily,
              color: theme.colors.nodeText,
              marginBottom: theme.spacing.xs,
              letterSpacing: theme.typography.letterSpacing,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: theme.typography.fontSize.medium,
              fontFamily: theme.typography.fontFamily,
              color: theme.colors.nodeText,
              fontWeight: theme.typography.fontWeight.medium,
              letterSpacing: theme.typography.letterSpacing,
            }}
          >
            {role}
          </div>
          <div
            style={{
              fontSize: theme.typography.fontSize.medium,
              fontFamily: theme.typography.fontFamily,
              color: theme.colors.nodeText,
              fontWeight: theme.typography.fontWeight.medium,
              letterSpacing: theme.typography.letterSpacing,
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
      padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
      boxShadow: theme.colors.nodeShadow,
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

  // Get theme and semantic colors
  const theme = useTopologyTheme();
  const colors = React.useMemo(() => getSemanticColors(theme), [theme]);

  // Helper to convert hex color to rgba with opacity
  const hexToRgba = React.useCallback((hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }, []);

  // Legend colors - same color palette as topology, higher opacity for visibility
  // In light mode: 0.5 for legend visibility, in dark mode: use solid colors
  const legendOpacity = theme.isDark ? 1.0 : 0.5;

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
    const namespace = kafka.metadata.namespace;
    const generatedNodes: Node[] = [];

    // Calculate dimensions - horizontal pod layout
    const podNodeWidth = 180;
    const podNodeHeight = 200;
    const nodeSpacing = 24;
    const namespaceLabelHeight = 80;
    const clusterLabelHeight = 120;
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
      clusterHeight = clusterLabelHeight + 40 + totalGroupHeight;
    } else if (isKRaft) {
      // KRaft legacy - single group with horizontal pods
      const brokerCount = kafka.spec.kafka.replicas;
      const groupWidth = groupPadding.left + groupPadding.right + brokerCount * (podNodeWidth + nodeSpacing) - nodeSpacing;
      const groupHeight = groupPadding.top + groupPadding.bottom + podNodeHeight;
      clusterWidth = Math.max(groupWidth + 80, 600);
      clusterHeight = clusterLabelHeight + 60 + groupHeight;
    } else {
      // ZooKeeper mode - two groups stacked vertically
      const zkCount = kafka.spec.zookeeper?.replicas || 0;
      const brokerCount = kafka.spec.kafka.replicas;
      const maxPods = Math.max(zkCount, brokerCount);
      const groupWidth = groupPadding.left + groupPadding.right + maxPods * (podNodeWidth + nodeSpacing) - nodeSpacing;
      const groupHeight = groupPadding.top + groupPadding.bottom + podNodeHeight;
      clusterWidth = Math.max(groupWidth + 80, 600);
      clusterHeight = clusterLabelHeight + 60 + (zkCount > 0 ? 2 : 1) * (groupHeight + groupSpacing);
    }

    // Namespace dimensions
    const namespacePadding = 40;
    const namespaceWidth = clusterWidth + 2 * namespacePadding;
    const namespaceHeight = namespaceLabelHeight + 40 + clusterHeight + namespacePadding;

    // Namespace node (root)
    generatedNodes.push({
      id: 'namespace',
      type: 'group',
      position: { x: 0, y: 0 },
      data: { label: '' },
      style: {
        width: namespaceWidth,
        height: namespaceHeight,
        backgroundColor: hexToRgba(colors.cluster.border, 0.05),
        border: `3px solid ${hexToRgba(colors.cluster.border, 0.3)}`,
        borderRadius: '20px',
        padding: `${namespaceLabelHeight + 20}px ${namespacePadding}px ${namespacePadding}px ${namespacePadding}px`,
      },
    });

    // Namespace label
    generatedNodes.push({
      id: 'namespace-label',
      type: 'default',
      position: { x: 10, y: 10 },
      data: {
        label: (
          <div
            style={{
              fontSize: theme.typography.fontSize.medium,
              fontFamily: theme.typography.fontFamily,
              color: theme.colors.nodeTextSecondary,
              fontWeight: theme.typography.fontWeight.medium,
            }}
          >
            Namespace: {namespace}
          </div>
        ),
      },
      style: {
        background: hexToRgba(colors.cluster.label, 0.95),
        border: `1px solid ${hexToRgba(colors.cluster.border, 0.3)}`,
        borderRadius: '10px',
        padding: '6px 10px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        minWidth: 'fit-content',
      },
      parentId: 'namespace',
      draggable: false,
      selectable: false,
    });

    // Cluster node
    generatedNodes.push({
      id: 'cluster',
      type: 'group',
      position: { x: 20, y: namespaceLabelHeight + 10 },
      data: { label: '' },
      style: {
        width: clusterWidth,
        height: clusterHeight,
        backgroundColor: colors.cluster.bg,
        border: `3px solid ${colors.cluster.border}`,
        borderRadius: '16px',
        padding: `${clusterLabelHeight + 20}px 20px 20px 20px`,
      },
      parentId: 'namespace',
      extent: 'parent' as const,
    });

    // Cluster label
    generatedNodes.push({
      id: 'cluster-label',
      type: 'default',
      position: { x: 10, y: 10 },
      data: {
        label: (
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: theme.colors.nodeText, marginBottom: '3px', letterSpacing: '0.4px' }}>
              Kafka: {clusterName}
            </div>
            <div style={{ fontSize: '16px', color: theme.colors.nodeText, fontWeight: 500, marginBottom: '8px' }}>
              Mode: {isKRaft ? 'KRaft' : 'ZooKeeper'}
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
                  color: clusterReady ? theme.colors.statusReady : theme.colors.statusNotReady,
                }}
              >
                {clusterReady ? '✓ Ready' : '✗ Not Ready'}
              </span>
            </div>
          </div>
        ),
      },
      style: {
        background: colors.cluster.label,
        border: 'none',
        borderRadius: '10px',
        padding: '12px 20px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        minWidth: 'fit-content',
      },
      parentId: 'cluster',
      draggable: false,
      selectable: false,
    });

    const startY = clusterLabelHeight + 40;

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
        const poolColor = isDual ? colors.dual : isController ? colors.controller : colors.broker;

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
            backgroundColor: colors.nodePool.bg,
            border: `2px solid ${colors.nodePool.border}`,
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
            color: colors.nodePool,
            theme,
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
              theme,
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
          backgroundColor: colors.nodePool.bg,
          border: `2px solid ${colors.controller.border}`,
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
          color: colors.controller,
          theme,
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
            color: colors.controller,
            pod,
            theme,
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
            backgroundColor: colors.nodePool.bg,
            border: `2px solid ${colors.zookeeper.border}`,
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
            color: colors.zookeeper,
            theme,
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
              color: colors.zookeeper,
              pod,
              theme,
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
          backgroundColor: colors.nodePool.bg,
          border: `2px solid ${colors.broker.border}`,
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
          color: colors.broker,
          theme,
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
            color: colors.broker,
            pod,
            theme,
          })
        );
      }
    }

    setNodes(generatedNodes);
  }, [kafka, isKRaft, nodePools, pods, loading, clusterReady, colors, theme]);

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          height: 'calc(100vh - 250px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.canvasBackground,
          fontFamily: theme.typography.fontFamily,
        }}
      >
        <div
          style={{
            fontSize: theme.typography.fontSize.large,
            color: theme.colors.nodeTextSecondary,
            fontWeight: theme.typography.fontWeight.bold,
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
        height: 'calc(100vh - 250px)',
        backgroundColor: theme.colors.canvasBackground,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: theme.colors.nodeShadow,
      }}
    >
      <style>{`
        /* Theme-aware ReactFlow Controls */
        .react-flow__controls {
          background-color: ${theme.colors.controlsBg} !important;
          border: 1px solid ${theme.colors.controlsBorder} !important;
          box-shadow: ${theme.colors.nodeShadow} !important;
        }
        .react-flow__controls-button {
          background-color: ${theme.colors.controlsBg} !important;
          border-bottom: 1px solid ${theme.colors.controlsBorder} !important;
          color: ${theme.colors.controlsText} !important;
        }
        .react-flow__controls-button:hover {
          background-color: ${theme.colors.controlsHover} !important;
        }
        .react-flow__controls-button svg {
          fill: ${theme.colors.controlsText} !important;
        }

        /* Theme-aware ReactFlow attribution */
        .react-flow__attribution {
          background-color: ${theme.colors.controlsBg} !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
          border: 1px solid ${theme.colors.controlsBorder} !important;
          box-shadow: ${theme.colors.nodeShadow} !important;
        }
        .react-flow__attribution a {
          color: ${theme.colors.nodeText} !important;
          text-decoration: none !important;
          font-size: ${theme.typography.fontSize.small} !important;
        }

        /* Hide connection handles */
        .react-flow__handle {
          opacity: 0 !important;
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodesFocusable={false}
        fitView
        fitViewOptions={{
          minZoom: 1.0,
          maxZoom: 1.0,
          padding: 0.1
        }}
        minZoom={0.5}
        maxZoom={2.0}
        panOnScroll={true}
      >
        <Background color={theme.colors.gridColor} gap={20} size={1} />
        <Controls />
        <Panel position="top-right">
          <div
            style={{
              backgroundColor: theme.colors.nodeBackground,
              padding: theme.spacing.md,
              borderRadius: '10px',
              boxShadow: theme.colors.nodeShadow,
              fontSize: theme.typography.fontSize.medium,
              fontFamily: theme.typography.fontFamily,
              minWidth: 'fit-content',
              border: `1px solid ${theme.colors.nodeBorder}`,
            }}
          >
            <div
              style={{
                fontWeight: theme.typography.fontWeight.bold,
                marginBottom: theme.spacing.sm,
                color: theme.colors.nodeText,
                fontSize: theme.typography.fontSize.medium,
              }}
            >
              Legend
            </div>

            {nodePools.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: theme.spacing.xs }}>
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: theme.isDark ? theme.colors.nodePool : hexToRgba(theme.colors.nodePool, legendOpacity),
                    borderRadius: '3px',
                    marginRight: theme.spacing.sm,
                  }}
                />
                <span
                  style={{
                    color: theme.colors.nodeTextSecondary,
                    fontSize: theme.typography.fontSize.small,
                    fontWeight: theme.typography.fontWeight.medium,
                  }}
                >
                  KafkaNodePool
                </span>
              </div>
            )}

            {isKRaft && (
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: theme.spacing.xs }}>
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: theme.isDark ? theme.colors.controller : hexToRgba(theme.colors.controller, legendOpacity),
                    borderRadius: '3px',
                    marginRight: theme.spacing.sm,
                  }}
                />
                <span
                  style={{
                    color: theme.colors.nodeTextSecondary,
                    fontSize: theme.typography.fontSize.small,
                    fontWeight: theme.typography.fontWeight.medium,
                  }}
                >
                  Controller
                </span>
              </div>
            )}

            {isKRaft && (
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: theme.spacing.xs }}>
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: theme.isDark ? theme.colors.dual : hexToRgba(theme.colors.dual, legendOpacity),
                    borderRadius: '3px',
                    marginRight: theme.spacing.sm,
                  }}
                />
                <span
                  style={{
                    color: theme.colors.nodeTextSecondary,
                    fontSize: theme.typography.fontSize.small,
                    fontWeight: theme.typography.fontWeight.medium,
                  }}
                >
                  Controller + Broker
                </span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: theme.spacing.xs }}>
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: theme.isDark ? theme.colors.broker : hexToRgba(theme.colors.broker, legendOpacity),
                  borderRadius: '3px',
                  marginRight: theme.spacing.sm,
                }}
              />
              <span
                style={{
                  color: theme.colors.nodeTextSecondary,
                  fontSize: theme.typography.fontSize.small,
                  fontWeight: theme.typography.fontWeight.medium,
                }}
              >
                Broker
              </span>
            </div>

            {!isKRaft && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: theme.isDark ? theme.colors.zookeeper : hexToRgba(theme.colors.zookeeper, legendOpacity),
                    borderRadius: '3px',
                    marginRight: theme.spacing.sm,
                  }}
                />
                <span
                  style={{
                    color: theme.colors.nodeTextSecondary,
                    fontSize: theme.typography.fontSize.small,
                    fontWeight: theme.typography.fontWeight.medium,
                  }}
                >
                  ZooKeeper
                </span>
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

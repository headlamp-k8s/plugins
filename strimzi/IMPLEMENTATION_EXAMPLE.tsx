// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Angelo Cesaro

/**
 * COMPLETE WORKING EXAMPLE
 * This file shows how to integrate useTopologyTheme() into KafkaClusterTopology.tsx
 *
 * KEY CHANGES FROM ORIGINAL:
 * 1. Import useTopologyTheme and getSemanticColors
 * 2. Replace COLORS constant with dynamic theme-based colors
 * 3. Use theme for all styling (colors, fonts, spacing)
 * 4. Update ReactFlow canvas, controls, and components
 */

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
import { getSemanticColors } from '../utils/topologyColors';

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

// THEME-AWARE NODE CREATOR
// This version uses theme for ALL styling
function createThemedPodNode(params: {
  id: string;
  name: string;
  nodeId: number;
  role: string;
  parentId: string;
  position: { x: number; y: number };
  color: { border: string; bg: string; label: string };
  pod?: Pod;
  theme: ReturnType<typeof useTopologyTheme>; // IMPORTANT: Pass theme
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
          {/* Header - uses theme typography and color */}
          <div
            style={{
              fontSize: theme.typography.fontSize.medium,
              fontWeight: theme.typography.fontWeight.bold,
              fontFamily: theme.typography.fontFamily,
              color: color.label,
              marginBottom: theme.spacing.sm,
              textAlign: 'center',
              letterSpacing: theme.typography.letterSpacing,
            }}
          >
            {name}-{nodeId}
          </div>

          {/* Details - uses theme text colors and typography */}
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
              <strong style={{ color: theme.colors.nodeText }}>ID:</strong> {nodeId}
            </div>
            <div>
              <strong style={{ color: theme.colors.nodeText }}>Role:</strong> {role}
            </div>
            <div>
              <strong style={{ color: theme.colors.nodeText }}>IP:</strong> {podIP}
            </div>
            <div>
              <strong style={{ color: theme.colors.nodeText }}>Phase:</strong> {phase}
            </div>
          </div>

          {/* Status Badge - uses theme status colors */}
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
              color: ready
                ? theme.colors.statusReady
                : theme.colors.statusNotReady,
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
      width: 180,
      minHeight: 160,
      boxShadow: theme.colors.nodeShadow, // Uses theme shadow
    },
    parentId,
    extent: 'parent' as const,
  };
}

// MAIN TOPOLOGY COMPONENT
function TopologyFlow({ kafka }: TopologyProps) {
  const [nodePools, setNodePools] = React.useState<KafkaNodePool[]>([]);
  const [pods, setPods] = React.useState<Pod[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [nodes, setNodes] = React.useState<Node[]>([]);

  // ✅ STEP 1: Get the theme
  const theme = useTopologyTheme();

  // ✅ STEP 2: Generate semantic colors based on theme
  const colors = React.useMemo(() => getSemanticColors(theme), [theme]);

  const isKRaft = React.useMemo(() => isKRaftMode(kafka), [kafka]);
  const clusterReady = React.useMemo(
    () => kafka.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True',
    [kafka.status]
  );

  // Fetch data (unchanged)
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
      .catch(error => {
        console.error('Error fetching topology data:', error);
        setLoading(false);
      });
  }, [kafka.metadata.name, kafka.metadata.namespace]);

  // Generate nodes with theme
  React.useEffect(() => {
    if (loading) return;

    const clusterName = kafka.metadata.name;
    const generatedNodes: Node[] = [];

    // Example: Create a broker node
    nodePools.forEach((pool, poolIndex) => {
      const roles = pool.spec.roles || [];
      const replicas = pool.spec.replicas;
      const isController = roles.includes('controller');
      const isBroker = roles.includes('broker');
      const isDual = isController && isBroker;

      // ✅ Use theme-aware colors
      const poolColor = isDual ? colors.dual : isController ? colors.controller : colors.broker;

      // Create nodes with theme
      for (let i = 0; i < replicas; i++) {
        const podName = `${clusterName}-${pool.metadata.name}-${i}`;
        const pod = pods.find(p => p.metadata?.name === podName);

        generatedNodes.push(
          createThemedPodNode({
            id: `pod-${pool.metadata.name}-${i}`,
            name: pool.metadata.name,
            nodeId: i,
            role: isDual ? 'C+B' : isController ? 'Ctrl' : 'Broker',
            parentId: 'cluster',
            position: { x: poolIndex * 200 + i * 200, y: 100 },
            color: poolColor,
            pod,
            theme, // ✅ Pass theme
          })
        );
      }
    });

    setNodes(generatedNodes);
  }, [kafka, nodePools, pods, loading, colors, theme]);

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          height: '700px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.canvasBackground, // ✅ Theme-aware
          fontFamily: theme.typography.fontFamily, // ✅ Theme font
        }}
      >
        <div
          style={{
            fontSize: theme.typography.fontSize.large, // ✅ Theme font size
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
        height: '700px',
        backgroundColor: theme.colors.canvasBackground, // ✅ Theme background
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: theme.colors.nodeShadow, // ✅ Theme shadow
      }}
    >
      {/* ✅ Dynamic CSS using theme */}
      <style>{`
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
        {/* ✅ Theme-aware background */}
        <Background color={theme.colors.gridColor} gap={20} size={1} />

        <Controls />

        {/* ✅ Theme-aware legend */}
        <Panel position="top-right">
          <div
            style={{
              backgroundColor: theme.colors.nodeBackground,
              padding: theme.spacing.md,
              borderRadius: '10px',
              boxShadow: theme.colors.nodeShadow,
              fontSize: theme.typography.fontSize.medium,
              fontFamily: theme.typography.fontFamily,
              minWidth: '180px',
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

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: theme.spacing.xs }}>
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: colors.broker.border,
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

/**
 * KEY TAKEAWAYS:
 *
 * 1. Always call useTopologyTheme() at the top of your component
 * 2. Use getSemanticColors(theme) to get Kafka-specific colors
 * 3. Replace ALL hardcoded values with theme.* properties
 * 4. Pass theme to node creation functions
 * 5. Theme updates automatically - no manual listeners needed
 *
 * MIGRATION PATTERN:
 * - '#ffffff' → theme.colors.nodeBackground
 * - '#000000' → theme.colors.nodeText
 * - '14px' → theme.typography.fontSize.medium
 * - 'Roboto, sans-serif' → theme.typography.fontFamily
 * - '8px' → theme.spacing.sm
 */

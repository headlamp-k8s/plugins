// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Angelo Cesaro

import React from 'react';
import {
  ReactFlow,
  Node,
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  useStore,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Icon } from '@iconify/react';
import { Button, ButtonGroup, Box, useTheme, Chip } from '@mui/material';
import { Kafka, KafkaNodePool, StrimziPodSet, isKRaftMode } from '../crds';
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { useTopologyTheme } from '../hooks/useTopologyTheme';
import { getSemanticColors, hexToRgba } from '../utils/topologyColors';

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

// Layout constants - centralized configuration
const LAYOUT = {
  // Label heights
  CLUSTER_LABEL_HEIGHT: 85,
  GROUP_LABEL_HEIGHT: 85,
  PODSET_LABEL_HEIGHT: 95,

  // Padding offsets
  LABEL_TOP_OFFSET: 25,
  PADDING_HORIZONTAL: 30,
  PADDING_VERTICAL: 30,

  // Node dimensions (base values for dynamic calculation)
  POD_NODE_MIN_WIDTH: 200,
  POD_NODE_BASE_HEIGHT: 180,
  POD_NODE_PADDING: 12,
  POD_CONTENT_CHAR_WIDTH: 8, // Average character width for width calculation
  NODE_SPACING: 20,

  // Group spacing
  GROUP_SPACING: 30,

  // Cluster dimensions
  CLUSTER_MIN_WIDTH: 300,
  CLUSTER_HORIZONTAL_MARGIN: 80,
  CLUSTER_VERTICAL_MARGIN_START: 40,
  CLUSTER_VERTICAL_MARGIN_LEGACY: 60,
  CLUSTER_VERTICAL_MARGIN_END: 40,

  // Namespace dimensions
  NAMESPACE_PADDING: 30,
  NAMESPACE_LABEL_HEIGHT: 50,

  // Background grid
  GRID_GAP: 20,
  GRID_SIZE: 1,

  // Namespace styling
  NAMESPACE_BORDER_WIDTH: 2,
  NAMESPACE_BG_OPACITY: 0.25,

  // Progressive opacity for nested blocks
  CLUSTER_BG_OPACITY: 0.30,
  GROUP_BG_OPACITY: 0.35,
  POD_BG_OPACITY: 0.40,

  // Icon sizes for labels
  NAMESPACE_ICON_SIZE: 40,
  CLUSTER_ICON_SIZE: 40,
  GROUP_ICON_SIZE: 40,
  POD_ICON_SIZE: 40,
} as const;

// Computed padding configurations
const PADDING = {
  group: {
    top: LAYOUT.GROUP_LABEL_HEIGHT + LAYOUT.LABEL_TOP_OFFSET,
    right: LAYOUT.PADDING_HORIZONTAL,
    bottom: LAYOUT.PADDING_VERTICAL,
    left: LAYOUT.PADDING_HORIZONTAL,
  },
  podSet: {
    top: LAYOUT.PODSET_LABEL_HEIGHT + LAYOUT.LABEL_TOP_OFFSET,
    right: LAYOUT.PADDING_HORIZONTAL,
    bottom: LAYOUT.PADDING_VERTICAL,
    left: LAYOUT.PADDING_HORIZONTAL,
  },
} as const;

interface PodDimensions {
  width: number;
  height: number;
}

interface NodePoolDimensions {
  podSetInnerWidth: number;
  podSetInnerHeight: number;
  poolWidth: number;
  poolHeight: number;
}

/**
 * Calculate optimal dimensions for a pod based on its content
 * Uses configurable character width heuristic from LAYOUT constant
 */
function calculatePodDimensions(params: {
  name: string;
  nodeId: number;
  role: string;
  podIP: string;
  phase: string;
}): PodDimensions {
  const { name, nodeId, role, podIP, phase } = params;

  // Calculate width based on longest content line
  const titleText = `Pod: ${name}-${nodeId}`;
  const idText = `ID: ${nodeId}`;
  const roleText = `Role: ${role}`;
  const ipText = `IP: ${podIP}`;
  const phaseText = `Phase: ${phase}`;
  const statusText = '✗ Not Ready'; // Longest status text

  const maxTextLength = Math.max(
    titleText.length,
    idText.length,
    roleText.length,
    ipText.length,
    phaseText.length,
    statusText.length
  );

  // Calculate width: icon + text + padding
  const calculatedWidth =
    LAYOUT.POD_ICON_SIZE + // Icon
    20 + // Gap between icon and text
    (maxTextLength * LAYOUT.POD_CONTENT_CHAR_WIDTH) + // Text content
    (LAYOUT.POD_NODE_PADDING * 3); // Padding

  const width = Math.max(LAYOUT.POD_NODE_MIN_WIDTH, calculatedWidth);
  const height = LAYOUT.POD_NODE_BASE_HEIGHT;

  return { width, height };
}

/**
 * Calculate dimensions for KafkaNodePool with nested StrimziPodSet structure
 * Now accepts array of pod dimensions to accommodate variable pod sizes
 */
function calculateNodePoolDimensions(podDimensions: PodDimensions[]): NodePoolDimensions {
  const totalPodsWidth = podDimensions.reduce((sum, dim) => sum + dim.width, 0);
  const maxPodHeight = Math.max(...podDimensions.map(dim => dim.height));
  const spacing = (podDimensions.length - 1) * LAYOUT.NODE_SPACING;

  const podSetInnerWidth = PADDING.podSet.left + PADDING.podSet.right + totalPodsWidth + spacing;
  const podSetInnerHeight = PADDING.podSet.top + PADDING.podSet.bottom + maxPodHeight;

  const poolWidth = PADDING.group.left + PADDING.group.right + podSetInnerWidth;
  const poolHeight = PADDING.group.top + PADDING.group.bottom + podSetInnerHeight;

  return { podSetInnerWidth, podSetInnerHeight, poolWidth, poolHeight };
}

// Helper to determine if pod is ready
function isPodReady(pod: Pod | undefined): boolean {
  if (!pod?.status?.conditions) return false;
  const readyCondition = pod.status.conditions.find(c => c.type === 'Ready');
  return readyCondition?.status === 'True';
}

// Resource icon component with colored circle background
function ResourceIcon({
  icon,
  color,
  size = '24px',
}: {
  icon: string;
  color: string;
  size?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `${color}20`, // 12% opacity
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon
        icon={icon}
        width={`calc(${size} * 0.6)`}
        height={`calc(${size} * 0.6)`}
        style={{ color }}
      />
    </div>
  );
}

// Custom control button component
function GraphControlButton({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  const theme = useTheme();

  const sx = {
    width: '32px',
    height: '32px',
    padding: 0,
    minWidth: '32px',
    borderRadius: '50%',
    '> svg': { width: '14px', height: '14px' },
    fontSize: 'x-small',
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: 'none',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 2px 4px rgba(0,0,0,0.3)'
      : '0 2px 4px rgba(0,0,0,0.1)',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&.Mui-disabled': {
      backgroundColor: theme.palette.action.disabledBackground,
      color: theme.palette.action.disabled,
    },
  };

  return (
    <Button
      disabled={disabled}
      sx={sx}
      variant="contained"
      title={title}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

// Custom controls component
function GraphControls({ children }: { children?: React.ReactNode }) {
  const minZoomReached = useStore(it => it.transform[2] <= it.minZoom);
  const maxZoomReached = useStore(it => it.transform[2] >= it.maxZoom);
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <Box display="flex" gap={1} flexDirection="column">
      <ButtonGroup
        sx={{
          borderRadius: '40px',
          '> .MuiButtonGroup-grouped': { minWidth: '32px' },
        }}
        orientation="vertical"
        variant="contained"
      >
        <GraphControlButton
          disabled={maxZoomReached}
          title="Zoom in"
          onClick={() => zoomIn()}
        >
          <Icon icon="mdi:plus" />
        </GraphControlButton>
        <GraphControlButton
          disabled={minZoomReached}
          title="Zoom out"
          onClick={() => zoomOut()}
        >
          <Icon icon="mdi:minus" />
        </GraphControlButton>
      </ButtonGroup>
      <ButtonGroup
        sx={{
          borderRadius: '40px',
          '> .MuiButtonGroup-grouped': { minWidth: '32px' },
        }}
        orientation="vertical"
        variant="contained"
      >
        <GraphControlButton title="Fit to screen" onClick={() => fitView()}>
          <Icon icon="mdi:fit-to-screen" />
        </GraphControlButton>
        <GraphControlButton
          title="Zoom to 100%"
          onClick={() => fitView({ minZoom: 1.0, maxZoom: 1.0 })}
        >
          100%
        </GraphControlButton>
      </ButtonGroup>
      {children}
    </Box>
  );
}

// Modern node component for individual pods
function createPodNode(params: {
  id: string;
  name: string;
  nodeId: number;
  role: string;
  parentId: string;
  position: { x: number; y: number };
  pod?: Pod;
  theme: ReturnType<typeof useTopologyTheme>;
  width: number;
  height: number;
}): Node {
  const { id, name, nodeId, role, parentId, position, pod, theme, width, height } = params;
  const podIP = pod?.status?.podIP || 'N/A';
  const ready = isPodReady(pod);
  const phase = pod?.status?.phase || 'Unknown';

  return {
    id,
    type: 'default',
    position,
    data: {
      label: (
        <div style={{ padding: '6px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: theme.typography.fontSize.large,
              fontWeight: theme.typography.fontWeight.bold,
              fontFamily: theme.typography.fontFamily,
              color: theme.colors.nodeText,
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              gap: '8px',
              letterSpacing: theme.typography.letterSpacing,
            }}
          >
            <ResourceIcon icon="mdi:cube" color="#00ACC1" size={`${LAYOUT.POD_ICON_SIZE}px`} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.3', alignItems: 'flex-start' }}>
              <span
                style={{
                  fontSize: theme.typography.fontSize.large,
                  fontWeight: theme.typography.fontWeight.bold,
                  whiteSpace: 'nowrap',
                }}
              >
                Pod
              </span>
              <span
                style={{
                  fontSize: theme.typography.fontSize.medium,
                  fontWeight: theme.typography.fontWeight.medium,
                  whiteSpace: 'nowrap',
                }}
              >
                {name}-{nodeId}
              </span>
            </div>
          </div>
          <div
            style={{
              fontSize: '13px',
              fontFamily: theme.typography.fontFamily,
              color: theme.colors.nodeTextSecondary,
              lineHeight: '1.5',
              fontWeight: theme.typography.fontWeight.medium,
              flex: 1,
              textAlign: 'left',
            }}
          >
            <div>
              <strong style={{ color: theme.colors.nodeText }}>ID: </strong> {nodeId}
            </div>
            <div>
              <strong style={{ color: theme.colors.nodeText }}>Role: </strong> {role}
            </div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <strong style={{ color: theme.colors.nodeText }}>IP: </strong> {podIP}
            </div>
            <div>
              <strong style={{ color: theme.colors.nodeText }}>Phase: </strong> {phase}
            </div>
          </div>
          <div style={{ marginTop: '6px', textAlign: 'center' }}>
            <StatusBadge ready={ready} />
          </div>
        </div>
      ),
    },
    style: {
      background: hexToRgba(theme.colors.nodeBackground, LAYOUT.POD_BG_OPACITY),
      border: `${LAYOUT.NAMESPACE_BORDER_WIDTH}px solid ${theme.colors.nodeBorder}`,
      borderRadius: '12px',
      padding: 0,
      width,
      height,
      boxShadow: theme.colors.nodeShadow,
      overflow: 'hidden',
    },
    parentId,
    extent: 'parent' as const,
  };
}

// Status badge component for consistent styling
function StatusBadge({
  ready,
}: {
  ready: boolean;
  theme?: ReturnType<typeof useTopologyTheme>;
}) {
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === 'dark';

  return (
    <Chip
      label={ready ? 'Ready' : 'Not Ready'}
      variant={isDark ? 'outlined' : 'filled'}
      size="medium"
      color={ready ? 'success' : 'warning'}
      sx={{
        borderRadius: isDark ? undefined : '4px',
      }}
    />
  );
}

// Modern group label component
function createGroupLabel(params: {
  id: string;
  title: string;
  parentId: string;
  theme: ReturnType<typeof useTopologyTheme>;
  resourceType: 'KafkaNodePool' | 'StrimziPodSet';
  replicaInfo?: string;
}): Node {
  const { id, title, parentId, theme, resourceType, replicaInfo } = params;

  // Icon and color based on resource type
  const getResourceIconConfig = () => {
    switch (resourceType) {
      case 'KafkaNodePool':
        return { icon: 'mdi:server', color: '#0baf9e' };
      case 'StrimziPodSet':
        return { icon: 'mdi:view-grid-outline', color: '#0baf9e' };
      default:
        return { icon: 'mdi:cube', color: '#0baf9e' };
    }
  };

  const iconConfig = getResourceIconConfig();

  return {
    id,
    type: 'default',
    position: { x: 20, y: 20 },
    data: {
      label: (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <ResourceIcon icon={iconConfig.icon} color={iconConfig.color} size={`${LAYOUT.GROUP_ICON_SIZE}px`} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.3', alignItems: 'flex-start' }}>
            <span
              style={{
                fontSize: theme.typography.fontSize.large,
                fontWeight: theme.typography.fontWeight.bold,
                fontFamily: theme.typography.fontFamily,
                color: theme.colors.nodeText,
                letterSpacing: theme.typography.letterSpacing,
                whiteSpace: 'nowrap',
              }}
            >
              {resourceType}
            </span>
            <span
              style={{
                fontSize: theme.typography.fontSize.medium,
                fontWeight: theme.typography.fontWeight.medium,
                fontFamily: theme.typography.fontFamily,
                color: theme.colors.nodeText,
                letterSpacing: theme.typography.letterSpacing,
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </span>
            {replicaInfo && (
              <span
                style={{
                  fontSize: theme.typography.fontSize.small,
                  fontWeight: theme.typography.fontWeight.medium,
                  fontFamily: theme.typography.fontFamily,
                  color: theme.colors.nodeTextSecondary,
                  letterSpacing: theme.typography.letterSpacing,
                  whiteSpace: 'nowrap',
                  marginTop: '2px',
                }}
              >
                {replicaInfo}
              </span>
            )}
          </div>
        </div>
      ),
    },
    style: {
      background: 'transparent',
      border: 'none',
      padding: 0,
    },
    parentId,
    draggable: false,
    selectable: false,
  };
}

function TopologyFlow({ kafka }: TopologyProps) {
  const [nodePools, setNodePools] = React.useState<KafkaNodePool[]>([]);
  const [podSets, setPodSets] = React.useState<StrimziPodSet[]>([]);
  const [pods, setPods] = React.useState<Pod[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [nodes, setNodes] = React.useState<Node[]>([]);

  // Get theme and semantic colors
  const theme = useTopologyTheme();
  const colors = React.useMemo(() => getSemanticColors(theme), [theme]);

  const isKRaft = React.useMemo(() => isKRaftMode(kafka), [kafka]);
  const clusterReady = React.useMemo(
    () => kafka.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True',
    [kafka.status]
  );

  // Fetch node pools, pod sets, and pods
  React.useEffect(() => {
    const clusterName = kafka.metadata.name;
    const namespace = kafka.metadata.namespace;

    Promise.all([
      ApiProxy.request('/apis/kafka.strimzi.io/v1beta2/kafkanodepools'),
      ApiProxy.request('/apis/core.strimzi.io/v1beta2/strimzipodsets'),
      ApiProxy.request(
        `/api/v1/namespaces/${namespace}/pods?labelSelector=strimzi.io/cluster=${clusterName}`
      ),
    ])
      .then(
        ([nodePoolData, podSetData, podData]: [
          { items?: KafkaNodePool[] },
          { items?: StrimziPodSet[] },
          { items?: Pod[] }
        ]) => {
          if (nodePoolData?.items) {
            const pools = nodePoolData.items.filter(
              (pool: KafkaNodePool) =>
                pool.metadata.labels?.['strimzi.io/cluster'] === clusterName &&
                pool.metadata.namespace === namespace
            );
            setNodePools(pools);
          }
          if (podSetData?.items) {
            const sets = podSetData.items.filter(
              (set: StrimziPodSet) =>
                set.metadata.labels?.['strimzi.io/cluster'] === clusterName &&
                set.metadata.namespace === namespace
            );
            setPodSets(sets);
          }
          if (podData?.items) {
            setPods(podData.items);
          }
          setLoading(false);
        }
      )
      .catch((err) => {
        console.error('Failed to fetch Kafka topology data:', err);
        setLoading(false);
      });
  }, [kafka.metadata.name, kafka.metadata.namespace]);

  // Generate topology nodes
  React.useEffect(() => {
    if (loading) return;

    const clusterName = kafka.metadata.name;
    const namespace = kafka.metadata.namespace;
    const generatedNodes: Node[] = [];

    // PHASE 1: Calculate ALL pod dimensions first (based on real data)
    // This ensures cluster/namespace dimensions are accurate
    let allPoolDimensions: Array<{ poolName: string; podDimensions: PodDimensions[]; dimensions: NodePoolDimensions }> = [];
    let kraftLegacyDimensions: { podDimensions: PodDimensions[]; groupWidth: number; groupHeight: number } | null = null;
    let zkDimensions: { podDimensions: PodDimensions[]; groupWidth: number; groupHeight: number } | null = null;
    let zkBrokerDimensions: { podDimensions: PodDimensions[]; groupWidth: number; groupHeight: number } | null = null;

    if (nodePools.length > 0) {
      // Calculate dimensions for all NodePools
      allPoolDimensions = nodePools.map((pool) => {
        const poolName = pool.metadata.name;
        const roles = pool.spec.roles || [];
        const replicas = pool.spec.replicas;
        const nodeIds = pool.status?.nodeIds || Array.from({ length: replicas }, (_, i) => i);
        const isController = roles.includes('controller');
        const isBroker = roles.includes('broker');
        const isDual = isController && isBroker;

        const podDimensions = nodeIds.map((nodeId) => {
          const podName = `${clusterName}-${poolName}-${nodeId}`;
          const pod = pods.find(p => p.metadata?.name === podName);
          return calculatePodDimensions({
            name: poolName,
            nodeId,
            role: isDual ? 'Controller + Broker' : isController ? 'Controller' : 'Broker',
            podIP: pod?.status?.podIP || 'N/A',
            phase: pod?.status?.phase || 'Unknown',
          });
        });

        return {
          poolName,
          podDimensions,
          dimensions: calculateNodePoolDimensions(podDimensions)
        };
      });
    } else if (isKRaft) {
      // KRaft legacy - calculate broker dimensions
      const brokerCount = kafka.spec.kafka.replicas;
      const brokerPodDimensions: PodDimensions[] = [];
      for (let i = 0; i < brokerCount; i++) {
        const podName = `${clusterName}-kafka-${i}`;
        const pod = pods.find(p => p.metadata?.name === podName);
        brokerPodDimensions.push(
          calculatePodDimensions({
            name: 'kafka',
            nodeId: i,
            role: 'Controller + Broker',
            podIP: pod?.status?.podIP || 'N/A',
            phase: pod?.status?.phase || 'Unknown',
          })
        );
      }
      const totalBrokerWidth = brokerPodDimensions.reduce((sum, dim) => sum + dim.width, 0);
      const maxBrokerHeight = Math.max(...brokerPodDimensions.map(dim => dim.height));
      const brokerSpacing = (brokerCount - 1) * LAYOUT.NODE_SPACING;

      kraftLegacyDimensions = {
        podDimensions: brokerPodDimensions,
        groupWidth: PADDING.group.left + PADDING.group.right + totalBrokerWidth + brokerSpacing,
        groupHeight: PADDING.group.top + PADDING.group.bottom + maxBrokerHeight,
      };
    } else {
      // ZooKeeper mode - calculate both ZK and Kafka broker dimensions
      const zkCount = kafka.spec.zookeeper?.replicas || 0;
      const brokerCount = kafka.spec.kafka.replicas;

      // Calculate ZooKeeper dimensions
      if (zkCount > 0) {
        const zkPodDimensions: PodDimensions[] = [];
        for (let i = 0; i < zkCount; i++) {
          const podName = `${clusterName}-zookeeper-${i}`;
          const pod = pods.find(p => p.metadata?.name === podName);
          zkPodDimensions.push(
            calculatePodDimensions({
              name: 'zookeeper',
              nodeId: i,
              role: 'Metadata',
              podIP: pod?.status?.podIP || 'N/A',
              phase: pod?.status?.phase || 'Unknown',
            })
          );
        }
        const totalZkWidth = zkPodDimensions.reduce((sum, dim) => sum + dim.width, 0);
        const maxZkHeight = Math.max(...zkPodDimensions.map(dim => dim.height));
        const zkSpacing = (zkCount - 1) * LAYOUT.NODE_SPACING;

        zkDimensions = {
          podDimensions: zkPodDimensions,
          groupWidth: PADDING.group.left + PADDING.group.right + totalZkWidth + zkSpacing,
          groupHeight: PADDING.group.top + PADDING.group.bottom + maxZkHeight,
        };
      }

      // Calculate Kafka broker dimensions
      const brokerPodDimensions: PodDimensions[] = [];
      for (let i = 0; i < brokerCount; i++) {
        const podName = `${clusterName}-kafka-${i}`;
        const pod = pods.find(p => p.metadata?.name === podName);
        brokerPodDimensions.push(
          calculatePodDimensions({
            name: 'kafka',
            nodeId: i,
            role: 'Broker',
            podIP: pod?.status?.podIP || 'N/A',
            phase: pod?.status?.phase || 'Unknown',
          })
        );
      }
      const totalBrokerWidth = brokerPodDimensions.reduce((sum, dim) => sum + dim.width, 0);
      const maxBrokerHeight = Math.max(...brokerPodDimensions.map(dim => dim.height));
      const brokerSpacing = (brokerCount - 1) * LAYOUT.NODE_SPACING;

      zkBrokerDimensions = {
        podDimensions: brokerPodDimensions,
        groupWidth: PADDING.group.left + PADDING.group.right + totalBrokerWidth + brokerSpacing,
        groupHeight: PADDING.group.top + PADDING.group.bottom + maxBrokerHeight,
      };
    }

    // PHASE 2: Calculate cluster dimensions using REAL pod dimensions
    let clusterWidth = 400;
    let clusterHeight = 400;
    let maxPoolWidth = 0; // Maximum width among all NodePools (for alignment)
    let maxPodSetWidth = 0; // Maximum width among all PodSets in ZK mode (for alignment)
    let maxPodSetInnerWidth = 0; // Maximum width among all PodSets in NodePools mode (for alignment)

    if (nodePools.length > 0) {
      // KRaft with KafkaNodePools
      let totalPoolHeight = 0;

      allPoolDimensions.forEach(({ dimensions }) => {
        maxPoolWidth = Math.max(maxPoolWidth, dimensions.poolWidth);
        maxPodSetInnerWidth = Math.max(maxPodSetInnerWidth, dimensions.podSetInnerWidth);
        totalPoolHeight += dimensions.poolHeight + LAYOUT.GROUP_SPACING;
      });

      clusterWidth = Math.max(maxPoolWidth + LAYOUT.CLUSTER_HORIZONTAL_MARGIN, LAYOUT.CLUSTER_MIN_WIDTH);
      clusterHeight = LAYOUT.CLUSTER_LABEL_HEIGHT + LAYOUT.CLUSTER_VERTICAL_MARGIN_START + totalPoolHeight + LAYOUT.CLUSTER_VERTICAL_MARGIN_END;
    } else if (isKRaft && kraftLegacyDimensions) {
      // KRaft legacy
      clusterWidth = Math.max(kraftLegacyDimensions.groupWidth + LAYOUT.CLUSTER_HORIZONTAL_MARGIN, LAYOUT.CLUSTER_MIN_WIDTH);
      clusterHeight = LAYOUT.CLUSTER_LABEL_HEIGHT + LAYOUT.CLUSTER_VERTICAL_MARGIN_LEGACY + kraftLegacyDimensions.groupHeight + LAYOUT.CLUSTER_VERTICAL_MARGIN_END;
    } else {
      // ZooKeeper mode - use pre-calculated dimensions
      const zkGroupWidth = zkDimensions?.groupWidth || 0;
      const zkGroupHeight = zkDimensions?.groupHeight || 0;
      const brokerGroupWidth = zkBrokerDimensions?.groupWidth || 0;
      const brokerGroupHeight = zkBrokerDimensions?.groupHeight || 0;

      maxPodSetWidth = Math.max(zkGroupWidth, brokerGroupWidth);
      clusterWidth = Math.max(maxPodSetWidth + LAYOUT.CLUSTER_HORIZONTAL_MARGIN, LAYOUT.CLUSTER_MIN_WIDTH);
      clusterHeight =
        LAYOUT.CLUSTER_LABEL_HEIGHT +
        LAYOUT.CLUSTER_VERTICAL_MARGIN_START +
        (zkGroupHeight > 0 ? zkGroupHeight + LAYOUT.GROUP_SPACING : 0) +
        brokerGroupHeight +
        LAYOUT.CLUSTER_VERTICAL_MARGIN_END;
    }

    // Namespace dimensions
    const namespaceWidth = clusterWidth + LAYOUT.NAMESPACE_PADDING * 2;
    const namespaceHeight = clusterHeight + LAYOUT.NAMESPACE_PADDING * 2 + LAYOUT.NAMESPACE_LABEL_HEIGHT + 10;

    // Namespace node (root)
    generatedNodes.push({
      id: 'namespace',
      type: 'group',
      position: { x: 0, y: 0 },
      data: { label: '' },
      style: {
        width: namespaceWidth,
        height: namespaceHeight,
        backgroundColor: hexToRgba(theme.colors.nodeBackground, LAYOUT.NAMESPACE_BG_OPACITY),
        border: `${LAYOUT.NAMESPACE_BORDER_WIDTH}px solid ${theme.colors.nodeBorder}`,
        borderRadius: '16px',
        padding: `${LAYOUT.NAMESPACE_LABEL_HEIGHT + 20}px ${LAYOUT.NAMESPACE_PADDING}px ${LAYOUT.NAMESPACE_PADDING}px ${LAYOUT.NAMESPACE_PADDING}px`,
      },
    });

    // Namespace label
    generatedNodes.push({
      id: 'namespace-label',
      type: 'default',
      position: { x: 20, y: 20 },
      data: {
        label: (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <ResourceIcon icon="mdi:square-rounded-outline" color="#0baf9e" size={`${LAYOUT.NAMESPACE_ICON_SIZE}px`} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.3', alignItems: 'flex-start' }}>
              <span
                style={{
                  fontSize: theme.typography.fontSize.large,
                  fontWeight: theme.typography.fontWeight.bold,
                  fontFamily: theme.typography.fontFamily,
                  color: theme.colors.nodeText,
                  letterSpacing: theme.typography.letterSpacing,
                  whiteSpace: 'nowrap',
                }}
              >
                Namespace
              </span>
              <span
                style={{
                  fontSize: theme.typography.fontSize.medium,
                  fontWeight: theme.typography.fontWeight.medium,
                  fontFamily: theme.typography.fontFamily,
                  color: theme.colors.nodeText,
                  letterSpacing: theme.typography.letterSpacing,
                  whiteSpace: 'nowrap',
                }}
              >
                {namespace}
              </span>
            </div>
          </div>
        ),
      },
      style: {
        background: 'transparent',
        border: 'none',
        padding: 0,
      },
      parentId: 'namespace',
      draggable: false,
      selectable: false,
    });

    // Cluster node (inside namespace)
    generatedNodes.push({
      id: 'cluster',
      type: 'group',
      position: {
        x: LAYOUT.NAMESPACE_PADDING,
        y: LAYOUT.NAMESPACE_LABEL_HEIGHT + 20,
      },
      data: { label: '' },
      style: {
        width: clusterWidth,
        height: clusterHeight,
        backgroundColor: hexToRgba(theme.colors.nodeBackground, LAYOUT.CLUSTER_BG_OPACITY),
        border: `${LAYOUT.NAMESPACE_BORDER_WIDTH}px solid ${theme.colors.nodeBorder}`,
        borderRadius: '16px',
        padding: `${LAYOUT.CLUSTER_LABEL_HEIGHT + 20}px 20px 20px 20px`,
      },
      parentId: 'namespace',
      extent: 'parent' as const,
    });

    // Cluster label
    generatedNodes.push({
      id: 'cluster-label',
      type: 'default',
      position: { x: 20, y: 20 },
      data: {
        label: (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <ResourceIcon icon="mdi:apache-kafka" color="#0baf9e" size={`${LAYOUT.CLUSTER_ICON_SIZE}px`} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.3', alignItems: 'flex-start' }}>
              <span
                style={{
                  fontSize: theme.typography.fontSize.large,
                  fontWeight: theme.typography.fontWeight.bold,
                  fontFamily: theme.typography.fontFamily,
                  color: theme.colors.nodeText,
                  letterSpacing: theme.typography.letterSpacing,
                  whiteSpace: 'nowrap',
                }}
              >
                Kafka
              </span>
              <span
                style={{
                  fontSize: theme.typography.fontSize.medium,
                  fontWeight: theme.typography.fontWeight.medium,
                  fontFamily: theme.typography.fontFamily,
                  color: theme.colors.nodeText,
                  letterSpacing: theme.typography.letterSpacing,
                  whiteSpace: 'nowrap',
                }}
              >
                {clusterName}
              </span>
              {nodePools.length === 0 && (
                <span
                  style={{
                    fontSize: theme.typography.fontSize.small,
                    fontWeight: theme.typography.fontWeight.medium,
                    fontFamily: theme.typography.fontFamily,
                    color: theme.colors.nodeTextSecondary,
                    letterSpacing: theme.typography.letterSpacing,
                    whiteSpace: 'nowrap',
                    marginTop: '2px',
                  }}
                >
                  {isKRaft
                    ? `Replicas: ${kafka.spec.kafka.replicas}`
                    : `Brokers: ${kafka.spec.kafka.replicas}, ZooKeeper: ${kafka.spec.zookeeper?.replicas || 0}`}
                </span>
              )}
              <div style={{ marginTop: '6px' }}>
                <StatusBadge ready={clusterReady} />
              </div>
            </div>
          </div>
        ),
      },
      style: {
        background: 'transparent',
        border: 'none',
        padding: 0,
      },
      parentId: 'cluster',
      draggable: false,
      selectable: false,
    });

    const startY = LAYOUT.CLUSTER_LABEL_HEIGHT + LAYOUT.CLUSTER_VERTICAL_MARGIN_START;

    if (nodePools.length > 0) {
      // PHASE 3: Create nodes using pre-calculated dimensions
      // KRaft with KafkaNodePools - KafkaNodePool → StrimziPodSet → Pod structure
      // Sort: controllers first, then brokers (brokers always last)
      const sortedPoolData = allPoolDimensions
        .map(poolData => {
          const pool = nodePools.find(p => p.metadata.name === poolData.poolName)!;
          return { ...poolData, pool };
        })
        .sort((a, b) => {
          const aRoles = a.pool.spec.roles || [];
          const bRoles = b.pool.spec.roles || [];
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

      sortedPoolData.forEach(({ poolName, podDimensions, dimensions, pool }) => {
        const roles = pool.spec.roles || [];
        const replicas = pool.spec.replicas;
        const nodeIds = pool.status?.nodeIds || Array.from({ length: replicas }, (_, i) => i);

        const isController = roles.includes('controller');
        const isBroker = roles.includes('broker');
        const isDual = isController && isBroker;

        // Find the StrimziPodSet for this pool
        // Name pattern: {strimzi.io/cluster}-{strimzi.io/pool-name}
        const podSet = podSets.find(ps => ps.metadata.name === `${clusterName}-${poolName}`);

        // Use pre-calculated dimensions
        const { podSetInnerHeight, poolHeight } = dimensions;

        // Use maxPoolWidth for all pools to align them
        // Use consistent left margin for all pools
        const poolX = LAYOUT.CLUSTER_HORIZONTAL_MARGIN / 2;

        // Node pool group (outer)
        generatedNodes.push({
          id: `pool-${poolName}`,
          type: 'group',
          position: { x: poolX, y: currentY },
          data: { label: '' },
          style: {
            width: maxPoolWidth,
            height: poolHeight,
            backgroundColor: hexToRgba(theme.colors.nodeBackground, LAYOUT.GROUP_BG_OPACITY),
            border: `${LAYOUT.NAMESPACE_BORDER_WIDTH}px solid ${theme.colors.nodeBorder}`,
            borderRadius: '12px',
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
            parentId: `pool-${poolName}`,
            theme,
            resourceType: 'KafkaNodePool',
            replicaInfo: `Replicas: ${replicas}`,
          })
        );

        // StrimziPodSet group (inner, nested in pool)
        if (podSet) {
          generatedNodes.push({
            id: `podset-${poolName}`,
            type: 'group',
            position: { x: PADDING.group.left, y: PADDING.group.top },
            data: { label: '' },
            style: {
              width: maxPodSetInnerWidth,
              height: podSetInnerHeight,
              backgroundColor: hexToRgba(theme.colors.nodeBackground, LAYOUT.GROUP_BG_OPACITY),
              border: `${LAYOUT.NAMESPACE_BORDER_WIDTH}px solid ${theme.colors.nodeBorder}`,
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            },
            parentId: `pool-${poolName}`,
            extent: 'parent' as const,
          });

          // Calculate ready pods count
          const readyPodsCount = nodeIds.filter(nodeId => {
            const podName = `${clusterName}-${poolName}-${nodeId}`;
            const pod = pods.find(p => p.metadata?.name === podName);
            return isPodReady(pod);
          }).length;

          generatedNodes.push(
            createGroupLabel({
              id: `podset-label-${poolName}`,
              title: podSet.metadata.name,
              parentId: `podset-${poolName}`,
              theme,
              resourceType: 'StrimziPodSet',
              replicaInfo: `Ready Pods: ${readyPodsCount}/${nodeIds.length}`,
            })
          );

          // Individual pod nodes - horizontal layout inside StrimziPodSet
          let cumulativeX = PADDING.podSet.left;
          nodeIds.forEach((nodeId, index) => {
            const podName = `${clusterName}-${poolName}-${nodeId}`;
            const pod = pods.find(p => p.metadata?.name === podName);
            const dimensions = podDimensions[index];

            generatedNodes.push(
              createPodNode({
                id: `pod-${poolName}-${nodeId}`,
                name: poolName,
                nodeId,
                role: isDual ? 'Controller + Broker' : isController ? 'Controller' : 'Broker',
                parentId: `podset-${poolName}`,
                position: {
                  x: cumulativeX,
                  y: PADDING.podSet.top,
                },
                pod,
                theme,
                width: dimensions.width,
                height: dimensions.height,
              })
            );

            cumulativeX += dimensions.width + LAYOUT.NODE_SPACING;
          });
        }

        currentY += poolHeight + LAYOUT.GROUP_SPACING;
      });
    } else if (isKRaft && kraftLegacyDimensions) {
      // KRaft legacy (no node pools) - StrimziPodSet → Pod structure
      // Use pre-calculated dimensions
      const brokerCount = kafka.spec.kafka.replicas;
      const { podDimensions: brokerPodDimensions, groupWidth, groupHeight } = kraftLegacyDimensions;
      const groupX = (clusterWidth - groupWidth) / 2;

      // Find the StrimziPodSet for KRaft legacy mode
      const kafkaPodSet = podSets.find(ps => ps.metadata.name === `${clusterName}-kafka`);

      if (kafkaPodSet) {
        generatedNodes.push({
          id: 'podset-kafka',
          type: 'group',
          position: { x: groupX, y: startY },
          data: { label: '' },
          style: {
            width: groupWidth,
            height: groupHeight,
            backgroundColor: hexToRgba(theme.colors.nodeBackground, LAYOUT.GROUP_BG_OPACITY),
            border: `${LAYOUT.NAMESPACE_BORDER_WIDTH}px solid ${theme.colors.nodeBorder}`,
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          },
          parentId: 'cluster',
          extent: 'parent' as const,
        });

        // Calculate ready pods count
        let readyPodsCount = 0;
        for (let i = 0; i < brokerCount; i++) {
          const podName = `${clusterName}-kafka-${i}`;
          const pod = pods.find(p => p.metadata?.name === podName);
          if (isPodReady(pod)) readyPodsCount++;
        }

        generatedNodes.push(
          createGroupLabel({
            id: 'podset-kafka-label',
            title: kafkaPodSet.metadata.name,
            parentId: 'podset-kafka',
            theme,
            resourceType: 'StrimziPodSet',
            replicaInfo: `Ready Pods: ${readyPodsCount}/${brokerCount}`,
          })
        );

        let cumulativeX = PADDING.group.left;
        for (let i = 0; i < brokerCount; i++) {
          const podName = `${clusterName}-kafka-${i}`;
          const pod = pods.find(p => p.metadata?.name === podName);
          const dimensions = brokerPodDimensions[i];

          generatedNodes.push(
            createPodNode({
              id: `pod-broker-${i}`,
              name: 'kafka',
              nodeId: i,
              role: 'Controller + Broker',
              parentId: 'podset-kafka',
              position: {
                x: cumulativeX,
                y: PADDING.group.top,
              },
              pod,
              theme,
              width: dimensions.width,
              height: dimensions.height,
            })
          );

          cumulativeX += dimensions.width + LAYOUT.NODE_SPACING;
        }
      }
    } else {
      // ZooKeeper mode - StrimziPodSets stacked vertically (ZK on top, Kafka below), horizontal pods
      const zkCount = kafka.spec.zookeeper?.replicas || 0;
      const brokerCount = kafka.spec.kafka.replicas;

      let currentY = startY;

      // Find StrimziPodSets for ZooKeeper and Kafka
      const zkPodSet = podSets.find(ps => ps.metadata.name === `${clusterName}-zookeeper`);
      const kafkaPodSet = podSets.find(ps => ps.metadata.name === `${clusterName}-kafka`);

      // ZooKeeper StrimziPodSet (on top)
      if (zkCount > 0 && zkPodSet && zkDimensions) {
        // Use pre-calculated dimensions
        const { podDimensions: zkPodDimensions, groupHeight: zkGroupHeight } = zkDimensions;
        const groupX = (clusterWidth - maxPodSetWidth) / 2;

        generatedNodes.push({
          id: 'podset-zk',
          type: 'group',
          position: { x: groupX, y: currentY },
          data: { label: '' },
          style: {
            width: maxPodSetWidth,
            height: zkGroupHeight,
            backgroundColor: hexToRgba(theme.colors.nodeBackground, LAYOUT.GROUP_BG_OPACITY),
            border: `${LAYOUT.NAMESPACE_BORDER_WIDTH}px solid ${theme.colors.nodeBorder}`,
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          },
          parentId: 'cluster',
          extent: 'parent' as const,
        });

        // Calculate ready pods count for ZooKeeper
        let zkReadyPodsCount = 0;
        for (let i = 0; i < zkCount; i++) {
          const podName = `${clusterName}-zookeeper-${i}`;
          const pod = pods.find(p => p.metadata?.name === podName);
          if (isPodReady(pod)) zkReadyPodsCount++;
        }

        generatedNodes.push(
          createGroupLabel({
            id: 'podset-zk-label',
            title: zkPodSet.metadata.name,
            parentId: 'podset-zk',
            theme,
            resourceType: 'StrimziPodSet',
            replicaInfo: `Ready Pods: ${zkReadyPodsCount}/${zkCount}`,
          })
        );

        let cumulativeX = PADDING.group.left;
        for (let i = 0; i < zkCount; i++) {
          const podName = `${clusterName}-zookeeper-${i}`;
          const pod = pods.find(p => p.metadata?.name === podName);
          const dimensions = zkPodDimensions[i];

          generatedNodes.push(
            createPodNode({
              id: `pod-zk-${i}`,
              name: 'zookeeper',
              nodeId: i,
              role: 'Metadata',
              parentId: 'podset-zk',
              position: {
                x: cumulativeX,
                y: PADDING.group.top,
              },
              pod,
              theme,
              width: dimensions.width,
              height: dimensions.height,
            })
          );

          cumulativeX += dimensions.width + LAYOUT.NODE_SPACING;
        }

        currentY += zkGroupHeight + LAYOUT.GROUP_SPACING;
      }

      // Kafka StrimziPodSet (below ZK)
      if (kafkaPodSet && zkBrokerDimensions) {
        // Use pre-calculated dimensions
        const { podDimensions: brokerPodDimensions, groupHeight: brokerGroupHeight } = zkBrokerDimensions;
        const brokerGroupX = (clusterWidth - maxPodSetWidth) / 2;

        generatedNodes.push({
          id: 'podset-kafka',
          type: 'group',
          position: { x: brokerGroupX, y: currentY },
          data: { label: '' },
          style: {
            width: maxPodSetWidth,
            height: brokerGroupHeight,
            backgroundColor: hexToRgba(theme.colors.nodeBackground, LAYOUT.GROUP_BG_OPACITY),
            border: `${LAYOUT.NAMESPACE_BORDER_WIDTH}px solid ${theme.colors.nodeBorder}`,
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          },
          parentId: 'cluster',
          extent: 'parent' as const,
        });

        // Calculate ready pods count for Kafka brokers
        let kafkaReadyPodsCount = 0;
        for (let i = 0; i < brokerCount; i++) {
          const podName = `${clusterName}-kafka-${i}`;
          const pod = pods.find(p => p.metadata?.name === podName);
          if (isPodReady(pod)) kafkaReadyPodsCount++;
        }

        generatedNodes.push(
          createGroupLabel({
            id: 'podset-kafka-label',
            title: kafkaPodSet.metadata.name,
            parentId: 'podset-kafka',
            theme,
            resourceType: 'StrimziPodSet',
            replicaInfo: `Ready Pods: ${kafkaReadyPodsCount}/${brokerCount}`,
          })
        );

        let cumulativeX = PADDING.group.left;
        for (let i = 0; i < brokerCount; i++) {
          const podName = `${clusterName}-kafka-${i}`;
          const pod = pods.find(p => p.metadata?.name === podName);
          const dimensions = brokerPodDimensions[i];

          generatedNodes.push(
            createPodNode({
              id: `pod-broker-${i}`,
              name: 'kafka',
              nodeId: i,
              role: 'Broker',
              parentId: 'podset-kafka',
              position: {
                x: cumulativeX,
                y: PADDING.group.top,
              },
              pod,
              theme,
              width: dimensions.width,
              height: dimensions.height,
            })
          );

          cumulativeX += dimensions.width + LAYOUT.NODE_SPACING;
        }
      }
    }

    setNodes(generatedNodes);
  }, [kafka, isKRaft, nodePools, podSets, pods, loading, clusterReady, colors, theme]);

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
        /* Hide ReactFlow default controls background */
        .react-flow__controls {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }

        /* Hide connection handles */
        .react-flow__handle {
          opacity: 0 !important;
        }

        /* ReactFlow attribution badge - theme aware */
        .react-flow__attribution {
          background: ${theme.colors.controlsBg} !important;
          color: ${theme.colors.controlsText} !important;
          border: 1px solid ${theme.colors.controlsBorder} !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          font-size: 10px !important;
          opacity: 0.8 !important;
        }

        .react-flow__attribution a {
          color: ${theme.colors.controlsText} !important;
          text-decoration: none !important;
        }

        .react-flow__attribution:hover {
          opacity: 1 !important;
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodesFocusable={false}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        minZoom={0.1}
        maxZoom={2.0}
        panOnScroll={true}
      >
        <Background color={theme.colors.gridColor} gap={LAYOUT.GRID_GAP} size={LAYOUT.GRID_SIZE} />
        <Controls showInteractive={false} showFitView={false} showZoom={false}>
          <GraphControls />
        </Controls>
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

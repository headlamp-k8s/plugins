// Fallback embedded graph renderer for detail pages.
//
// Headlamp exposes its own Map renderer to plugins as
// window.pluginLib.ResourceMap.GraphView since
// kubernetes-sigs/headlamp#6992 (closing #6556), shipped in Headlamp
// v0.45.0. On hosts 0.44.0 and older,
// EmbeddedGraphView falls back to this renderer: @xyflow/react — the
// same library the Map uses, taken from headlamp-plugin's own
// dependency tree, so it adds no runtime dependency — plus a small
// layered layout.
import '@xyflow/react/dist/style.css';
import { Icon } from '@iconify/react';
import { alpha, Box, Paper, Typography, useTheme } from '@mui/material';
import {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Handle,
  MarkerType,
  Node,
  NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import { useEffect, useMemo, useRef } from 'react';
import { computeLayout, EmbeddedGraph, EmbeddedGraphNode, getTopologyKey } from './graphData';

const FIT_VIEW_OPTIONS = { padding: 0.2, maxZoom: 1.2 };
// React Flow's default minZoom of 0.5 also bounds fitView: ten siblings
// at 110px row spacing already exceed the 440px viewport at that zoom.
const MIN_ZOOM = 0.1;

function statusColor(status: EmbeddedGraphNode['status'], theme: any): string {
  switch (status) {
    case 'success':
      return theme.palette.success.main;
    case 'error':
      return theme.palette.error.main;
    case 'warning':
      return theme.palette.warning.main;
    default:
      return theme.palette.divider;
  }
}

function KroNode(props: NodeProps) {
  const data = props.data as unknown as EmbeddedGraphNode;
  const theme = useTheme();
  const color = statusColor(data.status, theme);
  return (
    <Paper
      elevation={1}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        padding: '8px 12px',
        minWidth: 200,
        // Columns sit 280px apart (computeLayout); cap the card below that
        // so a long resource name can never reach into the next column.
        maxWidth: 240,
        border: `2px ${data.dashed ? 'dashed' : 'solid'} ${color}`,
        backgroundColor: data.status
          ? alpha(color, theme.palette.mode === 'dark' ? 0.15 : 0.07)
          : undefined,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Icon icon={data.icon} width="28px" height="28px" style={{ flexShrink: 0 }} />
      {/* minWidth 0 lets the text column shrink so noWrap can ellipsize;
          the title attribute keeps the full text reachable on hover. */}
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="body2"
          noWrap
          title={data.label}
          sx={{ fontWeight: 600, lineHeight: 1.2 }}
        >
          {data.label}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          title={data.subtitle}
          // caption renders as an inline span, where ellipsis has no effect
          sx={{ display: 'block' }}
        >
          {data.subtitle}
        </Typography>
      </Box>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </Paper>
  );
}

const nodeTypes = { kroNode: KroNode };

/** Lay the graph out and wrap its nodes for React Flow. */
function toFlowNodes(graph: EmbeddedGraph): Node[] {
  const positions = computeLayout(graph);
  return graph.nodes.map(node => ({
    id: node.id,
    type: 'kroNode',
    position: positions.get(node.id) ?? { x: 0, y: 0 },
    data: node as unknown as Record<string, unknown>,
    draggable: true,
  }));
}

function FallbackGraphCanvas(props: { graph: EmbeddedGraph }) {
  const { graph } = props;
  const theme = useTheme();

  // React Flow's `nodes` prop is controlled: a drag only moves a node
  // when its change handler feeds the new position back into state, so
  // nodes live in useNodesState. Callers memoize `graph`, and the layout
  // is recomputed (dropping manual positions) only when it changes.
  const laidOutNodes = useMemo(() => toFlowNodes(graph), [graph]);
  const [nodes, setNodes, onNodesChange] = useNodesState(laidOutNodes);

  // The fitView prop fits the first graph only. On a cold instance page
  // that graph holds just the instance until the sub-resource watches
  // resolve, so the viewport is refitted whenever the topology changes.
  // Health-only updates keep the same key and leave pan and zoom alone.
  const topologyKey = getTopologyKey(graph);
  const lastTopologyKey = useRef(topologyKey);
  const refitPending = useRef(false);
  useEffect(() => {
    const structural = lastTopologyKey.current !== topologyKey;
    if (structural) {
      lastTopologyKey.current = topologyKey;
      refitPending.current = true;
    }
    setNodes(previous => {
      const previousById = new Map(previous.map(node => [node.id, node]));
      return laidOutNodes.map(node => {
        const before = previousById.get(node.id);
        if (!before) {
          return node;
        }
        // A surviving node keeps its measured size, so only genuinely new
        // nodes count as not yet initialized below, and on a status-only
        // update it also keeps wherever the user dragged it: the computed
        // layout applies to structural changes alone.
        return {
          ...node,
          position: structural ? node.position : before.position,
          ...(before.measured ? { measured: before.measured } : {}),
        };
      });
    });
  }, [laidOutNodes, topologyKey, setNodes]);

  // Refit once every node has been measured, or at once when the change
  // only removed nodes.
  const { fitView } = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  useEffect(() => {
    if (refitPending.current && nodesInitialized) {
      refitPending.current = false;
      void fitView(FIT_VIEW_OPTIONS);
    }
  }, [nodes, nodesInitialized, fitView]);

  const edges: Edge[] = graph.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { strokeWidth: 1.5 },
    labelStyle: { fill: theme.palette.text.secondary, fontSize: 10 },
    labelBgStyle: { fill: 'transparent' },
  }));

  return (
    <>
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={FIT_VIEW_OPTIONS}
        minZoom={MIN_ZOOM}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        edgesFocusable={false}
        // The graph mirrors live resources: Backspace must not hide a node
        // that still exists.
        deleteKeyCode={null}
      >
        <Background variant={BackgroundVariant.Dots} color={theme.palette.divider} size={2} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </>
  );
}

export default function FallbackGraphView(props: { graph: EmbeddedGraph; height?: string }) {
  const { graph, height = '440px' } = props;
  const theme = useTheme();
  // The provider gives the canvas access to the viewport (useReactFlow)
  // and to node measurement state (useNodesInitialized).
  return (
    <Box sx={{ height, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
      <ReactFlowProvider>
        <FallbackGraphCanvas graph={graph} />
      </ReactFlowProvider>
    </Box>
  );
}

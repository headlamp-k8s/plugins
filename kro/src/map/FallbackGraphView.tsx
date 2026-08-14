// Fallback embedded graph renderer for detail pages.
//
// Headlamp exposes its own Map renderer to plugins as
// window.pluginLib.ResourceMap.GraphView since
// kubernetes-sigs/headlamp#6992 (closing #6556), but released hosts
// (Headlamp <= 0.44.0) predate that export. On those hosts,
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
} from '@xyflow/react';
import { computeLayout, EmbeddedGraph, EmbeddedGraphNode } from './graphData';

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
        border: `2px ${data.dashed ? 'dashed' : 'solid'} ${color}`,
        backgroundColor: data.status
          ? alpha(color, theme.palette.mode === 'dark' ? 0.15 : 0.07)
          : undefined,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Icon icon={data.icon} width="28px" height="28px" />
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
          {data.label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {data.subtitle}
        </Typography>
      </Box>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </Paper>
  );
}

const nodeTypes = { kroNode: KroNode };

export default function FallbackGraphView(props: { graph: EmbeddedGraph; height?: string }) {
  const { graph, height = '440px' } = props;
  const theme = useTheme();

  // No memoization: callers rebuild the graph per render (watch updates
  // mutate objects in place), and node/edge counts are tiny.
  const positions = computeLayout(graph);
  const nodes: Node[] = graph.nodes.map(node => ({
    id: node.id,
    type: 'kroNode',
    position: positions.get(node.id) ?? { x: 0, y: 0 },
    data: node as unknown as Record<string, unknown>,
    draggable: true,
  }));
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
    <Box sx={{ height, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        edgesFocusable={false}
      >
        <Background variant={BackgroundVariant.Dots} color={theme.palette.divider} size={2} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </Box>
  );
}

// The embedded-graph switch: Headlamp's native GraphView when the host
// exposes it through pluginLib.ResourceMap (kubernetes-sigs/headlamp#6992,
// shipped in Headlamp v0.45.0), the local fallback renderer otherwise.
//
// Native-path caveats, accepted for this alpha and documented in the
// README: the host merges every registered map source into the view
// (scoping comes from defaultNodeSelection — only the selected node's
// connected component is rendered), it writes ?node=/?group= to the
// page URL and resets the app-wide namespace filter on mount, and it
// renders the full Map chrome. Because the query params are shared,
// never mount two of these on one page.
import { Box } from '@mui/material';
import { useMemo } from 'react';
import FallbackGraphView from './FallbackGraphView';
import { EmbeddedGraph } from './graphData';
import { getNativeGraphView } from './nativeGraphView';
import { makeGraphSource, toGraphElements } from './toGraphSource';

export default function EmbeddedGraphView(props: {
  graph: EmbeddedGraph;
  /** Unique id of the embedded source, e.g. "kro-embedded-instance". */
  sourceId: string;
  /** Label shown by the native view's source picker. */
  sourceLabel: string;
  /** Node to select initially; scopes the native view to its component. */
  defaultNodeSelection?: string;
  height?: string;
}) {
  const { graph, sourceId, sourceLabel, defaultNodeSelection, height } = props;
  const NativeGraphView = getNativeGraphView();

  // The native host stores useData's return value in state and reloads
  // on identity change, so elements and source must only change when
  // the graph does. Callers keep the graph itself memoized.
  const elements = useMemo(() => toGraphElements(graph), [graph]);
  const defaultSources = useMemo(
    () => [makeGraphSource(sourceId, sourceLabel, elements)],
    [sourceId, sourceLabel, elements]
  );

  if (!NativeGraphView) {
    return <FallbackGraphView graph={graph} height={height} />;
  }

  // Fixed-height wrapper: the upstream export is lazy-loaded with a
  // null Suspense fallback, so without it the section would collapse
  // and jump while the Map chunk loads. Slightly taller than the
  // fallback to make room for the Map chrome row.
  const nativeHeight = height ?? '500px';
  return (
    <Box sx={{ height: nativeHeight }}>
      <NativeGraphView
        height={nativeHeight}
        defaultSources={defaultSources}
        defaultNodeSelection={defaultNodeSelection}
      />
    </Box>
  );
}

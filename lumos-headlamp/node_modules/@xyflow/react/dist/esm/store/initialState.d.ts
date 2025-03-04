import { NodeOrigin, CoordinateExtent } from '@xyflow/system';
import type { Edge, Node, ReactFlowStore } from '../types';
declare const getInitialState: ({ nodes, edges, defaultNodes, defaultEdges, width, height, fitView, nodeOrigin, nodeExtent, }?: {
    nodes?: Node[] | undefined;
    edges?: Edge[] | undefined;
    defaultNodes?: Node[] | undefined;
    defaultEdges?: Edge[] | undefined;
    width?: number | undefined;
    height?: number | undefined;
    fitView?: boolean | undefined;
    nodeOrigin?: NodeOrigin | undefined;
    nodeExtent?: CoordinateExtent | undefined;
}) => ReactFlowStore;
export default getInitialState;
//# sourceMappingURL=initialState.d.ts.map
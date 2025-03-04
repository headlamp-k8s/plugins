import { NodeOrigin, CoordinateExtent } from '@xyflow/system';
import type { ReactFlowState, Node, Edge } from '../types';
declare const createStore: ({ nodes, edges, defaultNodes, defaultEdges, width, height, fitView, nodeOrigin, nodeExtent, }: {
    nodes?: Node[] | undefined;
    edges?: Edge[] | undefined;
    defaultNodes?: Node[] | undefined;
    defaultEdges?: Edge[] | undefined;
    width?: number | undefined;
    height?: number | undefined;
    fitView?: boolean | undefined;
    nodeOrigin?: NodeOrigin | undefined;
    nodeExtent?: CoordinateExtent | undefined;
}) => import("zustand/traditional").UseBoundStoreWithEqualityFn<import("zustand").StoreApi<ReactFlowState>>;
export { createStore };
//# sourceMappingURL=index.d.ts.map
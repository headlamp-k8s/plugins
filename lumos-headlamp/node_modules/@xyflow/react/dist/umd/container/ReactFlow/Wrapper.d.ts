import { type ReactNode } from 'react';
import type { Node, Edge } from '../../types';
import { CoordinateExtent, NodeOrigin } from '@xyflow/system';
export declare function Wrapper({ children, nodes, edges, defaultNodes, defaultEdges, width, height, fitView, nodeOrigin, nodeExtent, }: {
    children: ReactNode;
    nodes?: Node[];
    edges?: Edge[];
    defaultNodes?: Node[];
    defaultEdges?: Edge[];
    width?: number;
    height?: number;
    fitView?: boolean;
    nodeOrigin?: NodeOrigin;
    nodeExtent?: CoordinateExtent;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Wrapper.d.ts.map
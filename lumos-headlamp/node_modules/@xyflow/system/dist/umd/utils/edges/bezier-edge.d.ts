import { Position } from '../../types';
export type GetBezierPathParams = {
    sourceX: number;
    sourceY: number;
    sourcePosition?: Position;
    targetX: number;
    targetY: number;
    targetPosition?: Position;
    curvature?: number;
};
export type GetControlWithCurvatureParams = {
    pos: Position;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    c: number;
};
export declare function getBezierEdgeCenter({ sourceX, sourceY, targetX, targetY, sourceControlX, sourceControlY, targetControlX, targetControlY, }: {
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourceControlX: number;
    sourceControlY: number;
    targetControlX: number;
    targetControlY: number;
}): [number, number, number, number];
/**
 * The `getBezierPath` util returns everything you need to render a bezier edge
 *between two nodes.
 * @public
 * @param params.sourceX - The x position of the source handle
 * @param params.sourceY - The y position of the source handle
 * @param params.sourcePosition - The position of the source handle (default: Position.Bottom)
 * @param params.targetX - The x position of the target handle
 * @param params.targetY - The y position of the target handle
 * @param params.targetPosition - The position of the target handle (default: Position.Top)
 * @param params.curvature - The curvature of the bezier edge
 * @returns A path string you can use in an SVG, the labelX and labelY position (center of path) and offsetX, offsetY between source handle and label
 * @example
 * ```js
 *  const source = { x: 0, y: 20 };
 *  const target = { x: 150, y: 100 };
 *
 *  const [path, labelX, labelY, offsetX, offsetY] = getBezierPath({
 *    sourceX: source.x,
 *    sourceY: source.y,
 *    sourcePosition: Position.Right,
 *    targetX: target.x,
 *    targetY: target.y,
 *    targetPosition: Position.Left,
 *});
 *```
 *
 * @remarks This function returns a tuple (aka a fixed-size array) to make it easier to
 *work with multiple edge paths at once.
 */
export declare function getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, curvature, }: GetBezierPathParams): [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number];
//# sourceMappingURL=bezier-edge.d.ts.map
import { Position } from '../../types';
export interface GetSmoothStepPathParams {
    sourceX: number;
    sourceY: number;
    sourcePosition?: Position;
    targetX: number;
    targetY: number;
    targetPosition?: Position;
    borderRadius?: number;
    centerX?: number;
    centerY?: number;
    offset?: number;
}
/**
 * The `getSmoothStepPath` util returns everything you need to render a stepped path
 *between two nodes. The `borderRadius` property can be used to choose how rounded
 *the corners of those steps are.
 * @public
 * @param params.sourceX - The x position of the source handle
 * @param params.sourceY - The y position of the source handle
 * @param params.sourcePosition - The position of the source handle (default: Position.Bottom)
 * @param params.targetX - The x position of the target handle
 * @param params.targetY - The y position of the target handle
 * @param params.targetPosition - The position of the target handle (default: Position.Top)
 * @returns A path string you can use in an SVG, the labelX and labelY position (center of path) and offsetX, offsetY between source handle and label
 * @example
 * ```js
 *  const source = { x: 0, y: 20 };
 *  const target = { x: 150, y: 100 };
 *
 *  const [path, labelX, labelY, offsetX, offsetY] = getSmoothStepPath({
 *    sourceX: source.x,
 *    sourceY: source.y,
 *    sourcePosition: Position.Right,
 *    targetX: target.x,
 *    targetY: target.y,
 *    targetPosition: Position.Left,
 *  });
 * ```
 * @remarks This function returns a tuple (aka a fixed-size array) to make it easier to work with multiple edge paths at once.
 */
export declare function getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius, centerX, centerY, offset, }: GetSmoothStepPathParams): [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number];
//# sourceMappingURL=smoothstep-edge.d.ts.map
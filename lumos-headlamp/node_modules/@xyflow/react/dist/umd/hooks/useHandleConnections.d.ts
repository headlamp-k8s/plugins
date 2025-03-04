import { Connection, HandleConnection, HandleType } from '@xyflow/system';
type useHandleConnectionsParams = {
    type: HandleType;
    id?: string | null;
    nodeId?: string;
    onConnect?: (connections: Connection[]) => void;
    onDisconnect?: (connections: Connection[]) => void;
};
/**
 * Hook to check if a <Handle /> is connected to another <Handle /> and get the connections.
 *
 * @public
 * @deprecated Use `useNodeConnections` instead.
 * @param param.type - handle type 'source' or 'target'
 * @param param.nodeId - node id - if not provided, the node id from the NodeIdContext is used
 * @param param.id - the handle id (this is only needed if the node has multiple handles of the same type)
 * @param param.onConnect - gets called when a connection is established
 * @param param.onDisconnect - gets called when a connection is removed
 * @returns an array with handle connections
 */
export declare function useHandleConnections({ type, id, nodeId, onConnect, onDisconnect, }: useHandleConnectionsParams): HandleConnection[];
export {};
//# sourceMappingURL=useHandleConnections.d.ts.map
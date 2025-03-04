import Plugin = require('./index');
import { InputNode, TransformNodeInfo, CallbackObject } from 'broccoli-node-api';
import { MapSeriesIterator } from './interfaces';
interface PluginWithDescription extends Plugin {
    description?: string;
}
export default class ReadCompat {
    pluginInterface: TransformNodeInfo;
    inputPaths: string[];
    inputBasePath: string;
    cachePath?: string;
    outputPath: string;
    private _priorBuildInputNodeOutputPaths;
    callbackObject: CallbackObject;
    constructor(plugin: PluginWithDescription);
    read(readTree: MapSeriesIterator<InputNode>): Promise<string>;
    cleanup(): void;
}
export {};

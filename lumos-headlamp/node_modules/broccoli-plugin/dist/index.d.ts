import { InputNode, TransformNode, TransformNodeInfo, FeatureSet, CallbackObject } from 'broccoli-node-api';
import { MapSeriesIterator, PluginOptions } from './interfaces';
import { FSOutput } from 'broccoli-output-wrapper';
import FSMerger = require('fs-merger');
declare class Plugin implements TransformNode {
    private _name;
    private _annotation?;
    private _baseConstructorCalled;
    private _inputNodes;
    private _persistentOutput;
    private _needsCache;
    private _volatile;
    private _trackInputChanges;
    private _instantiationError;
    private _readCompatError?;
    private _readCompat?;
    private rebuild?;
    __broccoliFeatures__: FeatureSet;
    builderFeatures: FeatureSet;
    /**
     * The path on disk to an auxiliary cache directory.
     * Use this to store files that you want preserved between builds.
     * This directory will only be deleted when Broccoli exits. If a cache directory
     * is not needed, set needsCache to false when calling broccoli-plugin constructor.
     */
    cachePath?: string;
    constructor(inputNodes: InputNode[], options?: PluginOptions);
    /**
     * An array of paths on disk corresponding to each node in inputNodes.
     * Your plugin will read files from these paths.
     */
    get inputPaths(): string[];
    /**
     * The path on disk corresponding to this plugin instance (this node).
     * Your plugin will write files to this path. This directory is emptied by Broccoli before each build, unless the persistentOutput options is true.
     */
    get outputPath(): string;
    get input(): FSMerger.FS;
    get output(): FSOutput;
    private _checkOverrides;
    __broccoliGetInfo__(builderFeatures?: FeatureSet): TransformNodeInfo;
    private _setup;
    toString(): string;
    /**
     * Return the object on which Broccoli will call obj.build(). Called once after instantiation.
     * By default, returns this. Plugins do not usually need to override this, but it can be useful
     * for base classes that other plugins in turn derive from, such as broccoli-caching-writer.
     *
     * @returns [[CallbackObject]]
     */
    getCallbackObject(): CallbackObject;
    /**
     * Override this method in your subclass. It will be called on each (re-)build.
     *
     * This function will typically access the following read-only properties:
     *  this.inputPaths: An array of paths on disk corresponding to each node in inputNodes. Your plugin will read files from these paths.
     *  this.outputPath: The path on disk corresponding to this plugin instance (this node). Your plugin will write files to this path. This directory is emptied by Broccoli before each build, unless the persistentOutput options is true.
     *  this.cachePath: The path on disk to an auxiliary cache directory. Use this to store files that you want preserved between builds. This directory will only be deleted when Broccoli exits. If a cache directory is not needed, set needsCache to false when calling broccoli-plugin constructor.
     *
     * All paths stay the same between builds.
     * To perform asynchronous work, return a promise. The promise's eventual value is ignored (typically null).
     * To report a compile error, throw it or return a rejected promise.
     *
     * To help with displaying clear error messages for build errors, error objects may have the following optional properties in addition to the standard message property:
     *  file: Path of the file in which the error occurred, relative to one of the inputPaths directories
     *  treeDir: The path that file is relative to. Must be an element of this.inputPaths. (The name treeDir is for historical reasons.)
     *  line: Line in which the error occurred (one-indexed)
     *  column: Column in which the error occurred (zero-indexed)
     */
    build(): Promise<void> | void;
    read(readTree: MapSeriesIterator<InputNode>): Promise<string> | undefined;
    cleanup(): Promise<void>;
    private _initializeReadCompat;
}
export = Plugin;

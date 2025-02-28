"use strict";
const read_compat_1 = require("./read_compat");
const buildOutputWrapper = require("broccoli-output-wrapper");
const FSMerger = require("fs-merger");
const BROCCOLI_FEATURES = Object.freeze({
    persistentOutputFlag: true,
    sourceDirectories: true,
    needsCacheFlag: true,
    volatileFlag: true,
    trackInputChangesFlag: true,
});
const PATHS = new WeakMap();
const FSFACADE = new WeakMap();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isPossibleNode(node) {
    if (node === null) {
        return false;
    }
    else if (typeof node === 'string') {
        return true;
    }
    else if (typeof node === 'object' && typeof node.__broccoliGetInfo__ === 'function') {
        // Broccoli 1.x+
        return true;
    }
    else if (typeof node === 'object' && typeof node.read === 'function') {
        // Broccoli / broccoli-builder <= 0.18
        return true;
    }
    else {
        return false;
    }
}
function _checkBuilderFeatures(builderFeatures) {
    if ((typeof builderFeatures !== 'object' && builderFeatures !== null) ||
        !builderFeatures.persistentOutputFlag ||
        !builderFeatures.sourceDirectories) {
        // No builder in the wild implements less than these.
        throw new Error('BroccoliPlugin: Minimum builderFeatures not met: { persistentOutputFlag: true, sourceDirectories: true }');
    }
}
class Plugin {
    constructor(inputNodes, options = {}) {
        // capture an instantiation error so that we can lazily access the stack to
        // let folks know where a plugin was instantiated from if there is a build
        // error
        this._instantiationError = new Error();
        if (options.name != null) {
            this._name = options.name;
        }
        else if (this.constructor && this.constructor.name != null) {
            this._name = this.constructor.name;
        }
        else {
            this._name = 'Plugin';
        }
        this._annotation = options.annotation;
        const label = this._name + (this._annotation != null ? ' (' + this._annotation + ')' : '');
        if (!Array.isArray(inputNodes))
            throw new TypeError(label + ': Expected an array of input nodes (input trees), got ' + inputNodes);
        for (let i = 0; i < inputNodes.length; i++) {
            if (!isPossibleNode(inputNodes[i])) {
                throw new TypeError(label + ': Expected Broccoli node, got ' + inputNodes[i] + ' for inputNodes[' + i + ']');
            }
        }
        this._baseConstructorCalled = true;
        this._inputNodes = inputNodes;
        this._persistentOutput = !!options.persistentOutput;
        this._needsCache = options.needsCache != null ? !!options.needsCache : true;
        this._volatile = !!options.volatile;
        this._trackInputChanges = !!options.trackInputChanges;
        this._checkOverrides();
        // For future extensibility, we version the API using feature flags
        this.__broccoliFeatures__ = BROCCOLI_FEATURES;
    }
    /**
     * An array of paths on disk corresponding to each node in inputNodes.
     * Your plugin will read files from these paths.
     */
    get inputPaths() {
        if (!PATHS.has(this)) {
            throw new Error('BroccoliPlugin: this.inputPaths is only accessible once the build has begun.');
        }
        return PATHS.get(this).inputPaths;
    }
    /**
     * The path on disk corresponding to this plugin instance (this node).
     * Your plugin will write files to this path. This directory is emptied by Broccoli before each build, unless the persistentOutput options is true.
     */
    get outputPath() {
        if (!PATHS.has(this)) {
            throw new Error('BroccoliPlugin: this.outputPath is only accessible once the build has begun.');
        }
        return PATHS.get(this).outputPath;
    }
    get input() {
        if (!FSFACADE.has(this)) {
            throw new Error('BroccoliPlugin: this.input is only accessible once the build has begun.');
        }
        return FSFACADE.get(this).input;
    }
    get output() {
        if (!FSFACADE.has(this)) {
            throw new Error('BroccoliPlugin: this.output is only accessible once the build has begun.');
        }
        return FSFACADE.get(this).output;
    }
    _checkOverrides() {
        if (typeof this.rebuild === 'function') {
            throw new Error('For compatibility, plugins must not define a plugin.rebuild() function');
        }
        if (this.read !== Plugin.prototype.read) {
            throw new Error('For compatibility, plugins must not define a plugin.read() function');
        }
        if (this.cleanup !== Plugin.prototype.cleanup) {
            throw new Error('For compatibility, plugins must not define a plugin.cleanup() function');
        }
    }
    // The Broccoli builder calls plugin.__broccoliGetInfo__
    __broccoliGetInfo__(builderFeatures = { persistentOutputFlag: true, sourceDirectories: true }) {
        _checkBuilderFeatures(builderFeatures);
        if (!this._baseConstructorCalled) {
            throw new Error('Plugin subclasses must call the superclass constructor: Plugin.call(this, inputNodes)');
        }
        const instantiationError = this._instantiationError;
        const nodeInfo = {
            nodeType: 'transform',
            inputNodes: this._inputNodes,
            setup: this._setup.bind(this),
            getCallbackObject: this.getCallbackObject.bind(this),
            get instantiationStack() {
                // Remember current call stack (minus "Error" line)
                const errorStack = '' + instantiationError.stack;
                return errorStack.replace(/[^\n]*\n/, '');
            },
            name: this._name,
            annotation: this._annotation,
            persistentOutput: this._persistentOutput,
            needsCache: this._needsCache,
            volatile: this._volatile,
            trackInputChanges: this._trackInputChanges,
        };
        // Go backwards in time, removing properties from nodeInfo if they are not
        // supported by the builder. Add new features at the top.
        if (!builderFeatures.needsCacheFlag) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete nodeInfo.needsCache;
        }
        if (!builderFeatures.volatileFlag) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete nodeInfo.volatile;
        }
        if (!builderFeatures.trackInputChangesFlag) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete nodeInfo.trackInputChanges;
        }
        return nodeInfo;
    }
    _setup(builderFeatures, options) {
        PATHS.set(this, {
            inputPaths: options.inputPaths,
            outputPath: options.outputPath,
        });
        if (!builderFeatures.needsCacheFlag) {
            this.cachePath = this._needsCache ? options.cachePath : undefined;
        }
        else {
            this.cachePath = options.cachePath;
        }
        FSFACADE.set(this, {
            input: new FSMerger(this._inputNodes).fs,
            output: buildOutputWrapper(this),
        });
    }
    toString() {
        return '[' + this._name + (this._annotation != null ? ': ' + this._annotation : '') + ']';
    }
    /**
     * Return the object on which Broccoli will call obj.build(). Called once after instantiation.
     * By default, returns this. Plugins do not usually need to override this, but it can be useful
     * for base classes that other plugins in turn derive from, such as broccoli-caching-writer.
     *
     * @returns [[CallbackObject]]
     */
    getCallbackObject() {
        return this;
    }
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
    build() {
        throw new Error('Plugin subclasses must implement a .build() function');
    }
    // Compatibility code so plugins can run on old, .read-based Broccoli:
    read(readTree) {
        if (this._readCompat == null) {
            try {
                this._initializeReadCompat(); // call this.__broccoliGetInfo__()
            }
            catch (err) {
                // Prevent trying to initialize again on next .read
                this._readCompat = false;
                // Remember error so we can throw it on all subsequent .read calls
                this._readCompatError = err;
            }
        }
        if (this._readCompatError != null)
            throw this._readCompatError;
        if (this._readCompat) {
            return this._readCompat.read(readTree);
        }
    }
    async cleanup() {
        if (this._readCompat)
            return this._readCompat.cleanup();
    }
    _initializeReadCompat() {
        this._readCompat = new read_compat_1.default(this);
    }
}
module.exports = Plugin;
//# sourceMappingURL=index.js.map
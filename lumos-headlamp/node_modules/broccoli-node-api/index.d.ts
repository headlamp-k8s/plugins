/**
  Every API version is represented by a set of feature flags. We use feature
  flags instead of plain numbers to allow parallel development of new features
  on branches. Feature flags cannot be combined independently, however, so it's
  best to think of a given set of feature flags as simply a more-descriptive
  version number.

  https://github.com/broccolijs/broccoli/blob/master/docs/node-api.md#part-2-node-api-specification
 */
export interface FeatureSet {
  persistentOutputFlag?: boolean;
  sourceDirectories?: boolean;
  needsCacheFlag?: boolean;
  [feature: string]: boolean | undefined;
}

export type Node = NodeMap[NodeType];

export interface TransformNode extends NodeCommon<TransformNodeInfo> {}
export interface SourceNode extends NodeCommon<SourceNodeInfo> {}

export interface NodeMap {
  transform: TransformNode;
  source: SourceNode;
}

export interface BuildChangeObject {
  changedNodes: boolean[];
}

/**
  The Broccoli Node API

  https://github.com/broccolijs/broccoli/blob/master/docs/node-api.md#part-2-node-api-specification
 */
export interface NodeCommon<T extends NodeInfo> {
  /**
    The node's feature set, indicating the API version
   */
  __broccoliFeatures__: FeatureSet;

  /**
    A function to be called by the Builder, taking the Builder's feature set as
    an argument and returning a `NodeInfo` object
   */
  __broccoliGetInfo__: (builderFeatures: FeatureSet) => T;
}

/**
  Either a `'transform'` or `'source'` `NodeInfo` object.
  https://github.com/broccolijs/broccoli/blob/master/docs/node-api.md#the-nodeinfo-object
 */
export type NodeInfo = NodeInfoMap[NodeType];

export interface NodeInfoMap {
  source: SourceNodeInfo;
  transform: TransformNodeInfo;
}

/**
  Either `'transform'` or `'source'`, indicating the node type.
  */
export type NodeType = keyof NodeInfoMap;

/**
  [Transform Nodes](https://github.com/broccolijs/broccoli/blob/master/docs/node-api.md#transform-nodes)

  Nodes with `nodeType: "transform"` are used to transform a set of zero or more
  input directories (often exactly one) into an output directory, for example by
  a compiler. They are typically instances of a
  [broccoli-plugin](https://github.com/broccolijs/broccoli-plugin) subclass.
 */
export interface TransformNodeInfo extends NodeInfoCommon<"transform"> {
  /**
    Zero or more Broccoli nodes to be used as input to this node.
   */
  inputNodes: InputNode[];

  /**
    The `Builder` will call this function once before the first build. This
    function will not be called more than once throughout the lifetime of the
    node.

    @param features builder features
    @param options.inputPaths An array of paths corresponding to `NodeInfo.inputNodes`. When building,
                      the node may read from these paths, but must never write to them.
    @param options.outputPath A path to an empty directory for the node to write its output to when
                      building.
    @param options.cachePath A path to an empty directory for the node to store files it wants to
                     keep around between builds. This directory will only be deleted when the
                     Broccoli process terminates (for example, when the Broccoli server is
                     restarted).

                     If a `cachePath` is not needed/desired, a plugin can opt-out of its creation
                     via the `needsCache` flag metioned below.
   */
  setup(
    features: FeatureSet,
    options: { inputPaths: string[]; outputPath: string; cachePath?: string }
  ): void;

  /**
    The Builder will call this function once after it has called `setup`. This
    function will not be called more than once throughout the lifetime of the
    node. The object returned must have a `build` property, which is the
    function that the builder will call on each rebuild:

    ```js
    var callbackObject = nodeInfo.getCallbackObject()
    // For each rebuild:
    callbackObject.build() // => promise
    ```

    Properties other than `.build` will be ignored.

    The `build` function is responsible for performing the node's main work. It
    may throw an exception, which will be reported as a build error by Broccoli.
    If the `build` function performs asynchronous work, it must return a promise
    that is resolved on completion of the asynchronous work, or rejected if
    there is an error. Return values other than promises are ignored.
   */
  getCallbackObject(): CallbackObject;

  /**
    If false, then between rebuilds, the Builder will delete the outputPath
    directory recursively and recreate it as an empty directory. If true,
    the Builder will do nothing.
   */
  persistentOutput: boolean;

  /**
    If false, a cache directory will not be created. If true, a cache directory
    will be created and its path will be available as this.cachePath.
   */
  needsCache: boolean;
  
  /**
   If true, memoization will not be applied and the build method will always be 
   called regardless if the inputNodes have changed. Defaults to false.
  */
  volatile: boolean;
  
 /**
   If true, a change object will be passed to the build method which contains
   information about which input has changed since the last build. Defaults to false.
  */
  trackInputChanges: boolean;
}

/**
  Nodes with nodeType: "source" describe source directories on disk.
  They are typically instances of a broccoli-source class.

  https://github.com/broccolijs/broccoli/blob/master/docs/node-api.md#source-nodes
 */
export interface SourceNodeInfo extends NodeInfoCommon<"source"> {
  /**
    A path to an existing directory on disk, relative to the current working directory.
   */
  sourceDirectory: string;

  /**
    If false, changed files in the sourceDirectory will not trigger rebuilds
    (though they might still be picked up by subsequent rebuilds). If true,
    instructs the Broccoli file system watcher to watch the sourceDirectory
    recursively and trigger a rebuild whenever a file changes.
   */
  watched: boolean;
}

/**
  The interface common to all `NodeInfo` objects.

  https://github.com/broccolijs/broccoli/blob/master/docs/node-api.md#the-nodeinfo-object
 */
export interface NodeInfoCommon<T extends NodeType> {
  /**
    Either `'transform'` or `'source'`, indicating the node type.
   */
  nodeType: T;

  /**
    The name of the plugin that this node is an instance of. Example:
    `'BroccoliMergeTrees'`
   */
  name: string;

  /**
    A description of this particular node. Useful to tell multiple instances of
    the same plugin apart during debugging. Example: `'vendor directories'`
   */
  annotation: string | null | undefined;

  /**
    A stack trace generated when the node constructor ran. Useful for telling
    where a given node was instantiated during debugging. This is `(new
    Error).stack` without the first line.
   */
  instantiationStack: string;
}

/**
  The `build` function is responsible for performing the node's main work.

  BuildChangeObject is only passed if trackInputChanges is true.
 */
export interface CallbackObject {
  build(buildChangeObject?: BuildChangeObject): Promise<void> | void;
}

export type InputNode = Node | string;

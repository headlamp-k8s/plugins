# `broccoli-node-api`

TypeScript types for the [Broccoli Node Api](https://github.com/broccolijs/broccoli/blob/master/docs/node-api.md)

- [`broccoli-node-api`](#broccoli-node-api)
  - [Exports](#exports)
    - [Node](#node)
    - [InputNode](#inputnode)
    - [NodeCommon](#nodecommon)
    - [NodeMap](#nodemap)
    - [TransformNode](#transformnode)
    - [SourceNode](#sourcenode)
    - [FeatureSet](#featureset)
    - [NodeInfo](#nodeinfo)
    - [NodeType](#nodetype)
    - [NodeInfoMap](#nodeinfomap)
    - [NodeInfoCommon](#nodeinfocommon)
    - [TransformNodeInfo](#transformnodeinfo)
    - [CallbackObject](#callbackobject)
    - [SourceNodeInfo](#sourcenodeinfo)

## Exports

### Node

```ts
type Node = TransformNode | SourceNode;
```

[Node Documentation](https://github.com/broccolijs/broccoli/blob/master/docs/node-api.md#part-2-node-api-specification)

---

### InputNode

```ts
type InputNode = Node | string;
```

---

### NodeCommon

```ts
interface NodeCommon<T extends NodeInfo> {
  __broccoliFeatures__: FeatureSet;
  __broccoliGetInfo__: (builderFeatures: FeatureSet) => T;
}
```

---

### NodeMap

```ts
interface NodeMap = {
  transform: TransformNode;
  source: SourceNode;
};
```

---

### TransformNode

```ts
interface TransformNode extends NodeCommon<TransformNodeInfo> {}
```

---

### SourceNode

```ts
interface SourceNode extends NodeCommon<SourceNodeInfo> {}
```

---

### FeatureSet

```ts
interface FeatureSet {
  [feature: string]: boolean;
}
```

---

### NodeInfo

```ts
type NodeInfo = TransformNodeInfo | SourceNodeInfo;
```

[NodeInfo Documentation](https://github.com/broccolijs/broccoli/blob/master/docs/node-api.md#the-nodeinfo-object)

---

### NodeType

```ts
type NodeType = "transform" | "source";
```

---

### NodeInfoMap

```ts
interface NodeInfoMap = {
  transform: TransformNodeInfo;
  source: SourceNodeInfo;
};
```

---

### NodeInfoCommon

```ts
interface NodeInfoCommon<T extends NodeType> {
  nodeType: T;
  name: string;
  annotation: string | null | undefined;
  instantiationStack: string;
}
```

---

### TransformNodeInfo

```ts
interface TransformNodeInfo extends NodeInfoCommon<"transform"> {
  inputNodes: Node[];
  setup(
    features: FeatureSet,
    options: { inputPaths: string[]; outputPath: string; cachePath: string }
  ): void;
  getCallbackObject(): CallbackObject;
  persistentOutput: boolean;
  needsCache: boolean;
  volatile: boolean;
  trackInputChanges: boolean;
}
```

[TransformNodeInfo Documentation](https://github.com/broccolijs/broccoli/blob/master/docs/node-api.md#transform-nodes)

---

### CallbackObject

```ts
interface CallbackObject {
  build(buildChangeObject?: BuildChangeObject): Promise<void> | void;
}
```

---

### BuildChangeObject

```ts
interface BuildChangeObject {
  changedNodes: boolean[];
}
```

---

### SourceNodeInfo

```ts
interface SourceNodeInfo extends NodeInfoCommon<"source"> {
  sourceDirectory: string;
  watched: boolean;
}
```

[SourceNodeInfo Documentation](https://github.com/broccolijs/broccoli/blob/master/docs/node-api.md#source-nodes)

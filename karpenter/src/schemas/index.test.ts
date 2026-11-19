import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';
import { KARPENTER_SCHEMAS } from './index';

/** Compiles the NodePool schema the same way the Config Editor does. */
function compileNodePoolSchema() {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  return ajv.compile(KARPENTER_SCHEMAS['Nodepool-schema']);
}

const validateNodePool = compileNodePoolSchema();

/** Returns the instance paths that failed validation, or [] when the document is valid. */
function errorPaths(doc: unknown) {
  return validateNodePool(doc)
    ? []
    : [...new Set(validateNodePool.errors!.map(e => e.instancePath))];
}

/** A minimal NodePool with the given disruption and limits fields. */
function nodePool({ disruption = {}, limits }: { disruption?: object; limits?: object } = {}) {
  return {
    apiVersion: 'karpenter.sh/v1',
    kind: 'NodePool',
    metadata: { name: 'default' },
    spec: {
      template: {
        spec: {
          nodeClassRef: { group: 'karpenter.k8s.aws', kind: 'EC2NodeClass', name: 'default' },
          requirements: [{ key: 'karpenter.sh/capacity-type', operator: 'In', values: ['spot'] }],
        },
      },
      disruption: { consolidationPolicy: 'WhenEmptyOrUnderutilized', ...disruption },
      ...(limits ? { limits } : {}),
    },
  };
}

/** The limits and disruption settings from the NodePool reference in the Karpenter docs. */
const docsNodePoolYaml = `
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: default
spec:
  template:
    spec:
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: default
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot", "on-demand"]
      expireAfter: 720h
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: Never
    budgets:
      - nodes: 10%
      - schedule: "0 9 * * mon-fri"
        duration: 8h
        nodes: "0"
  limits:
    cpu: "1000"
    memory: 1000Gi
`;

describe('Nodepool-schema', () => {
  it('accepts the NodePool from the Karpenter docs as the editor parses it', () => {
    expect(errorPaths(yaml.load(docsNodePoolYaml))).toEqual([]);
  });

  describe('spec.disruption.consolidateAfter', () => {
    it.each(['0s', '30s', '1m', '1h30m', 'Never'])('accepts %s', consolidateAfter => {
      expect(errorPaths(nodePool({ disruption: { consolidateAfter } }))).toEqual([]);
    });

    it.each(['1d', 'never', '5 minutes', ''])('rejects %j', consolidateAfter => {
      expect(errorPaths(nodePool({ disruption: { consolidateAfter } }))).toEqual([
        '/spec/disruption/consolidateAfter',
      ]);
    });
  });

  describe('spec.limits', () => {
    it.each([
      { cpu: 1000 },
      { cpu: '1000' },
      { cpu: '500m' },
      { cpu: '1.5' },
      { memory: '1000Gi' },
      { memory: '1Ti' },
      { memory: '1000G' },
      { memory: '1.5Ti' },
      { memory: '1e9' },
      { nodes: 10 },
      { 'nvidia.com/gpu': '2' },
    ])('accepts %j', limits => {
      expect(errorPaths(nodePool({ limits }))).toEqual([]);
    });

    it.each([
      // The CRD accepts integers and quantity strings, so a fractional number is rejected by the API server.
      [{ cpu: 1.5 }, '/spec/limits/cpu'],
      [{ cpu: 'lots' }, '/spec/limits/cpu'],
      [{ memory: '1GB' }, '/spec/limits/memory'],
      [{ memory: '1 Gi' }, '/spec/limits/memory'],
      [{ 'nvidia.com/gpu': true }, '/spec/limits/nvidia.com~1gpu'],
    ])('rejects %j', (limits, path) => {
      expect(errorPaths(nodePool({ limits }))).toEqual([path]);
    });
  });
});

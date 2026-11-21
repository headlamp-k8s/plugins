import { describe, expect, it, vi } from 'vitest';
import { NodeReadinessEvaluation } from './nodeReadinessEvaluation';

vi.mock('@kinvolk/headlamp-plugin/lib/lib/k8s/crd', () => ({
  makeCustomResourceClass: vi.fn().mockImplementation(() => {
    return class MockCRD {
      jsonData: any;
      metadata: any;
      constructor(jsonData: any) {
        this.jsonData = jsonData;
        this.metadata = jsonData?.metadata;
      }
    };
  }),
}));

describe('NodeReadinessEvaluation resource class', () => {
  it('exposes correct detailsRoute', () => {
    expect(NodeReadinessEvaluation.detailsRoute).toBe('nrc-evaluation-details');
  });

  it('correctly reads nodeName from spec.nodeName or metadata.name', () => {
    const evalWithSpec = new NodeReadinessEvaluation({
      metadata: { name: 'worker-01' },
      spec: { nodeName: 'custom-node-01' },
    });
    expect(evalWithSpec.nodeName).toBe('custom-node-01');

    const evalWithMetaOnly = new NodeReadinessEvaluation({
      metadata: { name: 'worker-02' },
      spec: { nodeName: '' },
    });
    expect(evalWithMetaOnly.nodeName).toBe('worker-02');
  });

  it('exposes status, state, and rules getters with safe defaults', () => {
    const rawData = {
      metadata: { name: 'worker-01' },
      spec: { nodeName: 'worker-01' },
      status: {
        state: 'Available' as const,
        rules: [
          {
            ruleName: '01-healthy-rule',
            ruleStatus: 'Satisfied' as const,
            taintStatus: 'Absent' as const,
          },
        ],
      },
    };

    const evalInstance = new NodeReadinessEvaluation(rawData);
    expect(evalInstance.spec).toEqual(rawData.spec);
    expect(evalInstance.status).toEqual(rawData.status);
    expect(evalInstance.state).toBe('Available');
    expect(evalInstance.rules).toHaveLength(1);
    expect(evalInstance.rules[0].ruleName).toBe('01-healthy-rule');
  });

  it('handles empty status gracefully', () => {
    const emptyEval = new NodeReadinessEvaluation({
      metadata: { name: 'worker-empty' },
      spec: { nodeName: 'worker-empty' },
    });

    expect(emptyEval.status).toBeUndefined();
    expect(emptyEval.state).toBeUndefined();
    expect(emptyEval.rules).toEqual([]);
  });
});

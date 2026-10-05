import {
  getTinkerbellController,
  getTinkerbellQueries,
  TinkerbellController,
} from './tinkerbellQueries';

describe('getTinkerbellController', () => {
  it.each([
    ['Workflow', 'tinkerbell.org/v1alpha1', 'workflow'],
    ['Machine', 'bmc.tinkerbell.org/v1alpha1', 'machine'],
    ['Job', 'bmc.tinkerbell.org/v1alpha1', 'job'],
    ['Task', 'bmc.tinkerbell.org/v1alpha1', 'task'],
    ['Job', 'batch/v1', undefined],
    ['Machine', 'cluster.x-k8s.io/v1beta1', undefined],
    ['Workflow', 'argoproj.io/v1alpha1', undefined],
    ['Task', 'tekton.dev/v1', undefined],
    ['Hardware', 'tinkerbell.org/v1alpha1', undefined],
    ['Template', 'tinkerbell.org/v1alpha1', undefined],
    ['WorkflowRuleSet', 'tinkerbell.org/v1alpha1', undefined],
    ['Workflow', 'tinkerbell.org.example/v1alpha1', undefined],
    ['Workflow', undefined, undefined],
  ])('maps %s in %s to %s', (kind, apiVersion, expected) => {
    expect(getTinkerbellController({ kind, apiVersion })).toBe(expected);
    expect(getTinkerbellController({ jsonData: { kind, apiVersion } })).toBe(expected);
  });

  it('prefers original API identity and handles missing resources', () => {
    expect(
      getTinkerbellController({
        kind: 'Job',
        apiVersion: 'batch/v1',
        jsonData: { kind: 'Job', apiVersion: 'bmc.tinkerbell.org/v1alpha1' },
      })
    ).toBe('job');
    expect(getTinkerbellController()).toBeUndefined();
  });
});

describe('getTinkerbellQueries', () => {
  it.each<TinkerbellController>(['workflow', 'machine', 'job', 'task'])(
    'scopes all %s queries and aggregates replicas',
    controller => {
      const queries = getTinkerbellQueries(controller, 'lab-tinkerbell');
      for (const query of Object.values(queries)) {
        expect(query).toContain(`job="lab-tinkerbell",controller="${controller}"`);
        expect(query).toContain('sum');
        expect(query).not.toContain('vector(0)');
        expect(query).not.toContain('namespace=');
      }
      expect(queries.reconciliations).toBe(
        `sum(rate(controller_runtime_reconcile_total{job="lab-tinkerbell",controller="${controller}"}[5m]))`
      );
      expect(queries.errors).toContain('controller_runtime_reconcile_errors_total');
      expect(queries.errors).not.toContain('requeue');
      expect(queries.queue).toContain(`name="${controller}"`);
      expect(queries.durationP95).toContain('histogram_quantile(0.95, sum by (le) (rate(');
      expect(queries.durationP50).toContain('histogram_quantile(0.5,');
    }
  );

  it('escapes label values without treating them as regular expressions', () => {
    const queries = getTinkerbellQueries('workflow', 'lab\\"\n.*');
    expect(queries.queue).toContain('job="lab\\\\\\"\\n.*"');
    expect(queries.queue).not.toContain('=~');
  });
});

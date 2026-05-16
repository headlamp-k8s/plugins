import {
  capiClientCacheWaitDurationQuery,
  capiClusterCacheHealthcheckRateQuery,
  capiReconcileDurationQuery,
  capiReconcileErrorRateQuery,
  capiReconcileRateQuery,
  capiSsaCacheHitsRateQuery,
  capiWebhookRateQuery,
} from '../capiChart/capiQueries';

describe('CAPI PromQL query helpers', () => {
  test('capiReconcileRateQuery uses top-level or between aggregates', () => {
    const query = capiReconcileRateQuery('machinedeployment', 'success');
    expect(query).toContain('sum(rate(capi_reconcile_total');
    expect(query).toContain(' or sum(rate(controller_runtime_reconcile_total');
    expect(query).toContain('or vector(0)');
    expect(query).toContain('controller="machinedeployment"');
    expect(query).toContain('result="success"');
    expect(query).not.toMatch(/rate\(capi_reconcile_total[^)]+\) or rate\(/);
  });

  test('capiReconcileErrorRateQuery keeps matchers inside the selector braces', () => {
    const query = capiReconcileErrorRateQuery('cluster');
    expect(query).toContain('result!="success"}[5m]');
    expect(query).not.toContain('},result!=');
    expect(query).toContain('controller_runtime_reconcile_errors_total');
  });

  test('capiWebhookRateQuery keeps code matcher inside the selector braces', () => {
    const query = capiWebhookRateQuery('MachineDeployment', true);
    expect(query).toContain('webhook=~".*v1beta2-machinedeployment$"');
    expect(query).toContain('code=~"2.."}[5m]');
    expect(query).not.toContain('},code=');
  });

  test('capiSsaCacheHitsRateQuery filters by controller', () => {
    const query = capiSsaCacheHitsRateQuery('machinedeployment');
    expect(query).toContain('capi_ssa_cache_hits_total');
    expect(query).toContain('controller="machinedeployment"');
    expect(query).toContain('or vector(0)');
  });

  test('capiClusterCacheHealthcheckRateQuery filters by cluster', () => {
    const query = capiClusterCacheHealthcheckRateQuery('my-cluster', 'default', true);
    expect(query).toContain('increase(capi_cluster_cache_healthchecks_total');
    expect(query).toContain('cluster_name="my-cluster"');
    expect(query).toContain('cluster_namespace="default"');
    expect(query).toContain('status="success"');
    expect(query).toContain('/ 1800');
    expect(query).toContain('or vector(0)');
  });

  test('capiClientCacheWaitDurationQuery computes average wait time', () => {
    const query = capiClientCacheWaitDurationQuery();
    expect(query).toContain('capi_client_cache_wait_duration_seconds_sum');
    expect(query).toContain('capi_client_cache_wait_duration_seconds_count');
  });

  test('capiReconcileDurationQuery uses histogram_quantile or pattern', () => {
    const query = capiReconcileDurationQuery('machine', 0.5);
    expect(query).toContain('histogram_quantile(0.50');
    expect(query).toContain(' or histogram_quantile(0.50');
    expect(query).toContain('or vector(0)');
  });
});

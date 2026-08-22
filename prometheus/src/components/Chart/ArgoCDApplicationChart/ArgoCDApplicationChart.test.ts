import { getArgoCDApplicationChartConfigs } from './ArgoCDApplicationChart';

describe('Argo CD Application chart configuration', () => {
  test('creates the three Application-specific charts', () => {
    const configs = getArgoCDApplicationChartConfigs('argocd', 'guestbook');

    expect(configs.map(config => config.key)).toEqual([
      'sync-activity',
      'sync-duration',
      'orphaned-resources',
    ]);
    expect(configs[0].queries.query).toContain('argocd_app_sync_total');
    expect(configs[1].queries.query).toContain('argocd_app_sync_duration_seconds_sum');
    expect(configs[2].queries.query).toContain('argocd_app_orphaned_resources_count');
  });

  test('escapes Application labels before embedding them in PromQL', () => {
    const configs = getArgoCDApplicationChartConfigs('team"one', 'app\\name');

    expect(configs[0].queries.query).toContain('namespace="team\\"one"');
    expect(configs[0].queries.query).toContain('name="app\\\\name"');
  });
});

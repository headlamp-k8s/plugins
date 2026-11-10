import { getKueueClusterQueueChartConfigs } from './KueueClusterQueueChart';

describe('Kueue ClusterQueue chart configuration', () => {
  const resourceGroups = [
    {
      flavors: [
        { name: 'default-flavor', resources: [{ name: 'cpu' }, { name: 'memory' }] },
        { name: 'gpu-flavor', resources: [{ name: 'nvidia.com/gpu' }] },
      ],
    },
  ];

  test('creates the workloads, quota usage and admission wait charts', () => {
    const configs = getKueueClusterQueueChartConfigs('team-a', resourceGroups);

    expect(configs.map(config => config.key)).toEqual([
      'workloads',
      'quota-usage',
      'admission-wait',
    ]);
    expect(configs[0].queries.plots.map(plot => plot.query)).toEqual([
      expect.stringContaining('kueue_pending_workloads{'),
      expect.stringContaining('kueue_pending_workloads{'),
      expect.stringContaining('kueue_admitted_active_workloads{'),
    ]);
    expect(configs[0].queries.plots[0].query).toContain('status="active"');
    expect(configs[0].queries.plots[1].query).toContain('status="inadmissible"');
    expect(configs[2].queries.plots[1].query).toContain(
      'histogram_quantile(0.95, sum by (le) (rate(kueue_admission_wait_time_seconds_bucket{'
    );
  });

  test('draws one quota line per flavor and resource in the spec', () => {
    const quotaPlots = getKueueClusterQueueChartConfigs('team-a', resourceGroups)[1].queries.plots;

    expect(quotaPlots.map(plot => plot.name)).toEqual([
      'default-flavor cpu',
      'default-flavor memory',
      'gpu-flavor nvidia.com/gpu',
    ]);
    expect(quotaPlots[2].query).toContain('flavor="gpu-flavor",resource="nvidia.com/gpu"');
    expect(quotaPlots[2].query).toContain('kueue_cluster_queue_resource_usage{');
    expect(quotaPlots[2].query).toContain('kueue_cluster_queue_nominal_quota{');
  });

  test('skips follower replicas so HA installs are not counted twice', () => {
    for (const config of getKueueClusterQueueChartConfigs('team-a', resourceGroups)) {
      for (const plot of config.queries.plots) {
        expect(plot.query).toContain('cluster_queue="team-a",replica_role!="follower"');
      }
    }
  });

  test('leaves out the quota chart when the spec has no resource groups', () => {
    const configs = getKueueClusterQueueChartConfigs('team-a');

    expect(configs.map(config => config.key)).toEqual(['workloads', 'admission-wait']);
  });

  test('escapes labels before embedding them in PromQL', () => {
    const configs = getKueueClusterQueueChartConfigs('queue"one', [
      { flavors: [{ name: 'flavor\\x', resources: [{ name: 'cpu' }] }] },
    ]);

    expect(configs[0].queries.plots[0].query).toContain('cluster_queue="queue\\"one"');
    expect(configs[1].queries.plots[0].query).toContain('flavor="flavor\\\\x"');
  });
});

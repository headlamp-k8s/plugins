const registered = vi.hoisted(() => ({
  sectionsProcessor: undefined as undefined | ((resource: any, sections: any[]) => any[]),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', async importOriginal => ({
  ...(await importOriginal<typeof import('@kinvolk/headlamp-plugin/lib')>()),
  registerPluginSettings: vi.fn(),
  registerDetailsViewHeaderActionsProcessor: vi.fn(),
  registerDetailsViewSectionsProcessor: (processor: (resource: any, sections: any[]) => any[]) => {
    registered.sectionsProcessor = processor;
  },
}));

// Stub the chart components: the section processor only needs to build the elements.
vi.mock('./components/Chart/KarpenterChart/KarpenterChart', () => ({ KarpenterChart: () => null }));
vi.mock('./components/Chart/ArgoCDApplicationChart/ArgoCDApplicationChart', () => ({
  getArgoCDApplicationChartConfigs: () => [],
}));
vi.mock('./components/Chart/CapiChart/CapiChart', () => ({ CapiChart: () => null }));
vi.mock('./components/Chart/DiskMetricsChart/DiskMetricsChart', () => ({
  DiskMetricsChart: () => null,
}));
vi.mock('./components/Chart/GenericMetricsChart/GenericMetricsChart', () => ({
  GenericMetricsChart: () => null,
}));
vi.mock('./components/Chart/KedaChart/KedaChart', () => ({ KedaChart: () => null }));
vi.mock('./components/Chart/KnativeChart/KnativeChart', () => ({ KnativeChart: () => null }));
vi.mock('./components/Chart/KueueClusterQueueChart/KueueClusterQueueChart', () => ({
  getKueueClusterQueueChartConfigs: () => [],
}));
vi.mock('./components/Chart/StrimziChart/StrimziChart', () => ({
  getKafkaChartConfigs: () => [],
  StrimziChart: () => null,
}));
vi.mock('./components/Chart/TinkerbellChart/TinkerbellChart', () => ({
  TinkerbellChart: () => null,
}));
vi.mock('./components/Chart/VolcanoChart/VolcanoChart', () => ({
  getVolcanoQueueChartConfigs: () => [],
  VolcanoChart: () => null,
}));
vi.mock('./components/Chart/KarpenterDisruptionChart/KarpenterDisruptionChart', () => ({
  KarpenterDisruptionChart: () => null,
}));
vi.mock(
  './components/Chart/KarpenterNodeClaimCreationChart/KarpenterNodeClaimCreationChart',
  () => ({ NodeClaimCreationChart: () => null })
);
vi.mock(
  './components/Chart/KarpenterNodeClaimProvisionChart/KarpenterNodeClaimProvisionChart',
  () => ({ KarpenterNodeClaimsProvisionChart: () => null })
);
vi.mock('./components/Chart/KarpenterNodePoolResourceChart/KarpenterNodePoolResourceChart', () => ({
  KarpenterNodePoolResourceChart: () => null,
}));
vi.mock('./components/Chart/KarpenterPendingPods/KarpenterPendingPods', () => ({
  KarpenterPendingPods: () => null,
}));
vi.mock('./components/Settings/Settings', () => ({ Settings: () => null }));
vi.mock('./components/VisibilityButton/VisibilityButton', () => ({
  VisibilityButton: () => null,
}));

// Registers the processors through the mocks above.
import './index';

function scaledObject(jsonData: Record<string, any>) {
  return {
    kind: 'ScaledObject',
    jsonData: {
      apiVersion: 'keda.sh/v1alpha1',
      kind: 'ScaledObject',
      metadata: { name: 'checkout', namespace: 'default' },
      spec: { scaleTargetRef: { name: 'checkout' }, minReplicaCount: 1, maxReplicaCount: 5 },
      ...jsonData,
    },
  };
}

function getMetricsSection(resource: any) {
  const sections = registered.sectionsProcessor!(resource, [{ id: 'MAIN_HEADER' }]);
  return sections.find(section => section.id === 'prom_metrics');
}

describe('ScaledObject metrics section', () => {
  test('is added when the ScaledObject has no status yet', () => {
    const section = getMetricsSection(scaledObject({}));

    expect(section).toBeDefined();
    expect(section.section.props.hpaReplicasQuery).toContain(
      "horizontalpodautoscaler='keda-hpa-checkout'"
    );
  });

  test('uses status.hpaName once KEDA has set it', () => {
    const section = getMetricsSection(scaledObject({ status: { hpaName: 'checkout-hpa' } }));

    expect(section.section.props.hpaReplicasQuery).toContain(
      "horizontalpodautoscaler='checkout-hpa'"
    );
  });
});

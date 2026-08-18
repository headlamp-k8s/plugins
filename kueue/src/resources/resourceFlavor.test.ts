import { renderNodeLabels, renderTaint, renderTaints, renderToleration, renderTolerations, renderTopologyName } from './resourceFlavorFormatters';

describe('renderNodeLabels', () => {
  it('returns a dash when there are no labels', () => {
    expect(renderNodeLabels()).toBe('-');
    expect(renderNodeLabels({})).toBe('-');
  });

  it('renders labels as key=value pairs', () => {
    expect(renderNodeLabels({ zone: 'us-east-1', gpu: 'true' })).toBe('zone=us-east-1, gpu=true');
  });
});

describe('renderTaint', () => {
  it('renders a taint without a value', () => {
    expect(renderTaint({ key: 'spot', effect: 'NoSchedule' })).toBe('spot:NoSchedule');
  });

  it('renders a taint with a value', () => {
    expect(renderTaint({ key: 'spot', value: 'true', effect: 'NoSchedule' })).toBe(
      'spot=true:NoSchedule'
    );
  });
});

describe('renderTaints', () => {
  it('returns a dash when there are no taints', () => {
    expect(renderTaints()).toBe('-');
    expect(renderTaints([])).toBe('-');
  });

  it('renders multiple taints joined by commas', () => {
    expect(
      renderTaints([
        { key: 'spot', effect: 'NoSchedule' },
        { key: 'gpu', value: 'true', effect: 'NoExecute' },
      ])
    ).toBe('spot:NoSchedule, gpu=true:NoExecute');
  });
});

describe('renderToleration', () => {
  it('renders a toleration with defaults when fields are missing', () => {
    expect(renderToleration({})).toBe('*');
  });

  it('renders a toleration with an Exists operator', () => {
    expect(renderToleration({ key: 'spot', operator: 'Exists', effect: 'NoSchedule' })).toBe(
      'spot:NoSchedule'
    );
  });

  it('renders a toleration with a value and tolerationSeconds', () => {
    expect(
      renderToleration({ key: 'spot', value: 'true', effect: 'NoExecute', tolerationSeconds: 30 })
    ).toBe('spot=true:NoExecute (30s)');
  });
});

describe('renderTolerations', () => {
  it('returns a dash when there are no tolerations', () => {
    expect(renderTolerations()).toBe('-');
    expect(renderTolerations([])).toBe('-');
  });
});

describe('renderTopologyName', () => {
  it('returns a dash when topologyName is missing', () => {
    expect(renderTopologyName()).toBe('-');
  });

  it('returns the topology name when present', () => {
    expect(renderTopologyName('rack')).toBe('rack');
  });
});
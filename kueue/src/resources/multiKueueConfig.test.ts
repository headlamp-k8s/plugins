import { renderClusterCount, renderClusters } from './multiKueueConfigFormatters';

describe('renderClusters', () => {
  it('returns a dash when there are no clusters', () => {
    expect(renderClusters()).toBe('-');
    expect(renderClusters([])).toBe('-');
  });

  it('renders a single cluster', () => {
    expect(renderClusters(['worker1'])).toBe('worker1');
  });

  it('renders multiple clusters as a comma-separated list, preserving order', () => {
    expect(renderClusters(['worker-onprem', 'worker-aws', 'worker-gcp'])).toBe(
      'worker-onprem, worker-aws, worker-gcp'
    );
  });
});

describe('renderClusterCount', () => {
  it('returns 0 when there are no clusters', () => {
    expect(renderClusterCount()).toBe(0);
    expect(renderClusterCount([])).toBe(0);
  });

  it('returns the number of clusters', () => {
    expect(renderClusterCount(['worker1', 'worker2', 'worker3'])).toBe(3);
  });
});
import { describe, expect, it } from 'vitest';
import { renderClusters } from './multiKueueConfigFormatters';

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

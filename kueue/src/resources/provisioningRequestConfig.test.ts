import { describe, expect, it } from 'vitest';
import {
  renderManagedResources,
  renderPodSetMergePolicy,
  renderProvisioningClassName,
  renderRetryStrategy,
} from './provisioningRequestConfigFormatters';

describe('renderProvisioningClassName', () => {
  it('returns a dash when missing', () => {
    expect(renderProvisioningClassName()).toBe('-');
    expect(renderProvisioningClassName('')).toBe('-');
  });

  it('returns the class name when present', () => {
    expect(renderProvisioningClassName('check-capacity.autoscaling.x-k8s.io')).toBe(
      'check-capacity.autoscaling.x-k8s.io'
    );
  });
});

describe('renderManagedResources', () => {
  it('reads an empty list as all resources, as Kueue does', () => {
    expect(renderManagedResources()).toBe('All resources');
    expect(renderManagedResources([])).toBe('All resources');
  });

  it('renders a comma-separated list', () => {
    expect(renderManagedResources(['nvidia.com/gpu', 'cpu', 'memory'])).toBe(
      'nvidia.com/gpu, cpu, memory'
    );
  });
});

describe('renderRetryStrategy', () => {
  it('returns a dash when there is no retry strategy', () => {
    expect(renderRetryStrategy()).toBe('-');
  });

  it('returns a dash when the retry strategy has no fields set', () => {
    expect(renderRetryStrategy({})).toBe('-');
  });

  it('renders only the fields that are present', () => {
    expect(renderRetryStrategy({ backoffLimitCount: 2 })).toBe('limit: 2');
  });

  it('renders all fields when fully specified', () => {
    expect(
      renderRetryStrategy({ backoffLimitCount: 2, backoffBaseSeconds: 60, backoffMaxSeconds: 1800 })
    ).toBe('limit: 2, base: 60s, max: 1800s');
  });

  it('renders backoffLimitCount of zero, not treating it as missing', () => {
    expect(renderRetryStrategy({ backoffLimitCount: 0 })).toBe('limit: 0');
  });
});

describe('renderPodSetMergePolicy', () => {
  it('returns a dash when missing', () => {
    expect(renderPodSetMergePolicy()).toBe('-');
  });

  it('returns the policy when present', () => {
    expect(renderPodSetMergePolicy('IdenticalWorkloadSchedulingRequirements')).toBe(
      'IdenticalWorkloadSchedulingRequirements'
    );
  });
});

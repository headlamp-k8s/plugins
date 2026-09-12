import { renderUpdateStrategy, showReplicas, showUpdateStrategy } from './ReplicaHelpers';

describe('Replica helpers (node tests)', () => {
  test('showUpdateStrategy detects v1beta1 strategy', () => {
    const item: any = { spec: { strategy: { type: 'RollingUpdate' } } };
    expect(showUpdateStrategy(item)).toBe(true);
  });

  test('renderUpdateStrategy formats rolling update', () => {
    const item: any = {
      spec: {
        strategy: {
          type: 'RollingUpdate',
          rollingUpdate: { maxSurge: '25%', maxUnavailable: 1 },
        },
      },
    };
    expect(renderUpdateStrategy(item)).toContain('RollingUpdate');
    expect(renderUpdateStrategy(item)).toContain('maxSurge=25%');
  });

  test('renderUpdateStrategy supports v1beta2 rollout strategy and non-rolling strategies', () => {
    expect(
      renderUpdateStrategy({
        spec: { rollout: { strategy: { type: 'RollingUpdate', rollingUpdate: {} } } },
      } as any)
    ).toBe('RollingUpdate');

    expect(renderUpdateStrategy({ spec: { rolloutStrategy: { type: 'OnDelete' } } } as any)).toBe(
      'OnDelete'
    );
    expect(renderUpdateStrategy({ spec: {} } as any)).toBe('-');
  });

  test('showReplicas returns false when no replicas info', () => {
    const item: any = {};
    expect(showReplicas(item)).toBe(false);
  });

  test('showReplicas returns true when spec replicas present', () => {
    const item: any = { spec: { replicas: 3 } };
    expect(showReplicas(item)).toBe(true);
  });

  test('showReplicas returns true when only status replicas are present', () => {
    const item: any = { status: { replicas: 2 } };
    expect(showReplicas(item)).toBe(true);
  });
});

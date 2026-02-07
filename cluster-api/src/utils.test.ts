import {
  formatKCPRolloutStrategy,
  formatUpdateStrategy,
  getReplicaValues,
  hasReplicas,
} from './utils';

describe('formatUpdateStrategy', () => {
  it('should return null when strategy is undefined', () => {
    expect(formatUpdateStrategy(undefined)).toBeNull();
  });

  it('should return the strategy type for OnDelete', () => {
    expect(formatUpdateStrategy({ type: 'OnDelete' })).toBe('OnDelete');
  });

  it('should return formatted string for RollingUpdate with params', () => {
    expect(
      formatUpdateStrategy({
        type: 'RollingUpdate',
        rollingUpdate: { maxUnavailable: 1, maxSurge: 1 },
      })
    ).toBe('RollingUpdate. Max unavailable: 1, max surge: 1');
  });

  it('should return type string for RollingUpdate without rollingUpdate details', () => {
    expect(formatUpdateStrategy({ type: 'RollingUpdate' })).toBe('RollingUpdate');
  });

  it('should handle string values for maxUnavailable and maxSurge', () => {
    expect(
      formatUpdateStrategy({
        type: 'RollingUpdate',
        rollingUpdate: { maxUnavailable: '25%', maxSurge: '25%' },
      })
    ).toBe('RollingUpdate. Max unavailable: 25%, max surge: 25%');
  });
});

describe('hasReplicas', () => {
  it('should return true when spec.replicas is defined', () => {
    expect(hasReplicas({ replicas: 3 }, {})).toBe(true);
  });

  it('should return true when status.replicas is defined', () => {
    expect(hasReplicas({}, { replicas: 2 })).toBe(true);
  });

  it('should return true when both spec and status have replicas', () => {
    expect(hasReplicas({ replicas: 3 }, { replicas: 3 })).toBe(true);
  });

  it('should return false when neither has replicas', () => {
    expect(hasReplicas({}, {})).toBe(false);
  });

  it('should return false when both are undefined', () => {
    expect(hasReplicas(undefined, undefined)).toBe(false);
  });

  it('should return true when replicas is 0 (explicit zero)', () => {
    expect(hasReplicas({ replicas: 0 }, {})).toBe(true);
  });
});

describe('getReplicaValues', () => {
  it('should return null when no replicas info is available', () => {
    expect(getReplicaValues({}, {})).toBeNull();
  });

  it('should return null when both spec and status are undefined', () => {
    expect(getReplicaValues(undefined, undefined)).toBeNull();
  });

  it('should return basic values with Desired, Ready, and Total', () => {
    const result = getReplicaValues({ replicas: 3 }, { replicas: 3, readyReplicas: 2 });
    expect(result).toEqual({
      Desired: '3',
      Ready: '2',
      Total: '3',
    });
  });

  it('should include updatedReplicas when present', () => {
    const result = getReplicaValues(
      { replicas: 3 },
      { replicas: 3, readyReplicas: 2, updatedReplicas: 1 }
    );
    expect(result).toEqual({
      Desired: '3',
      Ready: '2',
      'Up to date': '1',
      Total: '3',
    });
  });

  it('should include availableReplicas when present', () => {
    const result = getReplicaValues(
      { replicas: 3 },
      { replicas: 3, readyReplicas: 2, availableReplicas: 2 }
    );
    expect(result).toEqual({
      Desired: '3',
      Ready: '2',
      Available: '2',
      Total: '3',
    });
  });

  it('should include all fields when all are present', () => {
    const result = getReplicaValues(
      { replicas: 5 },
      { replicas: 5, readyReplicas: 4, updatedReplicas: 3, availableReplicas: 4 }
    );
    expect(result).toEqual({
      Desired: '5',
      Ready: '4',
      'Up to date': '3',
      Available: '4',
      Total: '5',
    });
  });

  it('should handle zero values correctly', () => {
    const result = getReplicaValues(
      { replicas: 0 },
      { replicas: 0, readyReplicas: 0 }
    );
    expect(result).toEqual({
      Desired: '0',
      Ready: '0',
      Total: '0',
    });
  });

  it('should handle updatedReplicas as 0', () => {
    const result = getReplicaValues(
      { replicas: 3 },
      { replicas: 3, readyReplicas: 0, updatedReplicas: 0 }
    );
    expect(result).toEqual({
      Desired: '3',
      Ready: '0',
      'Up to date': '0',
      Total: '3',
    });
  });
});

describe('formatKCPRolloutStrategy', () => {
  it('should return null when rolloutStrategy is undefined', () => {
    expect(formatKCPRolloutStrategy(undefined)).toBeNull();
  });

  it('should return the type when not RollingUpdate', () => {
    expect(formatKCPRolloutStrategy({ type: 'OnDelete' })).toBe('OnDelete');
  });

  it('should return null when type is empty string', () => {
    expect(formatKCPRolloutStrategy({ type: '' })).toBeNull();
  });

  it('should return formatted string for RollingUpdate with maxSurge', () => {
    expect(
      formatKCPRolloutStrategy({
        type: 'RollingUpdate',
        rollingUpdate: { maxSurge: 2 },
      })
    ).toBe('RollingUpdate. Max surge: 2');
  });

  it('should default maxSurge to 1 when not specified', () => {
    expect(
      formatKCPRolloutStrategy({
        type: 'RollingUpdate',
        rollingUpdate: {},
      })
    ).toBe('RollingUpdate. Max surge: 1');
  });

  it('should return type for RollingUpdate without rollingUpdate details', () => {
    expect(formatKCPRolloutStrategy({ type: 'RollingUpdate' })).toBe('RollingUpdate');
  });
});

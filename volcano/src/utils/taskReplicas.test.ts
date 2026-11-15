import { getTaskReplicas, getTotalReplicas } from './taskReplicas';

describe('getTaskReplicas', () => {
  it('returns the replicas when set', () => {
    expect(getTaskReplicas({ replicas: 3 })).toBe(3);
  });

  it('treats a missing replicas field as 0', () => {
    expect(getTaskReplicas({})).toBe(0);
  });
});

describe('getTotalReplicas', () => {
  it('sums replicas across tasks', () => {
    expect(getTotalReplicas([{ replicas: 2 }, { replicas: 3 }])).toBe(5);
  });

  it('counts tasks without replicas as 0 instead of returning NaN', () => {
    expect(getTotalReplicas([{ replicas: 2 }, {}])).toBe(2);
  });

  it('returns 0 when there are no tasks', () => {
    expect(getTotalReplicas(undefined)).toBe(0);
    expect(getTotalReplicas([])).toBe(0);
  });
});

import { getReadyStatus } from './readyStatus';

const withConditions = (conditions: any[]) => ({ jsonData: { status: { conditions } } });

describe('getReadyStatus', () => {
  it('returns "-" when the resource has no status at all', () => {
    expect(getReadyStatus({})).toBe('-');
    expect(getReadyStatus({ jsonData: {} })).toBe('-');
    expect(getReadyStatus({ jsonData: { status: {} } })).toBe('-');
  });

  it('returns "-" when there is no Ready condition yet', () => {
    expect(getReadyStatus(withConditions([]))).toBe('-');
    expect(getReadyStatus(withConditions([{ type: 'Launched', status: 'True' }]))).toBe('-');
  });

  it('returns "Ready" when the Ready condition is True', () => {
    expect(getReadyStatus(withConditions([{ type: 'Ready', status: 'True' }]))).toBe('Ready');
  });

  it('returns "Not Ready" only when the Ready condition is False', () => {
    expect(getReadyStatus(withConditions([{ type: 'Ready', status: 'False' }]))).toBe('Not Ready');
  });

  it('returns "Reconciling" while the Ready condition is Unknown', () => {
    expect(getReadyStatus(withConditions([{ type: 'Ready', status: 'Unknown' }]))).toBe(
      'Reconciling…'
    );
    expect(getReadyStatus(withConditions([{ type: 'Ready' }]))).toBe('Reconciling…');
  });

  it('picks the Ready condition out of a list of conditions', () => {
    const resource = withConditions([
      { type: 'Launched', status: 'True' },
      { type: 'Ready', status: 'Unknown' },
      { type: 'Drifted', status: 'False' },
    ]);
    expect(getReadyStatus(resource)).toBe('Reconciling…');
  });

  it('runs the labels through the translator when one is given', () => {
    const t = (key: string) => `translated:${key}`;
    expect(getReadyStatus(withConditions([{ type: 'Ready', status: 'True' }]), t)).toBe(
      'translated:Ready'
    );
    expect(getReadyStatus(withConditions([{ type: 'Ready', status: 'Unknown' }]), t)).toBe(
      'translated:Reconciling…'
    );
  });

  it('does not translate the placeholder for a missing condition', () => {
    const t = (key: string) => `translated:${key}`;
    expect(getReadyStatus({}, t)).toBe('-');
  });
});

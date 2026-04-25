import { getStatus } from './overviewStatus';

describe('getStatus', () => {
  it('returns Failed when a failed condition is true', () => {
    expect(
      getStatus({
        status: {
          conditions: [
            { type: 'Created', status: 'True' },
            { type: 'Failed', status: 'True' },
          ],
        },
      })
    ).toBe('Failed');
  });

  it('returns Running when a ready condition is true', () => {
    expect(
      getStatus({
        status: {
          conditions: [{ type: 'Ready', status: 'True' }],
        },
      })
    ).toBe('Running');
  });

  it('returns phase when no terminal condition matches', () => {
    expect(
      getStatus({
        status: {
          phase: 'Succeeded',
          conditions: [{ type: 'Ready', status: 'False' }],
        },
      })
    ).toBe('Succeeded');
  });

  it('returns the latest true condition when phase is absent', () => {
    expect(
      getStatus({
        status: {
          conditions: [{ type: 'Created', status: 'True' }],
        },
      })
    ).toBe('Created');
  });

  it('returns Pending when the latest condition is not true', () => {
    expect(
      getStatus({
        status: {
          conditions: [{ type: 'Ready', status: 'False' }],
        },
      })
    ).toBe('Pending');
  });

  it('returns Unknown when neither phase nor conditions exist', () => {
    expect(getStatus({ status: {} })).toBe('Unknown');
  });
});

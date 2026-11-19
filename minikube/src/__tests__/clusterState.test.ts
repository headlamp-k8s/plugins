import { getClusterState } from '../clusterState';

describe('getClusterState', () => {
  it.each([
    [undefined, 'loading'],
    [null, 'active'],
    [{ status: 401 }, 'auth-error'],
    [{ status: 403 }, 'permission-error'],
    [{ status: 500 }, 'unavailable'],
    [{}, 'unavailable'],
  ])('maps %j to %s', (error, expected) => {
    expect(getClusterState(error as any)).toBe(expected);
  });
});

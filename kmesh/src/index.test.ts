import { describe, expect, it } from 'vitest';
import { kmeshRoutePaths } from './utils/kmeshRoutes';

describe('Kmesh Routes', () => {
  it('should define waypoint routes correctly', () => {
    expect(kmeshRoutePaths.waypointsList).toBe('/kmesh/waypoints');
    expect(kmeshRoutePaths.waypointDetail).toBe('/kmesh/waypoints/:namespace/:name');
  });
});

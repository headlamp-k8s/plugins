import { describe, expect, it } from 'vitest';
import { kmeshRouteNames, kmeshRoutePaths } from './utils/kmeshRoutes';

describe('Kmesh Routes', () => {
  it('should define waypoint and health routes correctly', () => {
    expect(kmeshRoutePaths.waypointsList).toBe('/kmesh/waypoints');
    expect(kmeshRoutePaths.waypointDetail).toBe('/kmesh/waypoints/:namespace/:name');
    expect(kmeshRoutePaths.healthDashboard).toBe('/kmesh/health');
  });

  it('should define the xDS config dump route correctly', () => {
    expect(kmeshRoutePaths.xdsConfigDump).toBe('/kmesh/xds-config');
    expect(kmeshRouteNames.xdsConfigDump).toBe('kmesh-xds-config-dump');
  });
});

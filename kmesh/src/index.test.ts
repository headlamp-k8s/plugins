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

  it('should define the observability route correctly', () => {
    expect(kmeshRoutePaths.observability).toBe('/kmesh/observability');
    expect(kmeshRouteNames.observability).toBe('kmesh-observability');
  });

  it('should define the authz policies route correctly', () => {
    expect(kmeshRoutePaths.authzPolicies).toBe('/kmesh/authz-policies');
    expect(kmeshRouteNames.authzPolicies).toBe('kmesh-authz-policies');
  });

  it('should define the KmeshNodeInfo (Node Security) routes correctly', () => {
    expect(kmeshRoutePaths.nodeInfoList).toBe('/kmesh/node-security');
    expect(kmeshRoutePaths.nodeInfoDetail).toBe('/kmesh/node-security/:namespace/:name');
    expect(kmeshRouteNames.nodeInfoList).toBe('kmesh-nodeinfo-list');
    expect(kmeshRouteNames.nodeInfoDetail).toBe('kmesh-nodeinfo-detail');
  });
});

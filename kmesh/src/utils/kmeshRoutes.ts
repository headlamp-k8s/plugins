/**
 * Route name identifiers used by Headlamp router for KMesh views.
 */
export const kmeshRouteNames = {
  waypointsList: 'kmesh-waypoints-list',
  waypointDetail: 'kmesh-waypoint-detail',
  /** xDS Config Dump viewer (kernel-native / ADS mode) */
  xdsConfigDump: 'kmesh-xds-config-dump',
  healthDashboard: 'kmesh-health-dashboard',
} as const;

/**
 * Route paths for KMesh views.
 */
export const kmeshRoutePaths = {
  waypointsList: '/kmesh/waypoints',
  waypointDetail: '/kmesh/waypoints/:namespace/:name',
  /** xDS Config Dump viewer — surfaces clusters, listeners, and routes from
   *  the kernel-native (ADS) daemon config dump endpoint. */
  xdsConfigDump: '/kmesh/xds-config',
  healthDashboard: '/kmesh/health',
} as const;

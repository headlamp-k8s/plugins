/**
 * Route name identifiers used by Headlamp router for KMesh views.
 */
export const kmeshRouteNames = {
  waypointsList: 'kmesh-waypoints-list',
  waypointDetail: 'kmesh-waypoint-detail',
} as const;

/**
 * Route paths for KMesh views.
 */
export const kmeshRoutePaths = {
  waypointsList: '/kmesh/waypoints',
  waypointDetail: '/kmesh/waypoints/:namespace/:name',
} as const;

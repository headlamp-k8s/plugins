/** Route paths registered by the plugin (cluster-scoped RGDs use :name only). */
export const kroRoutePaths = {
  resourceGraphDefinitionsList: '/kro/resourcegraphdefinitions',
  resourceGraphDefinitionDetail: '/kro/resourcegraphdefinitions/:name',
  instanceDetail: '/kro/resourcegraphdefinitions/:rgdName/instances/:namespace/:name',
  clusterInstanceDetail: '/kro/resourcegraphdefinitions/:rgdName/instances/:name',
} as const;

/** Route names matching {@link kroRoutePaths}, used for Link targets. */
export const kroRouteNames = {
  resourceGraphDefinitionsList: 'kro-resourcegraphdefinitions-list',
  resourceGraphDefinitionDetail: 'kro-resourcegraphdefinition-detail',
  instanceDetail: 'kro-instance-detail',
  clusterInstanceDetail: 'kro-cluster-instance-detail',
} as const;

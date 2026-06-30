export const kueueRouteNames = {
  clusterQueuesList: 'kueue-clusterqueues-list',
  clusterQueueDetail: 'kueue-clusterqueue-detail',
  resourceFlavorsList: 'kueue-resourceflavors-list',
  resourceFlavorDetail: 'kueue-resourceflavor-detail',
} as const;

export const kueueRoutePaths = {
  clusterQueuesList: '/kueue/clusterqueues',
  clusterQueueDetail: '/kueue/clusterqueues/:name',
  resourceFlavorsList: '/kueue/resourceflavors',
  resourceFlavorDetail: '/kueue/resourceflavors/:name',
} as const;

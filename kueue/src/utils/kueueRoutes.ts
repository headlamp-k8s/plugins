export const kueueRouteNames = {
  clusterQueuesList: 'kueue-clusterqueues-list',
  clusterQueueDetail: 'kueue-clusterqueue-detail',
  localQueuesList: 'kueue-localqueues-list',
  localQueueDetail: 'kueue-localqueue-detail',
  resourceFlavorsList: 'kueue-resourceflavors-list',
  resourceFlavorDetail: 'kueue-resourceflavor-detail',
  workloadsList: 'kueue-workloads-list',
  workloadDetail: 'kueue-workload-detail',
} as const;

export const kueueRoutePaths = {
  clusterQueuesList: '/kueue/clusterqueues',
  clusterQueueDetail: '/kueue/clusterqueues/:name',
  localQueuesList: '/kueue/localqueues',
  localQueueDetail: '/kueue/localqueues/:namespace/:name',
  resourceFlavorsList: '/kueue/resourceflavors',
  resourceFlavorDetail: '/kueue/resourceflavors/:name',
  workloadsList: '/kueue/workloads',
  workloadDetail: '/kueue/workloads/:namespace/:name',
} as const;

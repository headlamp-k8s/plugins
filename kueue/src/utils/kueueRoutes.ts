export const kueueRouteNames = {
  resourceFlavorsList: 'kueue-resourceflavors-list',
  resourceFlavorDetail: 'kueue-resourceflavor-detail',
  clusterQueuesList: 'kueue-clusterqueues-list',
  clusterQueueDetail: 'kueue-clusterqueue-detail',
  localQueuesList: 'kueue-localqueues-list',
  localQueueDetail: 'kueue-localqueue-detail',
  workloadsList: 'kueue-workloads-list',
  workloadDetail: 'kueue-workload-detail',
} as const;

export const kueueRoutePaths = {
  resourceFlavorsList: '/kueue/resourceflavors',
  resourceFlavorDetail: '/kueue/resourceflavors/:name',
  clusterQueuesList: '/kueue/clusterqueues',
  clusterQueueDetail: '/kueue/clusterqueues/:name',
  localQueuesList: '/kueue/localqueues',
  localQueueDetail: '/kueue/localqueues/:namespace/:name',
  workloadsList: '/kueue/workloads',
  workloadDetail: '/kueue/workloads/:namespace/:name',
} as const;

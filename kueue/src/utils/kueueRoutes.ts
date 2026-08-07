export const kueueRouteNames = {
  cohortsList: 'kueue-cohorts-list',
  cohortDetail: 'kueue-cohort-detail',
  clusterQueuesList: 'kueue-clusterqueues-list',
  clusterQueueDetail: 'kueue-clusterqueue-detail',
  localQueuesList: 'kueue-localqueues-list',
  localQueueDetail: 'kueue-localqueue-detail',
  resourceFlavorsList: 'kueue-resourceflavors-list',
  resourceFlavorDetail: 'kueue-resourceflavor-detail',
} as const;

export const kueueRoutePaths = {
  cohortsList: '/kueue/cohorts',
  cohortDetail: '/kueue/cohorts/:name',
  clusterQueuesList: '/kueue/clusterqueues',
  clusterQueueDetail: '/kueue/clusterqueues/:name',
  localQueuesList: '/kueue/localqueues',
  localQueueDetail: '/kueue/localqueues/:namespace/:name',
  resourceFlavorsList: '/kueue/resourceflavors',
  resourceFlavorDetail: '/kueue/resourceflavors/:name',
} as const;

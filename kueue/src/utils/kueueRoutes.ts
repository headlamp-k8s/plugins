/**
 * Route names. Headlamp shows a route's name as the page title and finds routes by it,
 * ignoring case, so each one is readable and unique.
 */
export const kueueRouteNames = {
  overview: 'Kueue Overview',
  admissionChecksList: 'Kueue AdmissionChecks',
  admissionCheckDetail: 'Kueue AdmissionCheck',
  cohortsList: 'Kueue Cohorts',
  cohortDetail: 'Kueue Cohort',
  clusterQueuesList: 'Kueue ClusterQueues',
  clusterQueueDetail: 'Kueue ClusterQueue',
  localQueuesList: 'Kueue LocalQueues',
  localQueueDetail: 'Kueue LocalQueue',
  provisioningRequestConfigsList: 'Kueue ProvisioningRequestConfigs',
  provisioningRequestConfigDetail: 'Kueue ProvisioningRequestConfig',
  resourceFlavorsList: 'Kueue ResourceFlavors',
  resourceFlavorDetail: 'Kueue ResourceFlavor',
  workloadsList: 'Kueue Workloads',
  workloadDetail: 'Kueue Workload',
  multiKueueConfigsList: 'Kueue MultiKueueConfigs',
  multiKueueConfigDetail: 'Kueue MultiKueueConfig',
} as const;

export const kueueRoutePaths = {
  overview: '/kueue',
  admissionChecksList: '/kueue/admissionchecks',
  admissionCheckDetail: '/kueue/admissionchecks/:name',
  cohortsList: '/kueue/cohorts',
  cohortDetail: '/kueue/cohorts/:name',
  clusterQueuesList: '/kueue/clusterqueues',
  clusterQueueDetail: '/kueue/clusterqueues/:name',
  localQueuesList: '/kueue/localqueues',
  localQueueDetail: '/kueue/localqueues/:namespace/:name',
  provisioningRequestConfigsList: '/kueue/provisioningrequestconfigs',
  provisioningRequestConfigDetail: '/kueue/provisioningrequestconfigs/:name',
  resourceFlavorsList: '/kueue/resourceflavors',
  resourceFlavorDetail: '/kueue/resourceflavors/:name',
  workloadsList: '/kueue/workloads',
  workloadDetail: '/kueue/workloads/:namespace/:name',
  multiKueueConfigsList: '/kueue/multikueueconfigs',
  multiKueueConfigDetail: '/kueue/multikueueconfigs/:name',
} as const;

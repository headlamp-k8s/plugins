export const volcanoRouteNames = {
  overview: 'volcano-overview',
  jobsList: 'volcano-jobs-list',
  jobDetail: 'volcano-job-detail',
  jobTemplatesList: 'volcano-jobtemplates-list',
  jobTemplateDetail: 'volcano-jobtemplate-detail',
  jobFlowsList: 'volcano-jobflows-list',
  jobFlowDetail: 'volcano-jobflow-detail',
  queuesList: 'volcano-queues-list',
  queueDetail: 'volcano-queue-detail',
  podGroupsList: 'volcano-podgroups-list',
  podGroupDetail: 'volcano-podgroup-detail',
} as const;

export const volcanoRoutePaths = {
  overview: '/volcano',
  jobsList: '/volcano/jobs',
  jobDetail: '/volcano/jobs/:namespace/:name',
  jobTemplatesList: '/volcano/jobtemplates',
  jobTemplateDetail: '/volcano/jobtemplates/:namespace/:name',
  jobFlowsList: '/volcano/jobflows',
  jobFlowDetail: '/volcano/jobflows/:namespace/:name',
  queuesList: '/volcano/queues',
  queueDetail: '/volcano/queues/:name',
  podGroupsList: '/volcano/podgroups',
  podGroupDetail: '/volcano/podgroups/:namespace/:name',
} as const;

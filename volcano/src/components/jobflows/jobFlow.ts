import { JobFlowJobStatus, JobFlowSpecEntry, VolcanoJobFlow } from '../../resources/jobflow';

export type JobFlowPhaseCounts = Record<string, number>;
export type JobFlowJobStateByName = Record<string, string>;

export interface FlowStepSummary {
  flow: JobFlowSpecEntry;
  generatedJobName: string;
  state: string;
  unmetDependencies: string[];
}

type ReportedJobStatus = JobFlowJobStatus & { state?: string };

export function getGeneratedJobName(jobFlowName: string, templateName: string) {
  return `${jobFlowName}-${templateName}`;
}

export function getJobFlowPhaseCounts(jobFlow: VolcanoJobFlow): JobFlowPhaseCounts {
  const jobStatusList = jobFlow.status?.jobStatusList || [];
  if (jobStatusList.length > 0) {
    return jobStatusList.reduce<JobFlowPhaseCounts>((counts, jobStatus) => {
      const phase = jobStatus.state || 'Unknown';
      counts[phase] = (counts[phase] || 0) + 1;
      return counts;
    }, {});
  }

  return {
    Pending: jobFlow.status?.pendingJobs?.length ?? 0,
    Running: jobFlow.status?.runningJobs?.length ?? 0,
    Completed: jobFlow.status?.completedJobs?.length ?? 0,
    Terminated: jobFlow.status?.terminatedJobs?.length ?? 0,
    Failed: jobFlow.status?.failedJobs?.length ?? 0,
    Unknown: jobFlow.status?.unKnowJobs?.length ?? 0,
  };
}

export function getJobFlowPhaseCount(jobFlow: VolcanoJobFlow, phases: string[]) {
  const counts = getJobFlowPhaseCounts(jobFlow);
  return phases.reduce((total, phase) => total + (counts[phase] || 0), 0);
}

export function getJobFlowGeneratedJobCount(jobFlow: VolcanoJobFlow) {
  if (jobFlow.status?.jobStatusList?.length) {
    return jobFlow.status.jobStatusList.length;
  }

  return [
    jobFlow.status?.pendingJobs,
    jobFlow.status?.runningJobs,
    jobFlow.status?.failedJobs,
    jobFlow.status?.completedJobs,
    jobFlow.status?.terminatedJobs,
    jobFlow.status?.unKnowJobs,
  ].reduce((total, jobs) => total + (jobs?.length ?? 0), 0);
}

export function getReportedJobStatuses(jobFlow: VolcanoJobFlow): ReportedJobStatus[] {
  if (jobFlow.status?.jobStatusList?.length) {
    return jobFlow.status.jobStatusList;
  }

  return [
    ...(jobFlow.status?.pendingJobs || []).map(name => ({ name, state: 'Pending' })),
    ...(jobFlow.status?.runningJobs || []).map(name => ({ name, state: 'Running' })),
    ...(jobFlow.status?.failedJobs || []).map(name => ({ name, state: 'Failed' })),
    ...(jobFlow.status?.completedJobs || []).map(name => ({ name, state: 'Completed' })),
    ...(jobFlow.status?.terminatedJobs || []).map(name => ({ name, state: 'Terminated' })),
    ...(jobFlow.status?.unKnowJobs || []).map(name => ({ name, state: 'Unknown' })),
  ];
}

export function getReportedJobStateByName(jobFlow: VolcanoJobFlow): JobFlowJobStateByName {
  return getReportedJobStatuses(jobFlow).reduce<JobFlowJobStateByName>((states, job) => {
    if (job.name && job.state) {
      states[job.name] = job.state;
    }
    return states;
  }, {});
}

export function getJobFlowJobState(
  generatedJobName: string,
  jobStateByName: JobFlowJobStateByName
) {
  return jobStateByName[generatedJobName];
}

export function getFlowStepSummary(
  jobFlow: VolcanoJobFlow,
  flow: JobFlowSpecEntry,
  jobStateByName: JobFlowJobStateByName = getReportedJobStateByName(jobFlow)
): FlowStepSummary {
  const generatedJobName = getGeneratedJobName(jobFlow.metadata.name, flow.name);
  const jobState = getJobFlowJobState(generatedJobName, jobStateByName);

  if (jobState) {
    return { flow, generatedJobName, state: jobState, unmetDependencies: [] };
  }

  const unmetDependencies = (flow.dependsOn?.targets || []).filter(targetName => {
    const targetGeneratedJobName = getGeneratedJobName(jobFlow.metadata.name, targetName);
    return getJobFlowJobState(targetGeneratedJobName, jobStateByName) !== 'Completed';
  });

  return {
    flow,
    generatedJobName,
    state: unmetDependencies.length > 0 ? 'Waiting' : 'Not Created',
    unmetDependencies,
  };
}

export function getPatchSummary(flow: JobFlowSpecEntry) {
  const jobSpec = flow.patch?.jobSpec;
  if (!jobSpec) {
    return '-';
  }

  const fields = [
    jobSpec.queue ? `queue=${jobSpec.queue}` : null,
    jobSpec.schedulerName ? `scheduler=${jobSpec.schedulerName}` : null,
    jobSpec.minAvailable !== undefined ? `minAvailable=${jobSpec.minAvailable}` : null,
    jobSpec.minSuccess !== undefined ? `minSuccess=${jobSpec.minSuccess}` : null,
    jobSpec.maxRetry !== undefined ? `maxRetry=${jobSpec.maxRetry}` : null,
    jobSpec.priorityClassName ? `priorityClass=${jobSpec.priorityClassName}` : null,
    jobSpec.tasks?.length ? `tasks=${jobSpec.tasks.length}` : null,
    jobSpec.policies?.length ? `policies=${jobSpec.policies.length}` : null,
    jobSpec.plugins && Object.keys(jobSpec.plugins).length
      ? `plugins=${Object.keys(jobSpec.plugins).join(', ')}`
      : null,
  ].filter(Boolean);

  return fields.length ? fields.join('; ') : 'Job spec override configured';
}

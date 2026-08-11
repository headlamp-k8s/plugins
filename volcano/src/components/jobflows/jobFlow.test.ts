import { TaskSpec } from '../../resources/job';
import { JobFlowSpecEntry, VolcanoJobFlow, VolcanoJobFlowStatus } from '../../resources/jobflow';
import {
  getFlowStepSummary,
  getGeneratedJobName,
  getJobFlowGeneratedJobCount,
  getJobFlowJobState,
  getJobFlowPhaseCount,
  getJobFlowPhaseCounts,
  getPatchSummary,
  getReportedJobStateByName,
  getReportedJobStatuses,
} from './jobFlow';

function makeJobFlow(status?: VolcanoJobFlowStatus, name = 'flow'): VolcanoJobFlow {
  return {
    metadata: { name },
    status,
  } as VolcanoJobFlow;
}

function makeTask(name: string): TaskSpec {
  return { name, replicas: 1 } as TaskSpec;
}

describe('getGeneratedJobName', () => {
  it('joins the JobFlow name and the template name', () => {
    expect(getGeneratedJobName('flow', 'template')).toBe('flow-template');
  });
});

describe('getJobFlowPhaseCounts', () => {
  it('counts phases from jobStatusList when it is populated', () => {
    const jobFlow = makeJobFlow({
      jobStatusList: [
        { name: 'flow-a', state: 'Running' },
        { name: 'flow-b', state: 'Running' },
        { name: 'flow-c', state: 'Completed' },
      ],
    });

    expect(getJobFlowPhaseCounts(jobFlow)).toEqual({ Running: 2, Completed: 1 });
  });

  it('treats a job with no reported state as Unknown', () => {
    const jobFlow = makeJobFlow({ jobStatusList: [{ name: 'flow-a' }] });

    expect(getJobFlowPhaseCounts(jobFlow)).toEqual({ Unknown: 1 });
  });

  it('falls back to the per-phase arrays when jobStatusList is empty', () => {
    const jobFlow = makeJobFlow({
      jobStatusList: [],
      pendingJobs: ['flow-a'],
      runningJobs: ['flow-b', 'flow-c'],
      completedJobs: ['flow-d'],
    });

    expect(getJobFlowPhaseCounts(jobFlow)).toEqual({
      Pending: 1,
      Running: 2,
      Completed: 1,
      Terminated: 0,
      Failed: 0,
      Unknown: 0,
    });
  });

  it('returns zeroed counts when status is missing entirely', () => {
    expect(getJobFlowPhaseCounts(makeJobFlow())).toEqual({
      Pending: 0,
      Running: 0,
      Completed: 0,
      Terminated: 0,
      Failed: 0,
      Unknown: 0,
    });
  });
});

describe('getJobFlowPhaseCount', () => {
  it('sums the counts for the requested phases', () => {
    const jobFlow = makeJobFlow({
      jobStatusList: [
        { name: 'flow-a', state: 'Running' },
        { name: 'flow-b', state: 'Pending' },
        { name: 'flow-c', state: 'Completed' },
      ],
    });

    expect(getJobFlowPhaseCount(jobFlow, ['Running', 'Pending'])).toBe(2);
  });

  it('ignores phases that are not present', () => {
    const jobFlow = makeJobFlow({ jobStatusList: [{ name: 'flow-a', state: 'Running' }] });

    expect(getJobFlowPhaseCount(jobFlow, ['Failed'])).toBe(0);
    expect(getJobFlowPhaseCount(jobFlow, [])).toBe(0);
  });

  // Recording current behaviour, not asserting it is correct. jobStatusList
  // reports the upstream JobPhase, which also has Aborting, Aborted and
  // Restarting. The JobFlow detail view buckets Pending, Running, Failed,
  // Completed/Completing, Terminated/Terminating and Unknown, so a job in one
  // of the other three phases is counted in the total but in none of the
  // per-phase rows.
  it('leaves JobPhase values outside the buckets the detail view queries', () => {
    const displayedPhases = [
      'Pending',
      'Running',
      'Failed',
      'Completed',
      'Completing',
      'Terminated',
      'Terminating',
      'Unknown',
    ];
    const jobFlow = makeJobFlow({
      jobStatusList: [
        { name: 'flow-a', state: 'Aborting' },
        { name: 'flow-b', state: 'Restarting' },
        { name: 'flow-c', state: 'Running' },
      ],
    });

    expect(getJobFlowGeneratedJobCount(jobFlow)).toBe(3);
    expect(getJobFlowPhaseCount(jobFlow, displayedPhases)).toBe(1);
  });
});

describe('getJobFlowGeneratedJobCount', () => {
  it('uses the jobStatusList length when it is populated', () => {
    const jobFlow = makeJobFlow({
      jobStatusList: [{ name: 'flow-a' }, { name: 'flow-b' }],
      pendingJobs: ['ignored'],
    });

    expect(getJobFlowGeneratedJobCount(jobFlow)).toBe(2);
  });

  it('sums the per-phase arrays when jobStatusList is empty', () => {
    const jobFlow = makeJobFlow({
      pendingJobs: ['flow-a'],
      runningJobs: ['flow-b'],
      failedJobs: ['flow-c'],
      completedJobs: ['flow-d'],
      terminatedJobs: ['flow-e'],
      unKnowJobs: ['flow-f'],
    });

    expect(getJobFlowGeneratedJobCount(jobFlow)).toBe(6);
  });

  it('returns zero when nothing has been generated', () => {
    expect(getJobFlowGeneratedJobCount(makeJobFlow())).toBe(0);
  });
});

describe('getReportedJobStatuses', () => {
  it('returns jobStatusList unchanged when it is populated', () => {
    const jobStatusList = [{ name: 'flow-a', state: 'Running' }];

    expect(getReportedJobStatuses(makeJobFlow({ jobStatusList }))).toEqual(jobStatusList);
  });

  it('synthesizes statuses from the per-phase arrays', () => {
    const jobFlow = makeJobFlow({
      pendingJobs: ['flow-a'],
      runningJobs: ['flow-b'],
      unKnowJobs: ['flow-c'],
    });

    expect(getReportedJobStatuses(jobFlow)).toEqual([
      { name: 'flow-a', state: 'Pending' },
      { name: 'flow-b', state: 'Running' },
      { name: 'flow-c', state: 'Unknown' },
    ]);
  });

  it('returns an empty list when status is missing', () => {
    expect(getReportedJobStatuses(makeJobFlow())).toEqual([]);
  });
});

describe('getReportedJobStateByName', () => {
  it('maps generated job names to their state', () => {
    const jobFlow = makeJobFlow({
      jobStatusList: [
        { name: 'flow-a', state: 'Running' },
        { name: 'flow-b', state: 'Completed' },
      ],
    });

    expect(getReportedJobStateByName(jobFlow)).toEqual({
      'flow-a': 'Running',
      'flow-b': 'Completed',
    });
  });

  it('skips entries missing a name or a state', () => {
    const jobFlow = makeJobFlow({
      jobStatusList: [
        { name: 'flow-a' },
        { state: 'Running' },
        { name: 'flow-b', state: 'Failed' },
      ],
    });

    expect(getReportedJobStateByName(jobFlow)).toEqual({ 'flow-b': 'Failed' });
  });
});

describe('getJobFlowJobState', () => {
  it('returns the state for a known generated job', () => {
    expect(getJobFlowJobState('flow-a', { 'flow-a': 'Running' })).toBe('Running');
  });

  it('returns undefined for a job that has not been created', () => {
    expect(getJobFlowJobState('flow-b', { 'flow-a': 'Running' })).toBeUndefined();
  });
});

describe('getFlowStepSummary', () => {
  const jobFlow = makeJobFlow(undefined, 'flow');

  it('reports the running state and no unmet dependencies once the job exists', () => {
    const flow: JobFlowSpecEntry = { name: 'a', dependsOn: { targets: ['b'] } };

    expect(getFlowStepSummary(jobFlow, flow, { 'flow-a': 'Running' })).toEqual({
      flow,
      generatedJobName: 'flow-a',
      state: 'Running',
      unmetDependencies: [],
    });
  });

  it('reports Not Created when the step has no dependencies and no job yet', () => {
    const flow: JobFlowSpecEntry = { name: 'a' };

    expect(getFlowStepSummary(jobFlow, flow, {})).toEqual({
      flow,
      generatedJobName: 'flow-a',
      state: 'Not Created',
      unmetDependencies: [],
    });
  });

  it('reports Waiting and lists dependencies that have not completed', () => {
    const flow: JobFlowSpecEntry = { name: 'c', dependsOn: { targets: ['a', 'b'] } };

    expect(
      getFlowStepSummary(jobFlow, flow, { 'flow-a': 'Completed', 'flow-b': 'Running' })
    ).toEqual({
      flow,
      generatedJobName: 'flow-c',
      state: 'Waiting',
      unmetDependencies: ['b'],
    });
  });

  it('reports Not Created once every dependency has completed', () => {
    const flow: JobFlowSpecEntry = { name: 'c', dependsOn: { targets: ['a', 'b'] } };

    expect(
      getFlowStepSummary(jobFlow, flow, { 'flow-a': 'Completed', 'flow-b': 'Completed' })
    ).toMatchObject({ state: 'Not Created', unmetDependencies: [] });
  });

  it('derives the state map from the JobFlow when one is not supplied', () => {
    const jobFlowWithStatus = makeJobFlow({
      jobStatusList: [{ name: 'flow-a', state: 'Running' }],
    });

    expect(getFlowStepSummary(jobFlowWithStatus, { name: 'a' })).toMatchObject({
      state: 'Running',
    });
  });
});

describe('getPatchSummary', () => {
  it('returns a dash when the flow has no jobSpec patch', () => {
    expect(getPatchSummary({ name: 'a' })).toBe('-');
    expect(getPatchSummary({ name: 'a', patch: {} })).toBe('-');
  });

  it('summarizes the patched scalar fields', () => {
    const summary = getPatchSummary({
      name: 'a',
      patch: { jobSpec: { queue: 'default', schedulerName: 'volcano', maxRetry: 3 } },
    });

    expect(summary).toBe('queue=default; scheduler=volcano; maxRetry=3');
  });

  it('preserves explicit zero values', () => {
    expect(getPatchSummary({ name: 'a', patch: { jobSpec: { minAvailable: 0 } } })).toBe(
      'minAvailable=0'
    );
  });

  it('summarizes collection fields by size and plugin names', () => {
    const summary = getPatchSummary({
      name: 'a',
      patch: {
        jobSpec: {
          tasks: [makeTask('worker'), makeTask('master')],
          policies: [{ action: 'RestartJob' }],
          plugins: { ssh: [], svc: [] },
        },
      },
    });

    expect(summary).toBe('tasks=2; policies=1; plugins=ssh, svc');
  });

  it('falls back to a generic message when the patch has no recognized fields', () => {
    expect(getPatchSummary({ name: 'a', patch: { jobSpec: { tasks: [] } } })).toBe(
      'Job spec override configured'
    );
  });
});

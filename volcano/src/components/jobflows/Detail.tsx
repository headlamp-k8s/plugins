import {
  DateLabel,
  DetailsGrid,
  Link,
  NameValueTable,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { JobPhase } from '../../resources/job';
import {
  JobFlowConditionEntry,
  JobFlowHttpGetProbe,
  JobFlowSpecEntry,
  JobFlowTaskStateCount,
  JobFlowTcpSocketProbe,
  VolcanoJobFlow,
} from '../../resources/jobflow';
import { getJobFlowStatusColor, getJobStatusColor } from '../../utils/status';
import { VolcanoFlowInstallCheck } from '../common/CommonComponents';
import {
  getFlowStepSummary,
  getJobFlowGeneratedJobCount,
  getJobFlowPhaseCount,
  getPatchSummary,
  getReportedJobStateByName,
  getReportedJobStatuses,
} from './jobFlow';

const jobPhases: JobPhase[] = [
  'Running',
  'Completing',
  'Completed',
  'Pending',
  'Restarting',
  'Aborting',
  'Terminating',
  'Failed',
  'Aborted',
  'Terminated',
];

function isJobPhase(phase: string): phase is JobPhase {
  return jobPhases.includes(phase as JobPhase);
}

function getFlowStepStatusColor(phase: string) {
  return isJobPhase(phase) ? getJobStatusColor(phase) : getJobFlowStatusColor(phase);
}

function formatTaskStatusCounts(taskStatusCount?: Record<string, JobFlowTaskStateCount>) {
  if (!taskStatusCount || !Object.keys(taskStatusCount).length) {
    return '-';
  }

  return Object.entries(taskStatusCount)
    .map(([taskName, taskState]) => {
      const phases = taskState.phase || {};
      const counts = Object.entries(phases)
        .map(([phase, count]) => `${phase}=${count}`)
        .join(', ');
      return counts ? `${taskName}(${counts})` : taskName;
    })
    .join(', ');
}

function formatHttpProbes(probes?: JobFlowHttpGetProbe[]) {
  if (!probes?.length) {
    return '-';
  }

  return probes
    .map(probe => {
      const header = probe.httpHeader
        ? ` header=${probe.httpHeader.name}:${probe.httpHeader.value}`
        : '';
      return `${probe.taskName || 'task'} ${probe.path || '/'}:${probe.port ?? '-'}${header}`;
    })
    .join(', ');
}

function formatTcpProbes(probes?: JobFlowTcpSocketProbe[]) {
  if (!probes?.length) {
    return '-';
  }

  return probes.map(probe => `${probe.taskName || 'task'}:${probe.port ?? '-'}`).join(', ');
}

function renderEmptySection(title: string, message: string) {
  return {
    id: title.toLowerCase().replace(/ /g, '-'),
    section: (
      <SectionBox title={title}>
        <NameValueTable rows={[{ name: 'Info', value: message }]} />
      </SectionBox>
    ),
  };
}

function renderJobTemplateLinks(templateNames?: string[], namespace?: string) {
  if (!templateNames?.length || !namespace) {
    return '-';
  }

  return (
    <>
      {templateNames.map((templateName, index) => (
        <span key={templateName}>
          {index > 0 ? ', ' : ''}
          <Link routeName="volcano-jobtemplate-detail" params={{ namespace, name: templateName }}>
            {templateName}
          </Link>
        </span>
      ))}
    </>
  );
}

/**
 * Builds the Flows section for the JobFlow details page.
 *
 * @param jobFlow Volcano JobFlow shown in the details page.
 * @returns Section descriptor or `null` if no flows exist.
 */
function getFlowsSection(jobFlow: VolcanoJobFlow) {
  if (!jobFlow.spec.flows?.length) {
    return null;
  }

  const jobStateByName = getReportedJobStateByName(jobFlow);
  const flowSummaries = jobFlow.spec.flows.map(flow =>
    getFlowStepSummary(jobFlow, flow, jobStateByName)
  );

  return {
    id: 'flows',
    section: (
      <SectionBox title="Flows">
        <SimpleTable
          data={flowSummaries}
          columns={[
            {
              label: 'JobTemplate',
              getter: summary => (
                <Link
                  routeName="volcano-jobtemplate-detail"
                  params={{ namespace: jobFlow.metadata.namespace, name: summary.flow.name }}
                >
                  {summary.flow.name}
                </Link>
              ),
            },
            {
              label: 'Generated Job',
              getter: summary =>
                summary.state === 'Waiting' || summary.state === 'Not Created' ? (
                  summary.generatedJobName
                ) : (
                  <Link
                    routeName="volcano-job-detail"
                    params={{
                      namespace: jobFlow.metadata.namespace,
                      name: summary.generatedJobName,
                    }}
                  >
                    {summary.generatedJobName}
                  </Link>
                ),
            },
            {
              label: 'State',
              getter: summary => (
                <StatusLabel status={getFlowStepStatusColor(summary.state)}>
                  {summary.state}
                </StatusLabel>
              ),
            },
            {
              label: 'Depends On',
              getter: summary =>
                renderJobTemplateLinks(summary.flow.dependsOn?.targets, jobFlow.metadata.namespace),
            },
            {
              label: 'Unmet Dependencies',
              getter: summary =>
                summary.unmetDependencies.length
                  ? renderJobTemplateLinks(summary.unmetDependencies, jobFlow.metadata.namespace)
                  : '-',
            },
            {
              label: 'Patch',
              getter: summary => getPatchSummary(summary.flow),
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

function getConfiguredProbesSection(jobFlow: VolcanoJobFlow) {
  const flowsWithProbes = (jobFlow.spec.flows || []).filter(flow => flow.dependsOn?.probe);
  if (!flowsWithProbes.length) {
    return null;
  }

  return {
    id: 'configured-probes',
    section: (
      <SectionBox title="Configured Dependency Probes">
        {flowsWithProbes.map((flow: JobFlowSpecEntry, index) => (
          <NameValueTable
            key={flow.name || index}
            rows={[
              { name: 'JobTemplate', value: flow.name },
              {
                name: 'Configured Task Status Probes',
                value: flow.dependsOn?.probe?.taskStatusList?.length
                  ? flow.dependsOn.probe.taskStatusList
                      .map(probe => `${probe.taskName || 'task'}=${probe.phase || '-'}`)
                      .join(', ')
                  : '-',
              },
              {
                name: 'Configured HTTP Probes',
                value: formatHttpProbes(flow.dependsOn?.probe?.httpGetList),
              },
              {
                name: 'Configured TCP Probes',
                value: formatTcpProbes(flow.dependsOn?.probe?.tcpSocketList),
              },
            ]}
          />
        ))}
      </SectionBox>
    ),
  };
}

/**
 * Builds the generated Jobs section for a JobFlow.
 *
 * @param jobFlow Volcano JobFlow shown in the details page.
 * @returns Section descriptor or `null` if no generated Jobs are reported.
 */
function getGeneratedJobsSection(jobFlow: VolcanoJobFlow) {
  const reportedJobStatuses = getReportedJobStatuses(jobFlow);

  if (!reportedJobStatuses.length) {
    return renderEmptySection('Generated Jobs', 'No Jobs have been created for this JobFlow yet.');
  }

  return {
    id: 'generated-jobs',
    section: (
      <SectionBox title="Generated Jobs">
        <SimpleTable
          data={reportedJobStatuses}
          columns={[
            {
              label: 'Name',
              getter: jobStatus =>
                jobStatus.name ? (
                  <Link
                    routeName="volcano-job-detail"
                    params={{ namespace: jobFlow.metadata.namespace, name: jobStatus.name }}
                  >
                    {jobStatus.name}
                  </Link>
                ) : (
                  '-'
                ),
            },
            {
              label: 'State',
              getter: jobStatus =>
                jobStatus.state ? (
                  <StatusLabel status={getFlowStepStatusColor(jobStatus.state)}>
                    {jobStatus.state}
                  </StatusLabel>
                ) : (
                  '-'
                ),
            },
            {
              label: 'Start',
              getter: jobStatus =>
                jobStatus.startTimestamp ? <DateLabel date={jobStatus.startTimestamp} /> : '-',
            },
            {
              label: 'End',
              getter: jobStatus =>
                jobStatus.endTimestamp ? <DateLabel date={jobStatus.endTimestamp} /> : '-',
            },
            {
              label: 'Retries',
              getter: jobStatus => jobStatus.restartCount ?? 0,
            },
            {
              label: 'History Entries',
              getter: jobStatus => jobStatus.runningHistories?.length ?? 0,
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/**
 * Builds the Conditions section for a JobFlow.
 *
 * @param jobFlow Volcano JobFlow shown in the details page.
 * @returns Section descriptor or `null` if no condition summaries exist.
 */
function getConditionsSection(jobFlow: VolcanoJobFlow) {
  const conditionEntries = Object.entries(jobFlow.status?.conditions || {});
  if (!conditionEntries.length) {
    return renderEmptySection(
      'Conditions',
      'No condition summaries have been reported for this JobFlow yet.'
    );
  }

  return {
    id: 'conditions',
    section: (
      <SectionBox title="Conditions">
        {conditionEntries.map(([jobName, condition]: [string, JobFlowConditionEntry]) => (
          <NameValueTable
            key={jobName}
            rows={[
              {
                name: 'Job',
                value: (
                  <Link
                    routeName="volcano-job-detail"
                    params={{ namespace: jobFlow.metadata.namespace, name: jobName }}
                  >
                    {jobName}
                  </Link>
                ),
              },
              { name: 'Phase', value: condition.phase || '-' },
              {
                name: 'Create Time',
                value: condition.createTime ? <DateLabel date={condition.createTime} /> : '-',
              },
              { name: 'Running Duration', value: condition.runningDuration || '-' },
              {
                name: 'Task Status Count',
                value: formatTaskStatusCounts(condition.taskStatusCount),
              },
            ]}
          />
        ))}
      </SectionBox>
    ),
  };
}

/**
 * Builds the running history section for generated Jobs in a JobFlow.
 *
 * @param jobFlow Volcano JobFlow shown in the details page.
 * @returns Section descriptor or `null` if no running history exists.
 */
function getRunningHistoriesSection(jobFlow: VolcanoJobFlow) {
  const histories = (jobFlow.status?.jobStatusList || []).flatMap(jobStatus =>
    (jobStatus.runningHistories || []).map(history => ({
      jobName: jobStatus.name || '-',
      state: history.state || '-',
      startTimestamp: history.startTimestamp || '-',
      endTimestamp: history.endTimestamp || '-',
    }))
  );

  if (!histories.length) {
    return renderEmptySection(
      'Running Histories',
      'No running history has been recorded for generated Jobs in this JobFlow yet.'
    );
  }

  return {
    id: 'running-histories',
    section: (
      <SectionBox title="Running Histories">
        <SimpleTable
          data={histories}
          columns={[
            {
              label: 'Job',
              getter: row => row.jobName,
            },
            {
              label: 'State',
              getter: row => row.state,
            },
            {
              label: 'Start',
              getter: row =>
                row.startTimestamp !== '-' ? <DateLabel date={row.startTimestamp} /> : '-',
            },
            {
              label: 'End',
              getter: row =>
                row.endTimestamp !== '-' ? <DateLabel date={row.endTimestamp} /> : '-',
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/**
 * Renders the Volcano JobFlow details page.
 *
 * @returns JobFlow details view with extra sections and events.
 */
export default function JobFlowDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <VolcanoFlowInstallCheck>
      <DetailsGrid
        resourceType={VolcanoJobFlow}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={(jobFlow: VolcanoJobFlow) =>
          jobFlow
            ? [
                {
                  name: 'Status',
                  value: (
                    <StatusLabel status={getJobFlowStatusColor(jobFlow.phase)}>
                      {jobFlow.phase}
                    </StatusLabel>
                  ),
                },
                { name: 'Job Retain Policy', value: jobFlow.jobRetainPolicy },
                { name: 'Flows', value: jobFlow.flowCount },
                { name: 'Generated Jobs', value: getJobFlowGeneratedJobCount(jobFlow) },
                { name: 'Pending Jobs', value: getJobFlowPhaseCount(jobFlow, ['Pending']) },
                { name: 'Running Jobs', value: getJobFlowPhaseCount(jobFlow, ['Running']) },
                { name: 'Failed Jobs', value: getJobFlowPhaseCount(jobFlow, ['Failed']) },
                {
                  name: 'Completed Jobs',
                  value: getJobFlowPhaseCount(jobFlow, ['Completed', 'Completing']),
                },
                {
                  name: 'Terminated Jobs',
                  value: getJobFlowPhaseCount(jobFlow, ['Terminated', 'Terminating']),
                },
                { name: 'Unknown Jobs', value: getJobFlowPhaseCount(jobFlow, ['Unknown']) },
              ]
            : []
        }
        extraSections={(jobFlow: VolcanoJobFlow) =>
          jobFlow &&
          [
            getFlowsSection(jobFlow),
            getConfiguredProbesSection(jobFlow),
            getGeneratedJobsSection(jobFlow),
            getConditionsSection(jobFlow),
            getRunningHistoriesSection(jobFlow),
          ].filter(Boolean)
        }
      />
    </VolcanoFlowInstallCheck>
  );
}

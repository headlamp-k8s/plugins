import {
  DetailsGrid,
  Link,
  NameValueTable,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { LifecyclePolicy, TaskSpec, VolcanoJob } from '../../resources/job';
import { VolcanoJobFlow } from '../../resources/jobflow';
import { VolcanoJobTemplate } from '../../resources/jobtemplate';
import { getJobFlowStatusColor, getJobStatusColor } from '../../utils/status';
import { VolcanoFlowInstallCheck } from '../common/CommonComponents';
import {
  formatStringList,
  getPolicyRows,
  getTaskContainerRows,
  getTaskRows,
} from '../jobs/detailRows';

const createdByJobTemplateLabel = 'volcano.sh/createdByJobTemplate';
const createdByJobFlowLabel = 'volcano.sh/createdByJobFlow';

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

/**
 * Builds the Tasks section for the JobTemplate details page.
 *
 * @param jobTemplate Volcano JobTemplate shown in the details page.
 * @returns Section descriptor for tasks or `null` if no tasks exist.
 */
function getTasksSection(jobTemplate: VolcanoJobTemplate) {
  if (!jobTemplate.spec.tasks?.length) {
    return null;
  }

  return {
    id: 'tasks',
    section: (
      <SectionBox title="Tasks">
        {jobTemplate.spec.tasks.map((task: TaskSpec, index) => (
          <SectionBox title={task.name || `Task ${index + 1}`} key={task.name || index}>
            <NameValueTable rows={getTaskRows(task, index)} />
            {(task.template?.spec?.containers || []).length > 0 ? (
              task.template?.spec?.containers?.map((container, containerIndex) => (
                <NameValueTable
                  key={`${task.name || index}-${container.name || containerIndex}`}
                  rows={getTaskContainerRows(container)}
                />
              ))
            ) : (
              <NameValueTable rows={[{ name: 'Containers', value: 'No containers defined' }]} />
            )}
          </SectionBox>
        ))}
      </SectionBox>
    ),
  };
}

function renderPolicies(title: string, policies?: LifecyclePolicy[]) {
  if (!policies?.length) {
    return null;
  }

  return (
    <SectionBox title={title}>
      {policies.map((policy, index) => (
        <NameValueTable
          key={`${policy.action || 'policy'}-${index}`}
          rows={getPolicyRows(policy)}
        />
      ))}
    </SectionBox>
  );
}

/**
 * Builds the Job-level policies section for a JobTemplate.
 *
 * @param jobTemplate Volcano JobTemplate shown in the details page.
 * @returns Section descriptor or `null` when no policies are defined.
 */
function getPoliciesSection(jobTemplate: VolcanoJobTemplate) {
  const section = renderPolicies('Policies', jobTemplate.spec.policies);
  if (!section) {
    return null;
  }

  return {
    id: 'policies',
    section,
  };
}

/**
 * Builds the Plugins section for a JobTemplate.
 *
 * @param jobTemplate Volcano JobTemplate shown in the details page.
 * @returns Section descriptor or `null` when no plugins are defined.
 */
function getPluginsSection(jobTemplate: VolcanoJobTemplate) {
  const plugins = jobTemplate.spec.plugins;
  if (!plugins || !Object.keys(plugins).length) {
    return null;
  }

  return {
    id: 'plugins',
    section: (
      <SectionBox title="Plugins">
        <NameValueTable
          rows={Object.entries(plugins).map(([name, argumentsList]) => ({
            name,
            value: formatStringList(argumentsList),
          }))}
        />
      </SectionBox>
    ),
  };
}

/**
 * Builds the Network Topology section for a JobTemplate.
 *
 * @param jobTemplate Volcano JobTemplate shown in the details page.
 * @returns Section descriptor or `null` when no topology settings are defined.
 */
function getNetworkTopologySection(jobTemplate: VolcanoJobTemplate) {
  const networkTopology = jobTemplate.spec.networkTopology;
  if (!networkTopology) {
    return null;
  }

  return {
    id: 'network-topology',
    section: (
      <SectionBox title="Network Topology">
        <NameValueTable
          rows={[
            { name: 'Mode', value: networkTopology.mode || '-' },
            { name: 'Highest Tier Allowed', value: networkTopology.highestTierAllowed ?? '-' },
          ]}
        />
      </SectionBox>
    ),
  };
}

/**
 * Builds the JobFlows section for a JobTemplate when it is referenced by one or more flows.
 *
 * @param jobTemplate Volcano JobTemplate shown in the details page.
 * @param jobFlows JobFlows listed in the same namespace.
 * @returns Section descriptor or `null` when the template is not referenced.
 */
function getReferencedBySection(
  jobTemplate: VolcanoJobTemplate,
  jobFlows: VolcanoJobFlow[] | null
) {
  const referencedBy = (jobFlows || []).flatMap(jobFlow =>
    (jobFlow.spec.flows || [])
      .filter(flow => flow.name === jobTemplate.metadata.name)
      .map(flow => ({
        jobFlow,
        dependsOn: flow.dependsOn?.targets?.join(', ') || '-',
      }))
  );

  if (!referencedBy.length) {
    return renderEmptySection(
      'Referenced By JobFlows',
      'This JobTemplate is not referenced by any JobFlow in this namespace yet.'
    );
  }

  return {
    id: 'referenced-by-jobflows',
    section: (
      <SectionBox title="Referenced By JobFlows">
        <SimpleTable
          data={referencedBy}
          columns={[
            {
              label: 'JobFlow',
              getter: row => (
                <Link
                  routeName="volcano-jobflow-detail"
                  params={{
                    namespace: row.jobFlow.metadata.namespace,
                    name: row.jobFlow.metadata.name,
                  }}
                >
                  {row.jobFlow.metadata.name}
                </Link>
              ),
            },
            {
              label: 'Status',
              getter: row => (
                <StatusLabel status={getJobFlowStatusColor(row.jobFlow.phase)}>
                  {row.jobFlow.phase}
                </StatusLabel>
              ),
            },
            {
              label: 'Depends On',
              getter: row => row.dependsOn,
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

function getGeneratedJobsSection(
  jobTemplate: VolcanoJobTemplate,
  generatedJobs: VolcanoJob[] | null
) {
  const generatedJobNames = jobTemplate.generatedJobNames;
  const generatedJobByName = new Map(
    (generatedJobs || []).map(job => [job.metadata.name, job] as const)
  );
  const rows = generatedJobNames.length
    ? generatedJobNames.map(jobName => ({
        name: jobName,
        job: generatedJobByName.get(jobName) || null,
      }))
    : (generatedJobs || []).map(job => ({ name: job.metadata.name, job }));

  if (!rows.length) {
    return renderEmptySection(
      'Generated Jobs',
      'No Jobs have been generated from this JobTemplate in this namespace yet.'
    );
  }

  return {
    id: 'generated-jobs',
    section: (
      <SectionBox title="Generated Jobs">
        <SimpleTable
          data={rows}
          columns={[
            {
              label: 'Job',
              getter: row => (row.job ? <Link kubeObject={row.job}>{row.name}</Link> : row.name),
            },
            {
              label: 'Status',
              getter: row =>
                row.job ? (
                  <StatusLabel status={getJobStatusColor(row.job.phase)}>
                    {row.job.phase}
                  </StatusLabel>
                ) : (
                  'Not found or deleted'
                ),
            },
            {
              label: 'JobFlow',
              getter: row => {
                const label = row.job?.metadata.labels?.[createdByJobFlowLabel];
                if (!label) {
                  return '-';
                }

                const [namespace, name] = label.split('.', 2);
                return namespace && name ? (
                  <Link routeName="volcano-jobflow-detail" params={{ namespace, name }}>
                    {name}
                  </Link>
                ) : (
                  label
                );
              },
            },
            {
              label: 'Retries',
              getter: row => row.job?.retryCount ?? '-',
            },
            {
              label: 'Running',
              getter: row => row.job?.runningCount ?? '-',
            },
            {
              label: 'Succeeded',
              getter: row => row.job?.succeededCount ?? '-',
            },
            {
              label: 'Failed',
              getter: row => row.job?.failedCount ?? '-',
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/**
 * Builds the Task Policies section for task-scoped lifecycle policies.
 *
 * @param jobTemplate Volcano JobTemplate shown in the details page.
 * @returns Section descriptor or `null` when no task policies are defined.
 */
function getTaskPoliciesSection(jobTemplate: VolcanoJobTemplate) {
  const taskPolicies = (jobTemplate.spec.tasks || []).filter(task => task.policies?.length);
  if (!taskPolicies.length) {
    return null;
  }

  return {
    id: 'task-policies',
    section: (
      <SectionBox title="Task Policies">
        {taskPolicies.map((task, index) => (
          <div key={task.name || index}>
            {renderPolicies(task.name || `Task ${index + 1}`, task.policies)}
          </div>
        ))}
      </SectionBox>
    ),
  };
}

/**
 * Renders the Volcano JobTemplate details page.
 *
 * @returns JobTemplate details view with extra sections and events.
 */
export default function JobTemplateDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const [jobFlows] = VolcanoJobFlow.useList({ namespace });
  const [generatedJobs] = VolcanoJob.useList({
    namespace,
    labelSelector:
      namespace && name ? `${createdByJobTemplateLabel}=${namespace}.${name}` : undefined,
  });

  return (
    <VolcanoFlowInstallCheck>
      <DetailsGrid
        resourceType={VolcanoJobTemplate}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={(jobTemplate: VolcanoJobTemplate) =>
          jobTemplate
            ? [
                {
                  name: 'Queue',
                  value: (
                    <Link routeName="volcano-queue-detail" params={{ name: jobTemplate.queue }}>
                      {jobTemplate.queue}
                    </Link>
                  ),
                },
                { name: 'Scheduler', value: jobTemplate.schedulerName },
                { name: 'Min Available', value: jobTemplate.minAvailable },
                { name: 'Min Success', value: jobTemplate.minSuccess },
                { name: 'Max Retry', value: jobTemplate.maxRetry },
                { name: 'Priority Class', value: jobTemplate.spec.priorityClassName || '-' },
                { name: 'Running Estimate', value: jobTemplate.spec.runningEstimate || '-' },
                { name: 'Generated Jobs', value: jobTemplate.generatedJobCount },
              ]
            : []
        }
        extraSections={(jobTemplate: VolcanoJobTemplate) =>
          jobTemplate &&
          [
            getTasksSection(jobTemplate),
            getPoliciesSection(jobTemplate),
            getTaskPoliciesSection(jobTemplate),
            getPluginsSection(jobTemplate),
            getNetworkTopologySection(jobTemplate),
            getReferencedBySection(jobTemplate, jobFlows),
            getGeneratedJobsSection(jobTemplate, generatedJobs),
          ].filter(Boolean)
        }
      />
    </VolcanoFlowInstallCheck>
  );
}

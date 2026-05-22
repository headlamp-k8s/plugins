import {
  DetailsGrid,
  EditButton,
  Link as HeadlampLink,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Alert, Stack } from '@mui/material';
import { useParams } from 'react-router-dom';
import { ClusterTrainingRuntimeClass, TrainingRuntimeClass } from '../../resources/trainingRuntime';
import { TrainJobClass } from '../../resources/trainJob';
import { KubeflowJsonViewerAction } from '../common/KubeflowJsonViewerAction';
import { SectionPage } from '../common/SectionPage';
import {
  getRelatedTrainJobsForRuntime,
  getRuntimeFamily,
  getRuntimeTemplateContainers,
  getSchedulingSummary,
} from './trainerUtils';
import { TrainJobStatusBadge } from './TrainJobStatusBadge';

function RuntimeWarnings({
  missingFramework,
  missingScheduling,
}: {
  missingFramework: boolean;
  missingScheduling: boolean;
}) {
  if (!missingFramework && !missingScheduling) {
    return null;
  }

  return (
    <Stack spacing={1}>
      {missingFramework && (
        <Alert severity="warning">
          Runtime is missing the `trainer.kubeflow.org/framework` label, so framework detection is
          best-effort only.
        </Alert>
      )}
      {missingScheduling && (
        <Alert severity="info">
          Runtime does not define a PodGroupPolicy. Multi-node TrainJobs based on this runtime may
          start without gang scheduling safeguards.
        </Alert>
      )}
    </Stack>
  );
}

function TrainingRuntimeDetailsContent<
  T extends typeof TrainingRuntimeClass | typeof ClusterTrainingRuntimeClass
>({
  resourceType,
  title,
  apiPath,
  name,
  namespace,
}: {
  resourceType: T;
  title: string;
  apiPath: string;
  name: string;
  namespace?: string;
}) {
  const [trainJobs] = TrainJobClass.useList(namespace ? { namespace } : undefined);

  return (
    <SectionPage title={title} apiPath={apiPath}>
      <DetailsGrid
        resourceType={resourceType}
        name={name}
        namespace={namespace}
        withEvents
        actions={item =>
          item && [
            {
              id: 'kubeflow.runtime-json',
              action: (
                <KubeflowJsonViewerAction
                  title="View Raw JSON"
                  value={item.jsonData}
                  activityId={[
                    'json-runtime',
                    item.kind ??
                      (item instanceof TrainingRuntimeClass
                        ? 'TrainingRuntime'
                        : 'ClusterTrainingRuntime'),
                    item.metadata.namespace,
                    item.metadata.name,
                  ]
                    .filter(Boolean)
                    .join('-')}
                />
              ),
            },
            {
              id: 'kubeflow.runtime-edit',
              action: <EditButton item={item} />,
            },
          ]
        }
        extraInfo={item =>
          item && [
            {
              name: 'Scope',
              value: item instanceof TrainingRuntimeClass ? 'Namespace' : 'Cluster',
            },
            {
              name: 'Framework',
              value: getRuntimeFamily(item),
            },
            {
              name: 'Default Nodes',
              value: item.defaultNumNodes ?? '-',
            },
            {
              name: 'Scheduling',
              value: getSchedulingSummary(item),
            },
            {
              name: 'Template Jobs',
              value: item.templateJobCount,
            },
          ]
        }
        extraSections={item => {
          if (!item) {
            return [];
          }

          const relatedJobs = getRelatedTrainJobsForRuntime(item, trainJobs ?? []);
          const templateContainers = getRuntimeTemplateContainers(item);

          return [
            {
              id: 'runtime-warnings',
              section: (
                <RuntimeWarnings
                  missingFramework={!item.framework}
                  missingScheduling={!item.schedulingMode}
                />
              ),
            },
            {
              id: 'runtime-ml-policy',
              section: (
                <SectionBox title="MLPolicy">
                  <NameValueTable
                    rows={[
                      { name: 'Family', value: getRuntimeFamily(item) },
                      { name: 'Default Nodes', value: item.defaultNumNodes ?? '-' },
                      {
                        name: 'Torch NumProcPerNode',
                        value: item.mlPolicy.torch?.numProcPerNode ?? '-',
                      },
                      {
                        name: 'MPI NumProcPerNode',
                        value: item.mlPolicy.mpi?.numProcPerNode ?? '-',
                      },
                      {
                        name: 'MPI Implementation',
                        value: item.mlPolicy.mpi?.mpiImplementation ?? '-',
                      },
                      {
                        name: 'Flux NumProcPerNode',
                        value: item.mlPolicy.flux?.numProcPerNode ?? '-',
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
            {
              id: 'runtime-scheduling',
              section: (
                <SectionBox title="PodGroupPolicy">
                  <NameValueTable
                    rows={[
                      { name: 'Scheduling Mode', value: getSchedulingSummary(item) },
                      {
                        name: 'Coscheduling Timeout',
                        value: item.podGroupPolicy.coscheduling?.scheduleTimeoutSeconds ?? '-',
                      },
                      {
                        name: 'Volcano Queue',
                        value: item.podGroupPolicy.volcano?.queue ?? '-',
                      },
                      {
                        name: 'Volcano PriorityClass',
                        value: item.podGroupPolicy.volcano?.priorityClassName ?? '-',
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
            {
              id: 'runtime-template',
              section: (
                <SectionBox title="Job Template">
                  <NameValueTable
                    rows={[
                      { name: 'Replicated Jobs', value: item.templateJobCount },
                      {
                        name: 'Containers',
                        value: templateContainers.length > 0 ? templateContainers.join(', ') : '-',
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
            {
              id: 'related-trainjobs',
              section: (
                <SectionBox
                  title={
                    item instanceof TrainingRuntimeClass
                      ? 'Related TrainJobs in Namespace'
                      : 'Related TrainJobs Across Namespaces'
                  }
                >
                  <SimpleTable
                    data={relatedJobs}
                    columns={[
                      {
                        label: 'Name',
                        getter: (job: TrainJobClass) => (
                          <HeadlampLink
                            routeName="kubeflow-training-trainjobs-detail"
                            params={{ namespace: job.metadata.namespace, name: job.metadata.name }}
                          >
                            {job.metadata.name}
                          </HeadlampLink>
                        ),
                      },
                      {
                        label: 'Namespace',
                        getter: (job: TrainJobClass) => job.metadata.namespace || '-',
                      },
                      {
                        label: 'Status',
                        getter: (job: TrainJobClass) => <TrainJobStatusBadge job={job} />,
                      },
                      { label: 'Managed By', getter: (job: TrainJobClass) => job.managedBy || '-' },
                    ]}
                    emptyMessage="No TrainJobs reference this runtime."
                  />
                </SectionBox>
              ),
            },
          ];
        }}
      />
    </SectionPage>
  );
}

/**
 * Renders the detail page for a namespace-scoped TrainingRuntime.
 */
export function TrainingRuntimesDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  return (
    <TrainingRuntimeDetailsContent
      resourceType={TrainingRuntimeClass}
      title="TrainingRuntime Detail"
      apiPath="/apis/trainer.kubeflow.org/v1alpha1/trainingruntimes"
      name={name as string}
      namespace={namespace}
    />
  );
}

/**
 * Renders the detail page for a cluster-scoped ClusterTrainingRuntime.
 */
export function ClusterTrainingRuntimesDetail(props: { name?: string }) {
  const params = useParams<{ name: string }>();
  const { name = params.name } = props;

  return (
    <TrainingRuntimeDetailsContent
      resourceType={ClusterTrainingRuntimeClass}
      title="ClusterTrainingRuntime Detail"
      apiPath="/apis/trainer.kubeflow.org/v1alpha1/clustertrainingruntimes"
      name={name as string}
    />
  );
}

import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
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
  const { t } = useTranslation();
  if (!missingFramework && !missingScheduling) {
    return null;
  }

  return (
    <Stack spacing={1}>
      {missingFramework && (
        <Alert severity="warning">
          {t(
            'Runtime is missing the `trainer.kubeflow.org/framework` label, so framework detection is best-effort only.'
          )}
        </Alert>
      )}
      {missingScheduling && (
        <Alert severity="info">
          {t(
            'Runtime does not define a PodGroupPolicy. Multi-node TrainJobs based on this runtime may start without gang scheduling safeguards.'
          )}
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
  const { t } = useTranslation();
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
                  title={t('View Raw JSON')}
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
              name: t('Scope'),
              value: item instanceof TrainingRuntimeClass ? t('Namespace') : t('Cluster'),
            },
            {
              name: t('Framework'),
              value: getRuntimeFamily(item),
            },
            {
              name: t('Default Nodes'),
              value: item.defaultNumNodes ?? '-',
            },
            {
              name: t('Scheduling'),
              value: getSchedulingSummary(item, t),
            },
            {
              name: t('Template Jobs'),
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
                <SectionBox title={t('MLPolicy')}>
                  <NameValueTable
                    rows={[
                      { name: t('Family'), value: getRuntimeFamily(item) },
                      { name: t('Default Nodes'), value: item.defaultNumNodes ?? '-' },
                      {
                        name: t('Torch NumProcPerNode'),
                        value: item.mlPolicy.torch?.numProcPerNode ?? '-',
                      },
                      {
                        name: t('MPI NumProcPerNode'),
                        value: item.mlPolicy.mpi?.numProcPerNode ?? '-',
                      },
                      {
                        name: t('MPI Implementation'),
                        value: item.mlPolicy.mpi?.mpiImplementation ?? '-',
                      },
                      {
                        name: t('Flux NumProcPerNode'),
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
                <SectionBox title={t('PodGroupPolicy')}>
                  <NameValueTable
                    rows={[
                      { name: t('Scheduling Mode'), value: getSchedulingSummary(item, t) },
                      {
                        name: t('Coscheduling Timeout'),
                        value: item.podGroupPolicy.coscheduling?.scheduleTimeoutSeconds ?? '-',
                      },
                      {
                        name: t('Volcano Queue'),
                        value: item.podGroupPolicy.volcano?.queue ?? '-',
                      },
                      {
                        name: t('Volcano PriorityClass'),
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
                <SectionBox title={t('Job Template')}>
                  <NameValueTable
                    rows={[
                      { name: t('Replicated Jobs'), value: item.templateJobCount },
                      {
                        name: t('Containers'),
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
                      ? t('Related TrainJobs in Namespace')
                      : t('Related TrainJobs Across Namespaces')
                  }
                >
                  <SimpleTable
                    data={relatedJobs}
                    columns={[
                      {
                        label: t('Name'),
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
                        label: t('Namespace'),
                        getter: (job: TrainJobClass) => job.metadata.namespace || '-',
                      },
                      {
                        label: t('Status'),
                        getter: (job: TrainJobClass) => <TrainJobStatusBadge job={job} />,
                      },
                      {
                        label: t('Managed By'),
                        getter: (job: TrainJobClass) => job.managedBy || '-',
                      },
                    ]}
                    emptyMessage={t('No TrainJobs reference this runtime.')}
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
  const { t } = useTranslation();
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  return (
    <TrainingRuntimeDetailsContent
      resourceType={TrainingRuntimeClass}
      title={t('TrainingRuntime Detail')}
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
  const { t } = useTranslation();
  const params = useParams<{ name: string }>();
  const { name = params.name } = props;

  return (
    <TrainingRuntimeDetailsContent
      resourceType={ClusterTrainingRuntimeClass}
      title={t('ClusterTrainingRuntime Detail')}
      apiPath="/apis/trainer.kubeflow.org/v1alpha1/clustertrainingruntimes"
      name={name as string}
    />
  );
}

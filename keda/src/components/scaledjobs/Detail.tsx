import { K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  ConditionsSection,
  DetailsGrid,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { ScaledJob } from '../../resources/scaledjob';
import {
  ContainersSection,
  JobsListRenderer,
  KedaInstallCheck,
  TriggersSection,
} from '../common/CommonComponents';
import { isPaused, PauseScalingAction, ResumeScalingAction } from '../common/ScalingActions';

export interface OwnedJobsSectionProps {
  scaledJob?: ScaledJob;
  hideColumns?: string[];
  /**
   * Hides the namespace selector
   */
  noSearch?: boolean;
}

export function OwnedJobsSection(props: OwnedJobsSectionProps) {
  const { scaledJob, hideColumns, noSearch } = props;

  const { items: jobs, errors } = K8s.ResourceClasses.Job.useList({
    namespace: scaledJob?.metadata?.namespace,
    labelSelector: `scaledjob.keda.sh/name=${scaledJob?.metadata?.name}`,
  });

  const onlyOneNamespace = !!scaledJob?.metadata?.namespace;
  const hideNamespaceFilter = onlyOneNamespace || noSearch;

  return (
    <JobsListRenderer
      hideColumns={
        hideColumns.length > 0 ? hideColumns : onlyOneNamespace ? ['namespace'] : undefined
      }
      jobs={jobs}
      errors={errors}
      noNamespaceFilter={hideNamespaceFilter}
    />
  );
}

export function ScaledJobDetail(props: { namespace?: string; name?: string }) {
  const { t } = useTranslation();
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  return (
    <KedaInstallCheck>
      <DetailsGrid
        resourceType={ScaledJob}
        name={name}
        namespace={namespace}
        withEvents
        actions={item =>
          item
            ? [
                ...(!isPaused(item)
                  ? [{ id: 'keda.pause-scaling', action: <PauseScalingAction resource={item} /> }]
                  : []),
                ...(isPaused(item)
                  ? [
                      {
                        id: 'keda.resume-scaling',
                        action: <ResumeScalingAction resource={item} />,
                      },
                    ]
                  : []),
              ]
            : []
        }
        extraInfo={item =>
          item && [
            {
              name: t('API Version'),
              value: ScaledJob.apiVersion,
            },
            {
              name: t('Kind'),
              value: ScaledJob.kind,
            },
            {
              name: t('Polling Interval'),
              value: `${item.pollingInterval}s`,
            },
            {
              name: t('Successful Jobs History Limit'),
              value: item.successfulJobsHistoryLimit,
            },
            {
              name: t('Failed Jobs History Limit'),
              value: item.failedJobsHistoryLimit,
            },
            {
              name: t('Minimum Replica Count'),
              value: item.minReplicaCount,
            },
            {
              name: t('Maximum Replica Count'),
              value: item.maxReplicaCount,
            },
            {
              name: t('Env Source Container Name'),
              value: item.envSourceContainerName || '-',
            },
          ]
        }
        extraSections={item =>
          item && [
            {
              id: 'job-target-reference',
              section: (
                <SectionBox title={t('Job Target Reference')}>
                  <NameValueTable
                    rows={[
                      {
                        name: t('Parallelism'),
                        value: item.jobTargetParallelism,
                      },
                      {
                        name: t('Completions'),
                        value: item.jobTargetCompletions,
                      },
                      {
                        name: t('Active Deadline Seconds'),
                        value: item.jobTargetActiveDeadlineSeconds ?? '-',
                      },
                      {
                        name: t('Backoff Limit'),
                        value: item.jobTargetBackoffLimit,
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
            {
              id: 'containers',
              section: <ContainersSection resource={item?.jsonData} />,
            },
            {
              id: 'owned-jobs',
              section: <OwnedJobsSection scaledJob={item} hideColumns={['containers', 'images']} />,
            },
            {
              id: 'rollout-strategy',
              section: (
                <SectionBox title={t('Rollout Strategy')}>
                  <NameValueTable
                    rows={[
                      {
                        name: t('Strategy'),
                        value: item.rolloutStrategy,
                      },
                      {
                        name: t('Propagation Policy'),
                        value: item.rolloutPropagationPolicy,
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
            {
              id: 'scaling-strategy',
              section: (
                <SectionBox title={t('Scaling Strategy')}>
                  <NameValueTable
                    rows={[
                      {
                        name: t('Strategy'),
                        value: item.scalingStrategy,
                      },
                      {
                        name: t('Custom Scaling Queue Length Deduction'),
                        value: item.scalingStrategyCustomScalingQueueLengthDeduction ?? '-',
                      },
                      {
                        name: t('Custom Scaling Running Job Percentage'),
                        value: item.scalingStrategyCustomScalingRunningJobPercentage ?? '-',
                      },
                      {
                        name: t('Pending Pod Conditions'),
                        value:
                          item.scalingStrategyPendingPodConditions.length > 0
                            ? item.scalingStrategyPendingPodConditions.join(', ')
                            : '-',
                      },
                      {
                        name: t('Multiple Scalers Calculation'),
                        value: item.scalingStrategyMultipleScalersCalculation,
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
            {
              id: 'triggers',
              section: <TriggersSection resource={item} />,
            },
            {
              id: 'conditions',
              section: <ConditionsSection resource={item?.jsonData} />,
            },
          ]
        }
      />
    </KedaInstallCheck>
  );
}

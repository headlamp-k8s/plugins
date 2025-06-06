import {
  ConditionsSection,
  DetailsGrid,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Job from '@kinvolk/headlamp-plugin/lib/k8s/job';
import { useParams } from 'react-router-dom';
import { useKedaInstalled } from '../../hooks/useKedaInstalled';
import { ScaledJob } from '../../resources/scaledjob';
import {
  ContainersSection,
  JobsListRenderer,
  NotInstalledBanner,
  TriggersSection,
} from '../common/CommonComponents';

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

  const { items: jobs, errors } = Job.useList({
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
  const { isKedaInstalled, isKedaCheckLoading } = useKedaInstalled();
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  return (
    <>
      {isKedaInstalled ? (
        <DetailsGrid
          resourceType={ScaledJob}
          name={name}
          namespace={namespace}
          withEvents
          extraInfo={item =>
            item && [
              {
                name: 'API Version',
                value: ScaledJob.apiVersion,
              },
              {
                name: 'Kind',
                value: ScaledJob.kind,
              },
              {
                name: 'Polling Interval',
                value: `${item.pollingInterval}s`,
              },
              {
                name: 'Successful Jobs History Limit',
                value: item.successfulJobsHistoryLimit,
              },
              {
                name: 'Failed Jobs History Limit',
                value: item.failedJobsHistoryLimit,
              },
              {
                name: 'Minimum Replica Count',
                value: item.minReplicaCount,
              },
              {
                name: 'Maximum Replica Count',
                value: item.maxReplicaCount,
              },
              {
                name: 'Env Source Container Name',
                value: item.envSourceContainerName || '-',
              },
            ]
          }
          extraSections={item =>
            item && [
              {
                id: 'job-target-reference',
                section: (
                  <SectionBox title="Job Target Reference">
                    <NameValueTable
                      rows={[
                        {
                          name: 'Parallelism',
                          value: item.jobTargetParallelism,
                        },
                        {
                          name: 'Completions',
                          value: item.jobTargetCompletions,
                        },
                        {
                          name: 'Active Deadline Seconds',
                          value: item.jobTargetActiveDeadlineSeconds ?? '-',
                        },
                        {
                          name: 'Backoff Limit',
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
                section: (
                  <OwnedJobsSection scaledJob={item} hideColumns={['containers', 'images']} />
                ),
              },
              {
                id: 'rollout-strategy',
                section: (
                  <SectionBox title="Rollout Strategy">
                    <NameValueTable
                      rows={[
                        {
                          name: 'Strategy',
                          value: item.rolloutStrategy,
                        },
                        {
                          name: 'Propagation Policy',
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
                  <SectionBox title="Scaling Strategy">
                    <NameValueTable
                      rows={[
                        {
                          name: 'Strategy',
                          value: item.scalingStrategy,
                        },
                        {
                          name: 'Custom Scaling Queue Length Deduction',
                          value: item.scalingStrategyCustomScalingQueueLengthDeduction ?? '-',
                        },
                        {
                          name: 'Custom Scaling Running Job Percentage',
                          value: item.scalingStrategyCustomScalingRunningJobPercentage ?? '-',
                        },
                        {
                          name: 'Pending Pod Conditions',
                          value:
                            item.scalingStrategyPendingPodConditions.length > 0
                              ? item.scalingStrategyPendingPodConditions.join(', ')
                              : '-',
                        },
                        {
                          name: 'Multiple Scalers Calculation',
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
      ) : (
        <NotInstalledBanner isLoading={isKedaCheckLoading} />
      )}
    </>
  );
}

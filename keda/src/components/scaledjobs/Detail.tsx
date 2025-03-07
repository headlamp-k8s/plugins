import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  ConditionsSection,
  DetailsGrid,
  Link,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { JobsListRendererProps } from '@kinvolk/headlamp-plugin/lib/components/job/List';
import Job from '@kinvolk/headlamp-plugin/lib/k8s/job';
import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/KubeObject';
import { useParams } from 'react-router-dom';
import { useKedaInstalled } from '../../hooks/useKedaInstalled';
import { ScaledJob } from '../../resources/scaledjob';
import { TriggerAuthentication } from '../../resources/triggerAuthentication';
import {
  ContainersSection,
  JobsListRenderer,
  NotInstalledBanner,
} from '../common/CommonComponents';

export interface OwnedJobsSectionProps {
  resource: KubeObjectInterface;
  hideColumns?: JobsListRendererProps['hideColumns'];
  /**
   * Hides the namespace selector
   */
  noSearch?: boolean;
}

export function ScaledJobDetail() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();
  const { isKedaInstalled, isKedaCheckLoading } = useKedaInstalled();
  const [jobs, error] = K8s.ResourceClasses.Job.useList();

  function OwnedJobsSection(props: OwnedJobsSectionProps) {
    const { resource, hideColumns, noSearch } = props;
    const jobsList = jobs || [];

    const ownedJobs = jobsList.filter((job: Job) => {
      const ownerRefs = job.metadata?.ownerReferences || [];
      return ownerRefs.some(
        owner =>
          owner.apiVersion === 'keda.sh/v1alpha1' &&
          owner.kind === ScaledJob.kind &&
          owner.name === name &&
          owner.controller &&
          owner.blockOwnerDeletion
      );
    });

    const onlyOneNamespace = !!resource.metadata.namespace || resource.kind === 'Namespace';
    const hideNamespaceFilter = onlyOneNamespace || noSearch;

    return (
      <JobsListRenderer
        hideColumns={hideColumns || onlyOneNamespace ? ['namespace'] : undefined}
        jobs={ownedJobs}
        error={error}
        noNamespaceFilter={hideNamespaceFilter}
      />
    );
  }

  return (
    <>
      {isKedaInstalled ? (
        <DetailsGrid
          resourceType={ScaledJob}
          name={name}
          withEvents
          namespace={namespace}
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
                id: 'conditions',
                section: <ConditionsSection resource={item?.jsonData} />,
              },
              {
                id: 'job-target-ref',
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
                    <OwnedJobsSection resource={item?.jsonData} />
                    <ContainersSection resource={item?.jsonData} />
                  </SectionBox>
                ),
              },
              {
                id: 'rollout',
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
                section: (
                  <SectionBox title="Triggers">
                    {item.spec.triggers.map((trigger, index) => (
                      <div key={index}>
                        <h2>{`Trigger ${index + 1} (${trigger.type})`}</h2>
                        <NameValueTable
                          rows={[
                            {
                              name: 'Type',
                              value: trigger.type,
                            },
                            {
                              name: 'Metadata',
                              value: (
                                <NameValueTable
                                  rows={Object.entries(trigger.metadata).map(([key, value]) => ({
                                    name: key,
                                    value: value,
                                  }))}
                                />
                              ),
                            },
                            {
                              name: 'Authentication Ref',
                              value: trigger.authenticationRef ? (
                                <Link
                                  routeName={
                                    trigger.authenticationRef.kind || TriggerAuthentication.kind
                                  }
                                  params={{
                                    name: trigger.authenticationRef.name,
                                    namespace: item.metadata.namespace,
                                  }}
                                >
                                  {trigger.authenticationRef.kind || TriggerAuthentication.kind}/
                                  {trigger.authenticationRef.name}
                                </Link>
                              ) : (
                                'None'
                              ),
                            },
                          ]}
                        />
                      </div>
                    ))}
                  </SectionBox>
                ),
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

import {
  ActionButton,
  ConditionsTable,
  DetailsGrid,
  Link as HeadlampLink,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { KatibExperimentClass, KatibParameterSpec } from '../../resources/katibExperiment';
import { KatibTrialClass } from '../../resources/katibTrial';
import {
  formatKatibFeasibleSpace,
  getKatibConditionStatus,
  getKatibRelatedTrials,
  getKatibTrialMetricValue,
} from '../common/katibUtils';
import { KubeflowJsonViewerAction } from '../common/KubeflowJsonViewerAction';
import { launchKatibTrialLogs } from '../common/KubeflowLogsViewer';
import { KubeflowStatusBadge } from '../common/KubeflowStatusBadge';
import { SectionPage } from '../common/SectionPage';
import { KatibRbacSection } from './KatibRbacSection';

export function KatibExperimentsDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;
  const [trials] = KatibTrialClass.useList();
  const trialList = trials ?? [];

  return (
    <SectionPage title="Katib Experiment Detail" apiPath="/apis/kubeflow.org/v1beta1/experiments">
      <DetailsGrid
        resourceType={KatibExperimentClass}
        name={name as string}
        namespace={namespace}
        withEvents
        actions={item =>
          item && [
            {
              id: 'kubeflow.katib-experiment-json',
              action: (
                <KubeflowJsonViewerAction
                  title="View Raw JSON"
                  value={item.jsonData}
                  activityId={`json-katib-experiment-${item.metadata.namespace}-${item.metadata.name}`}
                />
              ),
            },
          ]
        }
        extraInfo={item =>
          item && [
            {
              name: 'Algorithm',
              value: item.algorithmName || '-',
            },
            {
              name: 'Status',
              value: (
                <KubeflowStatusBadge statusInfo={getKatibConditionStatus(item.latestCondition)} />
              ),
            },
            {
              name: 'Objective Metric',
              value: item.objectiveMetricName || '-',
            },
            {
              name: 'Objective Type',
              value: item.objectiveType || '-',
            },
            {
              name: 'Objective Goal',
              value: item.objectiveGoal || '-',
            },
            {
              name: 'Parallel Trial Count',
              value: item.spec.parallelTrialCount ?? '-',
            },
            {
              name: 'Search Space',
              value: item.searchSpaceSize,
            },
            {
              name: 'Max Trial Count',
              value: item.spec.maxTrialCount ?? '-',
            },
            {
              name: 'Current Trial Count',
              value: item.status.currentTrialCount ?? '-',
            },
            {
              name: 'Succeeded Trials',
              value: item.status.succeededTrialCount ?? 0,
            },
            {
              name: 'Failed Trials',
              value: item.status.failedTrialCount ?? 0,
            },
            {
              name: 'Early Stopping',
              value: item.earlyStoppingEnabled ? item.earlyStoppingAlgorithm : 'Disabled',
            },
          ]
        }
        extraSections={item => {
          if (!item) {
            return [];
          }

          const relatedTrials = getKatibRelatedTrials(item, trialList);
          const optimalMetrics = item.status.currentOptimalTrial?.observation?.metrics ?? [];
          const optimalParams = item.status.currentOptimalTrial?.parameterAssignments ?? [];
          return [
            ...(relatedTrials.length > 0
              ? [
                  {
                    id: 'trials',
                    section: (
                      <SectionBox title="Trials">
                        <SimpleTable
                          data={relatedTrials}
                          columns={[
                            {
                              label: 'Name',
                              getter: (trial: KatibTrialClass) => (
                                <HeadlampLink
                                  routeName="kubeflow-katib-trials-detail"
                                  params={{
                                    namespace: trial.metadata.namespace,
                                    name: trial.metadata.name,
                                  }}
                                >
                                  {trial.metadata.name}
                                </HeadlampLink>
                              ),
                            },
                            {
                              label: 'Status',
                              getter: (trial: KatibTrialClass) => {
                                return (
                                  <KubeflowStatusBadge
                                    statusInfo={getKatibConditionStatus(trial.latestCondition)}
                                  />
                                );
                              },
                            },
                            {
                              label: item.objectiveMetricName || 'Metric',
                              getter: (trial: KatibTrialClass) =>
                                getKatibTrialMetricValue(trial, item.objectiveMetricName),
                            },
                            {
                              label: 'Start Time',
                              getter: (trial: KatibTrialClass) => trial.startTime || '-',
                            },
                            {
                              label: 'End Time',
                              getter: (trial: KatibTrialClass) => trial.completionTime || '-',
                            },
                            {
                              label: 'Reason',
                              getter: (trial: KatibTrialClass) => trial.failureReason || '-',
                            },
                            {
                              label: 'Logs',
                              getter: (trial: KatibTrialClass) => (
                                <ActionButton
                                  description="View Worker Logs"
                                  icon="mdi:text-box-outline"
                                  onClick={() =>
                                    launchKatibTrialLogs({
                                      trialName: trial.metadata.name,
                                      namespace: trial.metadata.namespace,
                                      cluster: trial.cluster,
                                    })
                                  }
                                />
                              ),
                            },
                          ]}
                          emptyMessage="No trials found for this experiment."
                        />
                      </SectionBox>
                    ),
                  },
                ]
              : []),
            ...(optimalMetrics.length > 0
              ? [
                  {
                    id: 'best-metrics',
                    section: (
                      <SectionBox title="Current Optimal Trial Metrics">
                        <NameValueTable
                          rows={optimalMetrics.map(metric => ({
                            name: metric.name ?? 'metric',
                            value: metric.value ?? '-',
                          }))}
                        />
                      </SectionBox>
                    ),
                  },
                ]
              : []),
            ...(optimalParams.length > 0
              ? [
                  {
                    id: 'best-params',
                    section: (
                      <SectionBox title="Current Optimal Trial Parameters">
                        <NameValueTable
                          rows={optimalParams.map(param => ({
                            name: param.name ?? 'param',
                            value: param.value ?? '-',
                          }))}
                        />
                      </SectionBox>
                    ),
                  },
                ]
              : []),
            ...(item.parameters.length > 0
              ? [
                  {
                    id: 'search-space',
                    section: (
                      <SectionBox title="Search Space">
                        <SimpleTable
                          data={item.parameters}
                          columns={[
                            {
                              label: 'Parameter',
                              getter: (parameter: KatibParameterSpec) => parameter.name ?? '-',
                            },
                            {
                              label: 'Type',
                              getter: (parameter: KatibParameterSpec) =>
                                parameter.parameterType ?? '-',
                            },
                            {
                              label: 'Feasible Space',
                              getter: formatKatibFeasibleSpace,
                            },
                          ]}
                        />
                      </SectionBox>
                    ),
                  },
                ]
              : []),
            {
              id: 'trial-template',
              section: (
                <SectionBox title="Trial Template & Worker">
                  <NameValueTable
                    rows={[
                      { name: 'Worker Kind', value: item.trialWorkerKind || '-' },
                      { name: 'Worker API Version', value: item.trialWorkerApiVersion || '-' },
                      { name: 'Primary Container', value: item.primaryContainerName || '-' },
                      { name: 'Service Account', value: item.trialServiceAccountName || 'default' },
                    ]}
                  />
                </SectionBox>
              ),
            },
            {
              id: 'early-stopping',
              section: (
                <SectionBox title="Early Stopping">
                  <NameValueTable
                    rows={[
                      {
                        name: 'Enabled',
                        value: item.earlyStoppingEnabled ? 'Yes' : 'No',
                      },
                      {
                        name: 'Algorithm',
                        value: item.earlyStoppingAlgorithm || '-',
                      },
                      {
                        name: 'Stopped Early',
                        value: relatedTrials.filter(
                          trial => trial.latestCondition?.type === 'EarlyStopped'
                        ).length,
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
            {
              id: 'rbac',
              section: <KatibRbacSection experiment={item} />,
            },
            ...(item.conditions.length > 0
              ? [
                  {
                    id: 'conditions',
                    section: (
                      <SectionBox title="Conditions">
                        <ConditionsTable resource={item.jsonData} />
                      </SectionBox>
                    ),
                  },
                ]
              : []),
          ];
        }}
      />
    </SectionPage>
  );
}

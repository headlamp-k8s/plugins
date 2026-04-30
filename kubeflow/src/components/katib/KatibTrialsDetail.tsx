import {
  ActionButton,
  ConditionsTable,
  DetailsGrid,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { KatibTrialClass } from '../../resources/katibTrial';
import { KubeflowJsonViewerAction } from '../common/KubeflowJsonViewerAction';
import { launchKatibTrialLogs } from '../common/KubeflowLogsViewer';
import { SectionPage } from '../common/SectionPage';

/**
 * Renders the Katib Trial detail view with metrics, conditions, and raw JSON access.
 */
export function KatibTrialsDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  return (
    <SectionPage title="Katib Trial Detail" apiPath="/apis/kubeflow.org/v1beta1/trials">
      <DetailsGrid
        resourceType={KatibTrialClass}
        name={name as string}
        namespace={namespace}
        withEvents
        actions={item =>
          item && [
            {
              id: 'kubeflow.katib-trial-logs',
              action: (
                <ActionButton
                  description="View Worker Logs"
                  icon="mdi:text-box-outline"
                  onClick={() =>
                    launchKatibTrialLogs({
                      trialName: item.metadata.name,
                      namespace: item.metadata.namespace,
                      cluster: item.cluster,
                    })
                  }
                />
              ),
            },
            {
              id: 'kubeflow.katib-trial-json',
              action: (
                <KubeflowJsonViewerAction
                  title="View Raw JSON"
                  value={item.jsonData}
                  activityId={`json-katib-trial-${item.metadata.namespace}-${item.metadata.name}`}
                />
              ),
            },
          ]
        }
        extraInfo={item =>
          item && [
            { name: 'Experiment', value: item.ownerExperiment || '-' },
            { name: 'Objective Metric', value: item.spec.objective?.objectiveMetricName || '-' },
            { name: 'Objective Type', value: item.spec.objective?.type || '-' },
            { name: 'Objective Goal', value: item.spec.objective?.goal ?? '-' },
            { name: 'Metric Result', value: item.objectiveMetricValue || '-' },
            { name: 'Start Time', value: item.startTime || '-' },
            { name: 'End Time', value: item.completionTime || '-' },
            { name: 'Reason', value: item.failureReason || '-' },
          ]
        }
        extraSections={item => {
          if (!item) return [];
          const metrics = item.status.observation?.metrics ?? [];

          return [
            ...(metrics.length > 0
              ? [
                  {
                    id: 'metrics',
                    section: (
                      <SectionBox title="Observed Metrics">
                        <NameValueTable
                          rows={metrics.map(metric => ({
                            name: metric.name ?? 'metric',
                            value: metric.value ?? '-',
                          }))}
                        />
                      </SectionBox>
                    ),
                  },
                ]
              : []),
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

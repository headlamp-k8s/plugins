import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  ActionButton,
  ConditionsTable,
  DateLabel,
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
  const { t } = useTranslation();
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  return (
    <SectionPage title={t('Katib Trial Detail')} apiPath="/apis/kubeflow.org/v1beta1/trials">
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
                  description={t('View Worker Logs')}
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
                  title={t('View Raw JSON')}
                  value={item.jsonData}
                  activityId={`json-katib-trial-${item.metadata.namespace}-${item.metadata.name}`}
                />
              ),
            },
          ]
        }
        extraInfo={item =>
          item && [
            { name: t('Experiment'), value: item.ownerExperiment || '-' },
            { name: t('Objective Metric'), value: item.spec.objective?.objectiveMetricName || '-' },
            { name: t('Objective Type'), value: item.spec.objective?.type || '-' },
            { name: t('Objective Goal'), value: item.spec.objective?.goal ?? '-' },
            { name: t('Metric Result'), value: item.objectiveMetricValue || '-' },
            { name: t('Start Time'), value: <DateLabel date={item.startTime} /> },
            { name: t('End Time'), value: <DateLabel date={item.completionTime} /> },
            { name: t('Reason'), value: item.failureReason || '-' },
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
                      <SectionBox title={t('Observed Metrics')}>
                        <NameValueTable
                          rows={metrics.map(metric => ({
                            name: metric.name ?? t('metric'),
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
                      <SectionBox title={t('Conditions')}>
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

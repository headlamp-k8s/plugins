import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  ConditionsTable,
  DetailsGrid,
  HoverInfoLabel,
  Link as HeadlampLink,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Typography from '@mui/material/Typography';
import cronstrue from 'cronstrue/i18n';
import yaml from 'js-yaml';
import React from 'react';
import { useParams } from 'react-router-dom';
import {
  ScheduledSparkApplicationClass,
  SparkApplicationClass,
} from '../../resources/sparkApplication';
import { KubeflowDiffViewerAction } from '../common/KubeflowDiffViewerAction';
import { KubeflowJsonViewerAction } from '../common/KubeflowJsonViewerAction';
import { ScheduledSparkApplicationStatusBadge } from '../common/ScheduledSparkApplicationStatusBadge';
import { SectionPage } from '../common/SectionPage';
import { SparkApplicationStatusBadge } from '../common/SparkApplicationStatusBadge';
import { SparkApplicationTypeBadge } from '../common/SparkApplicationTypeBadge';
import {
  getLastAppliedScheduledSparkTemplate,
  getScheduledSparkApplicationRuns,
} from '../common/sparkUtils';

/**
 * Detail view for a ScheduledSparkApplication.
 * Displays scheduling configuration, template spec, and recent runs history.
 */

export function ScheduledSparkApplicationsDetail(props: { namespace?: string; name?: string }) {
  const { t, i18n } = useTranslation();
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;
  const [sparkApplications] = SparkApplicationClass.useList({ namespace });

  return (
    <SectionPage
      title={t('Scheduled Spark Application Detail')}
      apiPath="/apis/sparkoperator.k8s.io/v1beta2"
    >
      <DetailsGrid
        resourceType={ScheduledSparkApplicationClass}
        name={name as string}
        namespace={namespace}
        withEvents
        actions={item => {
          if (!item) {
            return [];
          }

          const lastAppliedTemplate = getLastAppliedScheduledSparkTemplate(item);

          return [
            {
              id: 'kubeflow.scheduled-spark-raw-json',
              action: (
                <KubeflowJsonViewerAction
                  title={t('View Raw JSON')}
                  value={item.jsonData}
                  activityId={`json-scheduled-spark-${item.metadata.namespace}-${item.metadata.name}`}
                />
              ),
            },
            {
              id: 'kubeflow.scheduled-spark-raw-yaml',
              action: (
                <KubeflowJsonViewerAction
                  title={t('View Raw YAML')}
                  value={yaml.dump(item.jsonData)}
                  language="yaml"
                  activityId={`yaml-scheduled-spark-${item.metadata.namespace}-${item.metadata.name}`}
                />
              ),
            },
            ...(lastAppliedTemplate
              ? [
                  {
                    id: 'kubeflow.scheduled-spark-last-applied-diff',
                    action: (
                      <KubeflowDiffViewerAction
                        title={t('Compare Live vs Last Applied Template')}
                        original={yaml.dump(lastAppliedTemplate)}
                        modified={yaml.dump(item.template)}
                        originalLabel={t('Last Applied Template')}
                        modifiedLabel={t('Live Template')}
                        activityId={`diff-scheduled-spark-${item.metadata.namespace}-${item.metadata.name}`}
                      />
                    ),
                  },
                ]
              : []),
          ];
        }}
        extraInfo={item =>
          item && [
            {
              name: t('Status'),
              value: <ScheduledSparkApplicationStatusBadge scheduledSparkApplication={item} />,
            },
            {
              name: t('Schedule'),
              value: (() => {
                const schedule = item.schedule;
                if (!schedule) return '-';
                let described = '';
                try {
                  described = cronstrue.toString(schedule, { locale: i18n.language });
                } catch (e) {
                  console.debug(`Could not describe cron "${schedule}":`, e);
                }
                return <HoverInfoLabel label={schedule} hoverInfo={described} />;
              })(),
            },
            {
              name: t('Concurrency Policy'),
              value: item.concurrencyPolicy || '-',
            },
            {
              name: t('Suspend'),
              value: item.suspend ? t('Yes') : t('No'),
            },
            {
              name: t('Template Type'),
              value: <SparkApplicationTypeBadge type={item.template.type} />,
            },
            {
              name: t('Template Mode'),
              value: item.template.mode || '-',
            },
            {
              name: t('Template Spark Version'),
              value: item.template.sparkVersion || '-',
            },
            {
              name: t('Last Run Name'),
              value: item.lastRunName || '-',
            },
            {
              name: t('Last Run'),
              value: item.lastRun || '-',
            },
            {
              name: t('Next Run'),
              value: item.nextRun || '-',
            },
          ]
        }
        extraSections={item => {
          if (!item) {
            return [];
          }

          const relatedRuns = getScheduledSparkApplicationRuns(sparkApplications ?? [], item);
          const lastAppliedTemplate = getLastAppliedScheduledSparkTemplate(item);

          return [
            {
              id: 'scheduled-spark-schedule',
              section: (
                <SectionBox title={t('Schedule Configuration')}>
                  <NameValueTable
                    rows={[
                      {
                        name: t('Schedule'),
                        value: (() => {
                          const schedule = item.schedule;
                          if (!schedule) return '-';
                          let described = '';
                          try {
                            described = cronstrue.toString(schedule, { locale: i18n.language });
                          } catch (e) {
                            console.debug(`Could not describe cron "${schedule}":`, e);
                          }
                          return <HoverInfoLabel label={schedule} hoverInfo={described} />;
                        })(),
                      },
                      {
                        name: t('Concurrency Policy'),
                        value: item.concurrencyPolicy || '-',
                      },
                      {
                        name: t('Successful History Limit'),
                        value: item.spec.successfulRunHistoryLimit ?? '-',
                      },
                      {
                        name: t('Failed History Limit'),
                        value: item.spec.failedRunHistoryLimit ?? '-',
                      },
                      {
                        name: t('Schedule State'),
                        value: item.scheduleState || '-',
                      },
                      {
                        name: t('Reason'),
                        value: item.scheduleReason || '-',
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
            {
              id: 'scheduled-spark-template',
              section: (
                <SectionBox title={t('Template SparkApplication Spec')}>
                  <NameValueTable
                    rows={[
                      {
                        name: t('Image'),
                        value: item.template.image || '-',
                      },
                      {
                        name: t('Spark Version'),
                        value: item.template.sparkVersion || '-',
                      },
                      {
                        name: t('Mode'),
                        value: item.template.mode || '-',
                      },
                      {
                        name: t('Main File'),
                        value: item.template.mainApplicationFile || '-',
                      },
                      {
                        name: t('Main Class'),
                        value: item.template.mainClass || '-',
                      },
                      {
                        name: t('Service Account'),
                        value: item.template.driver?.serviceAccount || t('default'),
                      },
                      {
                        name: t('Driver CPU/Memory'),
                        value: `${item.template.driver?.cores || '-'} / ${
                          item.template.driver?.memory || '-'
                        }`,
                      },
                      {
                        name: t('Executor Instances'),
                        value: item.template.executor?.instances ?? '-',
                      },
                      {
                        name: t('Executor CPU/Memory'),
                        value: `${item.template.executor?.cores || '-'} / ${
                          item.template.executor?.memory || '-'
                        }`,
                      },
                      {
                        name: t('Arguments'),
                        value: item.template.arguments?.join(' ') || '-',
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
            {
              id: 'scheduled-spark-runs',
              section: (
                <SectionBox title={t('Recent Spawned SparkApplications')}>
                  {relatedRuns.length > 0 ? (
                    <SimpleTable
                      data={relatedRuns}
                      columns={[
                        {
                          label: t('Name'),
                          getter: run => (
                            <HeadlampLink
                              route={SparkApplicationClass.detailsRoute.replace(
                                ':namespace/:name',
                                `${run.metadata.namespace}/${run.metadata.name}`
                              )}
                            >
                              {run.metadata.name}
                            </HeadlampLink>
                          ),
                        },
                        {
                          label: t('Status'),
                          getter: run => <SparkApplicationStatusBadge sparkApplication={run} />,
                        },
                        {
                          label: t('Driver'),
                          getter: run => run.driverPodName || '-',
                        },
                        {
                          label: t('Age'),
                          getter: run => run.metadata.creationTimestamp || '-',
                        },
                      ]}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {t('No SparkApplication runs are currently linked to this schedule.')}
                    </Typography>
                  )}
                </SectionBox>
              ),
            },
            {
              id: 'scheduled-spark-advanced',
              section: (
                <SectionBox title={t('Advanced')}>
                  <NameValueTable
                    rows={[
                      {
                        name: t('Last Applied Template Diff Available'),
                        value: lastAppliedTemplate ? t('Yes') : t('No'),
                      },
                      {
                        name: t('Past Successful Runs'),
                        value: item.status.pastSuccessfulRunNames?.join(', ') || '-',
                      },
                      {
                        name: t('Past Failed Runs'),
                        value: item.status.pastFailedRunNames?.join(', ') || '-',
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
            {
              id: 'scheduled-spark-conditions',
              section: (item.jsonData.status as any)?.conditions?.length > 0 && (
                <SectionBox title={t('Conditions')}>
                  <ConditionsTable resource={item.jsonData} />
                </SectionBox>
              ),
            },
          ];
        }}
      />
    </SectionPage>
  );
}

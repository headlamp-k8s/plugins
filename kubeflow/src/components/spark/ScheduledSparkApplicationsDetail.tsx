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
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;
  const { i18n } = useTranslation();
  const [sparkApplications] = SparkApplicationClass.useList({ namespace });

  return (
    <SectionPage
      title="Scheduled Spark Application Detail"
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
                  title="View Raw JSON"
                  value={item.jsonData}
                  activityId={`json-scheduled-spark-${item.metadata.namespace}-${item.metadata.name}`}
                />
              ),
            },
            {
              id: 'kubeflow.scheduled-spark-raw-yaml',
              action: (
                <KubeflowJsonViewerAction
                  title="View Raw YAML"
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
                        title="Compare Live vs Last Applied Template"
                        original={yaml.dump(lastAppliedTemplate)}
                        modified={yaml.dump(item.template)}
                        originalLabel="Last Applied Template"
                        modifiedLabel="Live Template"
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
              name: 'Status',
              value: <ScheduledSparkApplicationStatusBadge scheduledSparkApplication={item} />,
            },
            {
              name: 'Schedule',
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
              name: 'Concurrency Policy',
              value: item.concurrencyPolicy || '-',
            },
            {
              name: 'Suspend',
              value: item.suspend ? 'Yes' : 'No',
            },
            {
              name: 'Template Type',
              value: <SparkApplicationTypeBadge type={item.template.type} />,
            },
            {
              name: 'Template Mode',
              value: item.template.mode || '-',
            },
            {
              name: 'Template Spark Version',
              value: item.template.sparkVersion || '-',
            },
            {
              name: 'Last Run Name',
              value: item.lastRunName || '-',
            },
            {
              name: 'Last Run',
              value: item.lastRun || '-',
            },
            {
              name: 'Next Run',
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
                <SectionBox title="Schedule Configuration">
                  <NameValueTable
                    rows={[
                      {
                        name: 'Schedule',
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
                        name: 'Concurrency Policy',
                        value: item.concurrencyPolicy || '-',
                      },
                      {
                        name: 'Successful History Limit',
                        value: item.spec.successfulRunHistoryLimit ?? '-',
                      },
                      {
                        name: 'Failed History Limit',
                        value: item.spec.failedRunHistoryLimit ?? '-',
                      },
                      {
                        name: 'Schedule State',
                        value: item.scheduleState || '-',
                      },
                      {
                        name: 'Reason',
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
                <SectionBox title="Template SparkApplication Spec">
                  <NameValueTable
                    rows={[
                      {
                        name: 'Image',
                        value: item.template.image || '-',
                      },
                      {
                        name: 'Spark Version',
                        value: item.template.sparkVersion || '-',
                      },
                      {
                        name: 'Mode',
                        value: item.template.mode || '-',
                      },
                      {
                        name: 'Main File',
                        value: item.template.mainApplicationFile || '-',
                      },
                      {
                        name: 'Main Class',
                        value: item.template.mainClass || '-',
                      },
                      {
                        name: 'Service Account',
                        value: item.template.driver?.serviceAccount || 'default',
                      },
                      {
                        name: 'Driver CPU/Memory',
                        value: `${item.template.driver?.cores || '-'} / ${
                          item.template.driver?.memory || '-'
                        }`,
                      },
                      {
                        name: 'Executor Instances',
                        value: item.template.executor?.instances ?? '-',
                      },
                      {
                        name: 'Executor CPU/Memory',
                        value: `${item.template.executor?.cores || '-'} / ${
                          item.template.executor?.memory || '-'
                        }`,
                      },
                      {
                        name: 'Arguments',
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
                <SectionBox title="Recent Spawned SparkApplications">
                  {relatedRuns.length > 0 ? (
                    <SimpleTable
                      data={relatedRuns}
                      columns={[
                        {
                          label: 'Name',
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
                          label: 'Status',
                          getter: run => <SparkApplicationStatusBadge sparkApplication={run} />,
                        },
                        {
                          label: 'Driver',
                          getter: run => run.driverPodName || '-',
                        },
                        {
                          label: 'Age',
                          getter: run => run.metadata.creationTimestamp || '-',
                        },
                      ]}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No SparkApplication runs are currently linked to this schedule.
                    </Typography>
                  )}
                </SectionBox>
              ),
            },
            {
              id: 'scheduled-spark-advanced',
              section: (
                <SectionBox title="Advanced">
                  <NameValueTable
                    rows={[
                      {
                        name: 'Last Applied Template Diff Available',
                        value: lastAppliedTemplate ? 'Yes' : 'No',
                      },
                      {
                        name: 'Past Successful Runs',
                        value: item.status.pastSuccessfulRunNames?.join(', ') || '-',
                      },
                      {
                        name: 'Past Failed Runs',
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
                <SectionBox title="Conditions">
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

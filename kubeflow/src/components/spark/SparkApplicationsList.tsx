import { Icon } from '@iconify/react';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { LightTooltip, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import React from 'react';
import { SparkApplicationClass } from '../../resources/sparkApplication';
import { launchPodLogs } from '../common/KubeflowLogsViewer';
import { SectionPage } from '../common/SectionPage';
import { SparkApplicationStatusBadge } from '../common/SparkApplicationStatusBadge';
import { SparkApplicationTypeBadge } from '../common/SparkApplicationTypeBadge';
import { getSparkExecutorSummary } from '../common/sparkUtils';

/**
 * List view for SparkApplications.
 * Displays a table of spark jobs with their type, status, and driver/executor info.
 */
export function SparkApplicationsList() {
  const { t } = useTranslation();

  return (
    <SectionPage title={t('Spark Applications')} apiPath="/apis/sparkoperator.k8s.io/v1beta2">
      <ResourceListView
        title={t('Spark Applications')}
        resourceClass={SparkApplicationClass}
        enableRowActions
        actions={[
          {
            id: 'kubeflow.spark-driver-logs',
            action: ({
              item,
              closeMenu,
            }: {
              item: SparkApplicationClass;
              closeMenu: () => void;
            }) => {
              const driverPodName = item.driverPodName;

              return (
                <MenuItem
                  disabled={!driverPodName}
                  onClick={() => {
                    closeMenu();
                    if (!driverPodName) {
                      return;
                    }

                    launchPodLogs({
                      podName: driverPodName,
                      namespace: item.metadata.namespace,
                      cluster: item.cluster,
                      title: t('Driver Logs: {{name}}', { name: item.metadata.name }),
                    });
                  }}
                >
                  <ListItemIcon>
                    <Icon icon="mdi:text-box-outline" width={20} />
                  </ListItemIcon>
                  <ListItemText>{t('View Driver Logs')}</ListItemText>
                </MenuItem>
              );
            },
          },
        ]}
        columns={[
          'name',
          'namespace',
          {
            id: 'type',
            label: t('Type'),
            getValue: (item: SparkApplicationClass) => item.applicationType || '-',
            render: (item: SparkApplicationClass) => (
              <SparkApplicationTypeBadge type={item.applicationType} />
            ),
          },
          {
            id: 'mode',
            label: t('Mode'),
            getValue: (item: SparkApplicationClass) => item.mode || '-',
          },
          {
            id: 'spark-version',
            label: t('Spark Version'),
            getValue: (item: SparkApplicationClass) => item.sparkVersion || '-',
          },
          {
            id: 'driver-pod',
            label: t('Driver'),
            getValue: (item: SparkApplicationClass) => item.driverPodName || '-',
            render: (item: SparkApplicationClass) => {
              const driverPodName = item.driverPodName;
              if (!driverPodName) {
                return <>-</>;
              }

              return (
                <LightTooltip title={driverPodName} interactive>
                  <span>{driverPodName}</span>
                </LightTooltip>
              );
            },
          },
          {
            id: 'executors',
            label: t('Executors'),
            getValue: (item: SparkApplicationClass) => getSparkExecutorSummary(item),
          },
          {
            id: 'attempts',
            label: t('Attempts'),
            getValue: (item: SparkApplicationClass) => item.submissionAttempts || 0,
          },
          {
            id: 'status',
            label: t('Status'),
            getValue: (item: SparkApplicationClass) => item.applicationStateLabel || t('Pending'),
            render: (item: SparkApplicationClass) => (
              <SparkApplicationStatusBadge sparkApplication={item} />
            ),
          },
          {
            id: 'start',
            label: t('Start'),
            getValue: (item: SparkApplicationClass) => item.lastSubmissionAttemptTime || '-',
          },
          {
            id: 'finish',
            label: t('Finish'),
            getValue: (item: SparkApplicationClass) => item.terminationTime || '-',
          },
          'age',
        ]}
      />
    </SectionPage>
  );
}

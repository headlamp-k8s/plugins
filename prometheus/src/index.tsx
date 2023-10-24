import {
  DefaultDetailsViewSection,
  DetailsViewSectionProps,
  registerDetailsViewSectionsProcessor,
  registerDetailsViewHeaderActionsProcessor
} from '@kinvolk/headlamp-plugin/lib';
import { GenericMetricsChart, usePluginSettings } from './common';
import { Tooltip } from '@material-ui/core';
import ToggleButton from '@material-ui/lab/ToggleButton';
import { Icon } from '@iconify/react';
import React from 'react';

function PrometheusMetrics(resource: DetailsViewSectionProps) {
  if (resource.kind === 'Pod' || resource.kind === 'Job' || resource.kind === 'CronJob') {
    return (
      <GenericMetricsChart
        cpuQuery={`sum(rate(container_cpu_usage_seconds_total{container!='',namespace='${resource.jsonData.metadata.namespace}',pod='${resource.jsonData.metadata.name}'}[1m])) by (pod,namespace)`}
        memoryQuery={`sum(container_memory_working_set_bytes{namespace='${resource.jsonData.metadata.namespace}',pod=~'${resource.jsonData.metadata.name}'}) by (pod,namespace)`}
        networkRxQuery={`sum(rate(container_network_receive_bytes_total{namespace='${resource.jsonData.metadata.namespace}',pod='${resource.jsonData.metadata.name}'}[1m])) by (pod,namespace)`}
        networkTxQuery={`sum(rate(container_network_transmit_bytes_total{namespace='${resource.jsonData.metadata.namespace}',pod='${resource.jsonData.metadata.name}'}[1m])) by (pod,namespace)`}
        filesystemReadQuery={`sum(rate(container_fs_reads_bytes_total{namespace='${resource.jsonData.metadata.namespace}',pod='${resource.jsonData.metadata.name}'}[1m])) by (pod,namespace)`}
        filesystemWriteQuery={`sum(rate(container_fs_writes_bytes_total{namespace='${resource.jsonData.metadata.namespace}',pod='${resource.jsonData.metadata.name}'}[1m])) by (pod,namespace)`}
      />
    );
  }
  if (
    resource.kind === 'Deployment' ||
    resource.kind === 'StatefulSet' ||
    resource.kind === 'DaemonSet' ||
    resource.kind === 'ReplicaSet'
  ) {
    return (
      <GenericMetricsChart
        cpuQuery={`sum(rate(container_cpu_usage_seconds_total{container!='',namespace='${resource.jsonData.metadata.namespace}',pod=~'${resource.jsonData.metadata.name}-.*'}[1m])) by (pod,namespace)`}
        memoryQuery={`sum(container_memory_working_set_bytes{namespace='${resource.jsonData.metadata.namespace}',pod=~'${resource.jsonData.metadata.name}-.*'}) by (pod,namespace)`}
        networkRxQuery={`sum(rate(container_network_receive_bytes_total{namespace='${resource.jsonData.metadata.namespace}',pod=~'${resource.jsonData.metadata.name}-.*'}[1m])) by (pod,namespace)`}
        networkTxQuery={`sum(rate(container_network_transmit_bytes_total{namespace='${resource.jsonData.metadata.namespace}',pod=~'${resource.jsonData.metadata.name}-.*'}[1m])) by (pod,namespace)`}
        filesystemReadQuery={`sum(rate(container_fs_reads_bytes_total{namespace='${resource.jsonData.metadata.namespace}',pod=~'${resource.jsonData.metadata.name}-.*'}[1m])) by (pod,namespace)`}
        filesystemWriteQuery={`sum(rate(container_fs_writes_bytes_total{namespace='${resource.jsonData.metadata.namespace}',pod=~'${resource.jsonData.metadata.name}-.*'}[1m])) by (pod,namespace)`}
      />
    );
  }
}

registerDetailsViewSectionsProcessor(function addSubheaderSection(resource, sections) {
  // Ignore if there is no resource.
  if (!resource) {
    return sections;
  }

  const prometheusSection = 'prom_metrics';
  if (sections.findIndex(section => section.id === prometheusSection) !== -1) {
    return sections;
  }

  const detailsHeaderIdx = sections.findIndex(
    section => section.id === DefaultDetailsViewSection.MAIN_HEADER
  );
  // There is no header, so we do nothing.
  if (detailsHeaderIdx === -1) {
    return sections;
  }

  // We place our custom section after the header.
  sections.splice(detailsHeaderIdx + 1, 0, {
    id: prometheusSection,
    section: PrometheusMetrics(resource),
  });

  return sections;
});

function VisibilityButton() {
  const pluginSettings = usePluginSettings();

  const [description, icon] = React.useMemo(() => {
    if (pluginSettings.isVisible) {
      return ['Hide Prometheus metrics', 'mdi:chart-box-outline'];
    }
    return ['Show Prometheus metrics', 'mdi:chart-box'];
  },
  [pluginSettings]);

  return (
    <Tooltip title={description}>
      <ToggleButton
        aria-label={"description"}
        onClick={() => pluginSettings.setIsVisible(visible => !visible)}
        selected={pluginSettings.isVisible}
        size="small"
      >
        <Icon icon={icon} width="24px" />
      </ToggleButton>
    </Tooltip>
  );
}

registerDetailsViewHeaderActionsProcessor(function addPrometheusMetricsButton(resource, actions) {
  // Ignore if there is no resource.
  if (!resource) {
    return actions;
  }

  const prometheusAction = 'prom_metrics';
  // If the action is already there, we do nothing.
  if (actions.findIndex(action => action.id === prometheusAction) !== -1) {
    return actions;
  }

  actions.splice(0, 0,
    {
      id: prometheusAction,
      action: (
        <VisibilityButton />
      ),
    });

  return actions;
});
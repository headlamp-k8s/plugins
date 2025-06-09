import {
  DefaultDetailsViewSection,
  DetailsViewSectionProps,
  registerDetailsViewHeaderActionsProcessor,
  registerDetailsViewSectionsProcessor,
  registerPluginSettings,
} from '@kinvolk/headlamp-plugin/lib';
import { DiskMetricsChart } from './components/Chart/DiskMetricsChart/DiskMetricsChart';
import { GenericMetricsChart } from './components/Chart/GenericMetricsChart/GenericMetricsChart';
import { KedaChart } from './components/Chart/KedaChart/KedaChart';
import { Settings } from './components/Settings/Settings';
import { VisibilityButton } from './components/VisibilityButton/VisibilityButton';
import { ChartEnabledKinds, PLUGIN_NAME } from './util';

function PrometheusMetrics(resource: DetailsViewSectionProps) {
  if (resource.kind === 'Pod' || resource.kind === 'Job' || resource.kind === 'CronJob') {
    return (
      <GenericMetricsChart
        cpuQuery={`sum(rate(container_cpu_usage_seconds_total{container!='',namespace='${resource.jsonData.metadata.namespace}',pod='${resource.jsonData.metadata.name}'}[1m])) by (pod,namespace)`}
        memoryQuery={`sum(container_memory_working_set_bytes{container!='',namespace='${resource.jsonData.metadata.namespace}',pod=~'${resource.jsonData.metadata.name}'}) by (pod,namespace)`}
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

  if (resource.kind === 'PersistentVolumeClaim') {
    return (
      <DiskMetricsChart
        usageQuery={`sum(kubelet_volume_stats_used_bytes{namespace='${resource.jsonData.metadata.namespace}',persistentvolumeclaim='${resource.jsonData.metadata.name}'}) by (persistentvolumeclaim, namespace)`}
        capacityQuery={`sum(kubelet_volume_stats_capacity_bytes{namespace='${resource.jsonData.metadata.namespace}',persistentvolumeclaim='${resource.jsonData.metadata.name}'}) by (persistentvolumeclaim, namespace)`}
      />
    );
  }

  if (resource.kind === 'ScaledObject') {
    const namespace = resource.jsonData.metadata.namespace;
    const name = resource.jsonData.metadata.name;
    const hpaName = resource.jsonData.status.hpaName;
    const defaultMinReplicaCount = 0; // https://keda.sh/docs/latest/reference/scaledobject-spec/#minreplicacount
    const defaultMaxReplicaCount = 100; // https://keda.sh/docs/latest/reference/scaledobject-spec/#maxreplicacount

    return (
      <KedaChart
        scalerMetricsQuery={`keda_scaler_metrics_value{exported_namespace='${namespace}',scaledObject='${name}',type='scaledobject'}`}
        hpaReplicasQuery={`kube_horizontalpodautoscaler_status_current_replicas{namespace='${namespace}',horizontalpodautoscaler='${hpaName}'}`}
        minReplicaCount={resource.jsonData.spec.minReplicaCount ?? defaultMinReplicaCount}
        maxReplicaCount={resource.jsonData.spec.maxReplicaCount ?? defaultMaxReplicaCount}
      />
    );
  }

  if (resource.kind === 'ScaledJob') {
    const namespace = resource.jsonData.metadata.namespace;
    const name = resource.jsonData.metadata.name;
    const defaultMinReplicaCount = 0; // https://keda.sh/docs/latest/reference/scaledjob-spec/#minreplicacount
    const defaultMaxReplicaCount = 100; // https://keda.sh/docs/latest/reference/scaledjob-spec/#maxreplicacount

    return (
      <KedaChart
        scalerMetricsQuery={`keda_scaler_metrics_value{exported_namespace='${namespace}',scaledObject='${name}',type='scaledjob'}`}
        activeJobsQuery={`sum(kube_job_status_active{namespace='${namespace}',job_name=~"${name}-.*"})`}
        minReplicaCount={resource.jsonData.spec.minReplicaCount ?? defaultMinReplicaCount}
        maxReplicaCount={resource.jsonData.spec.maxReplicaCount ?? defaultMaxReplicaCount}
      />
    );
  }
}

registerPluginSettings(PLUGIN_NAME, Settings, true);

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

  // If the action is not supposed to be added, we do nothing.
  if (!ChartEnabledKinds.includes(resource?.jsonData?.kind)) {
    return actions;
  }

  actions.splice(0, 0, {
    id: prometheusAction,
    action: <VisibilityButton resource={resource} />,
  });

  return actions;
});

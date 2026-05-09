import type { StatusLabelProps } from '@kinvolk/headlamp-plugin/lib/components/common';
import type {
  ScheduledSparkApplication,
  ScheduledSparkApplicationClass,
  SparkApplication,
  SparkApplicationClass,
  SparkApplicationSpec,
} from '../../resources/sparkApplication';
import type { KubeflowStatusBadgeInfo } from './KubeflowStatusBadge';
import type { KubeflowTypeBadgeInfo } from './KubeflowTypeBadge';
import { parseCpuQuantity, parseMemoryQuantity } from './notebookUtils';

export interface SparkPodRow {
  name: string;
  role: 'Driver' | 'Executor';
  phase: string;
  restartCount: number;
  nodeName: string;
  podIP: string;
  rawPod?: any;
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(part => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeSparkStateLabel(state: string | undefined): string {
  if (!state) {
    return 'Pending';
  }

  return toTitleCase(state.replace(/_/g, ' '));
}

function getSparkStateStatus(state: string | undefined): StatusLabelProps['status'] {
  const normalizedState = (state ?? '').toUpperCase();

  if (
    normalizedState.includes('FAILED') ||
    normalizedState.includes('INVALID') ||
    normalizedState.includes('UNKNOWN')
  ) {
    return 'error';
  }

  if (
    normalizedState.includes('RUNNING') ||
    normalizedState.includes('COMPLETED') ||
    normalizedState.includes('SUCCEEDED')
  ) {
    return 'success';
  }

  if (normalizedState.includes('SUSPEND')) {
    return 'warning';
  }

  return '';
}

function getSparkStateIcon(state: string | undefined): string {
  const normalizedState = (state ?? '').toUpperCase();

  if (normalizedState.includes('FAILED') || normalizedState.includes('INVALID')) {
    return 'mdi:alert-circle';
  }

  if (normalizedState.includes('COMPLETED') || normalizedState.includes('SUCCEEDED')) {
    return 'mdi:check-circle';
  }

  if (normalizedState.includes('RUNNING')) {
    return 'mdi:play-circle';
  }

  if (normalizedState.includes('SUSPEND')) {
    return 'mdi:pause-circle';
  }

  return 'mdi:clock-outline';
}

/**
 * Derives the rendered health badge metadata for a SparkApplication.
 */
export function getSparkApplicationStatus(
  sparkApplication: SparkApplication | SparkApplicationClass | null | undefined
): KubeflowStatusBadgeInfo {
  const state = sparkApplication?.status?.applicationState?.state;
  const errorMessage = sparkApplication?.status?.applicationState?.errorMessage;

  return {
    label: normalizeSparkStateLabel(state),
    status: getSparkStateStatus(state),
    icon: getSparkStateIcon(state),
    reason: errorMessage || null,
  };
}

/**
 * Derives the rendered status badge metadata for a ScheduledSparkApplication.
 */
export function getScheduledSparkApplicationStatus(
  scheduledSparkApplication:
    | ScheduledSparkApplication
    | ScheduledSparkApplicationClass
    | null
    | undefined
): KubeflowStatusBadgeInfo {
  if (scheduledSparkApplication?.spec?.suspend) {
    return {
      label: 'Suspended',
      status: 'warning',
      icon: 'mdi:pause-circle',
      reason: scheduledSparkApplication?.status?.reason || null,
    };
  }

  const state = scheduledSparkApplication?.status?.scheduleState || 'Scheduled';
  return {
    label: normalizeSparkStateLabel(state),
    status: getSparkStateStatus(state),
    icon: getSparkStateIcon(state),
    reason: scheduledSparkApplication?.status?.reason || null,
  };
}

/**
 * Derives the rendered type badge metadata for a SparkApplication type.
 */
export function getSparkApplicationType(type: string | undefined | null): KubeflowTypeBadgeInfo {
  const normalizedType = (type ?? '').toLowerCase();

  if (normalizedType === 'python') {
    return { label: 'Python', icon: 'mdi:language-python', color: 'info' };
  }

  if (normalizedType === 'scala') {
    return { label: 'Scala', icon: 'mdi:alpha-s-circle-outline', color: 'warning' };
  }

  if (normalizedType === 'java') {
    return { label: 'Java', icon: 'mdi:language-java', color: 'secondary' };
  }

  if (normalizedType === 'r') {
    return { label: 'R', icon: 'mdi:language-r', color: 'success' };
  }

  return { label: type || 'Unknown', icon: 'mdi:flash', color: 'default' };
}

/**
 * Returns a compact executor summary string for list/detail UIs.
 */
export function getSparkExecutorSummary(
  sparkApplication: SparkApplication | SparkApplicationClass | null | undefined
): string {
  const desired = sparkApplication?.spec?.executor?.instances;
  const observed = Object.keys(sparkApplication?.status?.executorState ?? {}).length;

  if (desired === undefined || desired === null) {
    return observed > 0 ? `${observed}` : '-';
  }

  if (observed === 0) {
    return `${desired}`;
  }

  return `${observed}/${desired}`;
}

/**
 * Parses the conventional kubectl last-applied annotation into an object.
 */
export function parseLastAppliedConfiguration(
  annotations: Record<string, string> | undefined
): Record<string, unknown> | null {
  const rawValue = annotations?.['kubectl.kubernetes.io/last-applied-configuration'];
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as Record<string, unknown>;
  } catch (error) {
    return null;
  }
}

/**
 * Returns the previous declarative spec for a SparkApplication when available.
 */
export function getLastAppliedSparkSpec(
  sparkApplication: SparkApplication | SparkApplicationClass | null | undefined
): SparkApplicationSpec | null {
  const lastApplied = parseLastAppliedConfiguration(sparkApplication?.metadata?.annotations);
  return (lastApplied?.spec as SparkApplicationSpec | undefined) ?? null;
}

/**
 * Returns the previous declarative template spec for a ScheduledSparkApplication when available.
 */
export function getLastAppliedScheduledSparkTemplate(
  scheduledSparkApplication:
    | ScheduledSparkApplication
    | ScheduledSparkApplicationClass
    | null
    | undefined
): SparkApplicationSpec | null {
  const lastApplied = parseLastAppliedConfiguration(
    scheduledSparkApplication?.metadata?.annotations
  );
  const spec = lastApplied?.spec as { template?: SparkApplicationSpec } | undefined;
  return spec?.template ?? null;
}

function isSparkPodForApplication(
  pod: any,
  sparkApplication: SparkApplication | SparkApplicationClass
): boolean {
  const podLabels = pod?.metadata?.labels ?? {};
  const podName = pod?.metadata?.name;
  const appName = sparkApplication.metadata?.name;
  const driverPodName = sparkApplication.status?.driverInfo?.podName;
  const executorPods = Object.keys(sparkApplication.status?.executorState ?? {});

  return (
    podLabels['sparkoperator.k8s.io/app-name'] === appName ||
    podLabels['spark-app-name'] === appName ||
    podName === driverPodName ||
    executorPods.includes(podName)
  );
}

/**
 * Normalizes related Spark driver/executor pods for topology and logs sections.
 */
export function getSparkPodRows(
  pods: any[],
  sparkApplication: SparkApplication | SparkApplicationClass | null | undefined
): SparkPodRow[] {
  if (!sparkApplication) {
    return [];
  }

  const filteredPods = pods.filter(pod => isSparkPodForApplication(pod, sparkApplication));
  const podMap = new Map(filteredPods.map(pod => [pod.metadata?.name, pod]));
  const driverPodName = sparkApplication.status?.driverInfo?.podName;
  const executorState = sparkApplication.status?.executorState ?? {};
  const orderedNames = [
    ...(driverPodName ? [driverPodName] : []),
    ...Object.keys(executorState).sort((left, right) => left.localeCompare(right)),
    ...filteredPods
      .map(pod => pod.metadata?.name)
      .filter((name: string | undefined): name is string => !!name)
      .sort((left, right) => left.localeCompare(right)),
  ];

  return [...new Set(orderedNames)].map(name => {
    const pod = podMap.get(name);
    const role =
      name === driverPodName || pod?.metadata?.labels?.['spark-role'] === 'driver'
        ? 'Driver'
        : 'Executor';
    const phase =
      pod?.status?.phase ??
      (role === 'Executor'
        ? executorState[name]
        : sparkApplication.status?.applicationState?.state) ??
      'Unknown';
    const restartCount = (pod?.status?.containerStatuses ?? []).reduce(
      (total: number, containerStatus: any) => total + (containerStatus?.restartCount ?? 0),
      0
    );

    return {
      name,
      role,
      phase,
      restartCount,
      nodeName: pod?.spec?.nodeName ?? '-',
      podIP: pod?.status?.podIP ?? '-',
      rawPod: pod,
    };
  });
}

/**
 * Returns the spawned SparkApplications associated with a ScheduledSparkApplication.
 */
export function getScheduledSparkApplicationRuns(
  sparkApplications: Array<SparkApplication | SparkApplicationClass>,
  scheduledSparkApplication:
    | ScheduledSparkApplication
    | ScheduledSparkApplicationClass
    | null
    | undefined
): Array<SparkApplication | SparkApplicationClass> {
  if (!scheduledSparkApplication) {
    return [];
  }

  const scheduleName = scheduledSparkApplication.metadata?.name;
  const scheduleUid = scheduledSparkApplication.metadata?.uid;

  return sparkApplications
    .filter(application =>
      (application.metadata.ownerReferences ?? []).some(
        reference =>
          reference.kind === 'ScheduledSparkApplication' &&
          reference.name === scheduleName &&
          (!scheduleUid || reference.uid === scheduleUid)
      )
    )
    .sort((left, right) => {
      const leftTime = Date.parse(left.metadata.creationTimestamp ?? '0');
      const rightTime = Date.parse(right.metadata.creationTimestamp ?? '0');
      return rightTime - leftTime;
    });
}

/**
 * Returns concise operator-facing security notes for a SparkApplication spec.
 */
export function getSparkSecurityWarnings(spec: SparkApplicationSpec | undefined | null): string[] {
  if (!spec) {
    return [];
  }

  const warnings: string[] = [];
  const sparkAuthenticate = `${spec.sparkConf?.['spark.authenticate'] ?? ''}`.toLowerCase();
  const driverSecrets = spec.driver?.secrets ?? [];
  const executorSecrets = spec.executor?.secrets ?? [];
  const driverSecretRefs = Object.keys(spec.driver?.envSecretKeyRefs ?? {});
  const executorSecretRefs = Object.keys(spec.executor?.envSecretKeyRefs ?? {});

  if (sparkAuthenticate === 'true') {
    warnings.push(
      'Spark authentication is enabled, so users who can list pods in this namespace may be able to see the per-application auth secret.'
    );
  }

  if (
    driverSecrets.length > 0 ||
    executorSecrets.length > 0 ||
    driverSecretRefs.length > 0 ||
    executorSecretRefs.length > 0
  ) {
    warnings.push(
      'Driver or executor pods reference Kubernetes secrets. Verify namespace RBAC, pod access, and secret mount paths before sharing this workload broadly.'
    );
  }

  return warnings;
}

/**
 * Aggregates resource requests across a list of SparkApplications.
 */
export function aggregateSparkResources(
  applications: Array<SparkApplication | SparkApplicationClass>
) {
  return applications.reduce(
    (acc, app) => {
      // Driver resources
      const driver = app.spec?.driver;
      if (driver) {
        acc.cpu += parseCpuQuantity(driver.cores ?? 0);
        acc.memory += parseMemoryQuantity(driver.memory ?? 0);
        const driverGpu = driver.gpu?.quantity || 0;
        acc.gpu += Number.parseInt(`${driverGpu}`, 10) || 0;
      }

      // Executor resources
      const executor = app.spec?.executor;
      if (executor) {
        const instances = executor.instances ?? 1;
        acc.cpu += parseCpuQuantity(executor.cores ?? 0) * instances;
        acc.memory += parseMemoryQuantity(executor.memory ?? 0) * instances;
        const executorGpu = (executor.gpu?.quantity || 0) * instances;
        acc.gpu += Number.parseInt(`${executorGpu}`, 10) || 0;
      }

      return acc;
    },
    { cpu: 0, memory: 0, gpu: 0 }
  );
}

/**
 * Returns a human-readable volume source label for tables and detail views.
 */
export function describeSparkVolume(volume: Record<string, any> | undefined): string {
  if (!volume) {
    return 'Unknown';
  }

  if (volume.persistentVolumeClaim) {
    return `PVC: ${volume.persistentVolumeClaim.claimName}`;
  }

  if (volume.configMap) {
    return `ConfigMap: ${volume.configMap.name}`;
  }

  if (volume.secret) {
    return `Secret: ${volume.secret.secretName}`;
  }

  if (volume.emptyDir !== undefined) {
    return 'EmptyDir';
  }

  if (volume.hostPath) {
    return `HostPath: ${volume.hostPath.path}`;
  }

  return volume.name || 'Unknown';
}

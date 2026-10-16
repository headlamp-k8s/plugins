import type { DotnetMonitorPluginConfig } from '../configDefaults';

export interface PodLikeContainerPort {
  containerPort?: number;
  name?: string;
}

export interface PodLikeContainer {
  name?: string;
  image?: string;
  command?: string[];
  args?: string[];
  ports?: PodLikeContainerPort[];
}

export interface PodLikeMetadata {
  name?: string;
  namespace?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface PodLike {
  kind?: string;
  cluster?: string;
  metadata?: PodLikeMetadata;
  spec?: {
    containers?: PodLikeContainer[];
    initContainers?: PodLikeContainer[];
  };
}

export interface DotnetMonitorTargetContainer {
  name: string;
  image: string;
  index: number;
}

export interface DotnetMonitorContainerSelection {
  monitorContainer: PodLikeContainer;
  monitorPort: number;
  applicationContainers: DotnetMonitorTargetContainer[];
}

const DEFAULT_MONITOR_CONTAINER_NAMES = ['dotnet-monitor', 'dotnetmonitor'];

function normalize(value: string | undefined | null): string {
  return (value ?? '').trim().toLowerCase();
}

function parseSelector(selector: string): { key: string; value: string } | null {
  const trimmed = selector.trim();
  if (!trimmed) {
    return null;
  }
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) {
    return { key: trimmed, value: 'true' };
  }
  return {
    key: trimmed.slice(0, eqIndex).trim(),
    value: trimmed.slice(eqIndex + 1).trim(),
  };
}

function matchesSelector(values: Record<string, string> | undefined, selector: string): boolean {
  const parsed = parseSelector(selector);
  if (!parsed) {
    return false;
  }
  return normalize(values?.[parsed.key]) === normalize(parsed.value);
}

function getAllContainers(pod: PodLike): PodLikeContainer[] {
  return [...(pod.spec?.containers ?? []), ...(pod.spec?.initContainers ?? [])];
}

export function isMonitorContainer(
  container: PodLikeContainer | undefined,
  config: DotnetMonitorPluginConfig,
): boolean {
  if (!container?.name) {
    return false;
  }
  const containerName = normalize(container.name);
  const image = normalize(container.image);
  const command = normalize(container.command?.join(' '));
  const args = normalize(container.args?.join(' '));
  const configuredName = normalize(config.monitorContainerName);
  return (
    DEFAULT_MONITOR_CONTAINER_NAMES.includes(containerName) ||
    containerName === configuredName ||
    containerName.includes('dotnetmonitor') ||
    containerName.includes('dotnet-monitor') ||
    image.includes('dotnet/monitor') ||
    image.includes('dotnet-monitor') ||
    command.includes('dotnet-monitor') ||
    args.includes('dotnet-monitor')
  );
}

export function detectMonitorPort(container: PodLikeContainer | undefined, fallbackPort: number): number {
  const portByName = container?.ports?.find((port) => normalize(port.name).includes('dotnet-monitor'));
  if (portByName?.containerPort) {
    return portByName.containerPort;
  }

  const explicitPort = container?.ports?.find((port) => port.containerPort && port.containerPort > 0);
  if (explicitPort?.containerPort) {
    return explicitPort.containerPort;
  }

  return fallbackPort;
}

function looksLikeDotnetApp(container: PodLikeContainer): boolean {
  const haystack = [
    container.name,
    container.image,
    container.command?.join(' '),
    container.args?.join(' '),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    haystack.includes('dotnet') ||
    haystack.includes('aspnet') ||
    haystack.includes('mcr.microsoft.com/dotnet') ||
    haystack.includes('.net')
  );
}

export function podMatchesSelector(pod: PodLike, config: DotnetMonitorPluginConfig): boolean {
  if (matchesSelector(pod.metadata?.labels, config.podLabelSelector)) {
    return true;
  }
  if (matchesSelector(pod.metadata?.annotations, config.podAnnotationSelector)) {
    return true;
  }
  return false;
}

export function getDotnetMonitorSelection(
  pod: PodLike,
  config: DotnetMonitorPluginConfig,
): DotnetMonitorContainerSelection | null {
  const containers = getAllContainers(pod).filter(Boolean);
  const monitorContainer = containers.find((container) => isMonitorContainer(container, config));

  if (!monitorContainer) {
    return null;
  }

  const monitorPort = detectMonitorPort(monitorContainer, config.monitorPort);
  const regularContainers = (pod.spec?.containers ?? []).map((container, index) => ({ container, index }));
  const filteredContainers = regularContainers.filter(({ container }) => !isMonitorContainer(container, config));
  const applicationContainers = filteredContainers.map(({ container, index }) => ({
    name: container.name ?? `container-${index}`,
    image: container.image ?? '',
    index,
  }));

  if (applicationContainers.length === 0) {
    return null;
  }

  return {
    monitorContainer,
    monitorPort,
    applicationContainers,
  };
}

export function getMonitorBasePath(namespace: string, podName: string, port: number): string {
  return `/api/v1/namespaces/${encodeURIComponent(namespace)}/pods/${encodeURIComponent(podName)}:${port}/proxy`;
}

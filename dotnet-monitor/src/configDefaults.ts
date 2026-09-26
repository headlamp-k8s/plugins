export interface DotnetMonitorPluginConfig {
  monitorContainerName: string;
  monitorPort: number;
  podLabelSelector: string;
  podAnnotationSelector: string;
  monitorApiKey?: string;
}

export const DEFAULT_CONFIG: DotnetMonitorPluginConfig = {
  monitorContainerName: 'dotnet-monitor',
  monitorPort: 52323,
  podLabelSelector: '',
  podAnnotationSelector: '',
};

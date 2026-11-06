import { useState } from 'react';
import { ActionButton } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';
import { DEFAULT_CONFIG, type DotnetMonitorPluginConfig } from '../configDefaults';
import { DotnetMonitorDialog } from './DotnetMonitorDialog';
import { getDotnetMonitorSelection } from '../detection/monitorDetection';
import { unwrapPodResource } from '../detection/podResource';

const pluginStore = new ConfigStore<DotnetMonitorPluginConfig>('headlamp-dotnet-monitor');
const usePluginConfig = pluginStore.useConfig();

function DotnetMonitorActionContent({ item }: { item: unknown }) {
  const [open, setOpen] = useState(false);
  const config = {
    ...DEFAULT_CONFIG,
    ...(usePluginConfig() ?? {}),
  } as DotnetMonitorPluginConfig;

  const pod = unwrapPodResource(item);
  const selection = pod ? getDotnetMonitorSelection(pod, config) : null;

  if (!pod || !selection || !pod.metadata?.name || !pod.metadata?.namespace) {
    return null;
  }

  const activeContainer = selection.applicationContainers[0];
  if (!activeContainer) {
    return null;
  }

  return (
    <>
      <ActionButton description="Open dotnet-monitor" icon="mdi:monitor" onClick={() => setOpen(true)} />
      <DotnetMonitorDialog
        open={open}
        onClose={() => setOpen(false)}
        context={{
          clusterName: pod.cluster ?? '',
          namespace: pod.metadata.namespace ?? '',
          podName: pod.metadata.name ?? '',
          containerName: selection.monitorContainer.name ?? DEFAULT_CONFIG.monitorContainerName,
          port: selection.monitorPort,
        }}
        containerName={activeContainer.name}
      />
    </>
  );
}

export function DotnetMonitorHeaderAction(props: { item: unknown }) {
  return <DotnetMonitorActionContent item={props.item} />;
}

import { Icon } from '@iconify/react';
import { Activity, CommonComponents, K8s } from '@kinvolk/headlamp-plugin/lib';
import { Terminal as XTerminal } from '@xterm/xterm';
import React from 'react';

interface NotebookLogsViewerProps {
  /** Pod name to fetch logs for (e.g. "my-notebook-0") */
  podName: string;
  /** Namespace where the pod lives */
  namespace: string;
  /** Cluster to target */
  cluster?: string;
}

/**
 * Renders a full-screen log viewer for a notebook pod.
 * Designed to be launched via Activity.launch().
 */
export function NotebookLogsViewer({ podName, namespace, cluster }: NotebookLogsViewerProps) {
  const [podItem, podError] = K8s.ResourceClasses.Pod.useGet(podName, namespace, { cluster });
  const [logs, setLogs] = React.useState<{ logs: string[]; lastLineShown: number }>({
    logs: [],
    lastLineShown: -1,
  });
  const [showReconnectButton, setShowReconnectButton] = React.useState(false);
  const xtermRef = React.useRef<XTerminal | null>(null);

  React.useEffect(() => {
    if (!podItem) return;

    const containerName = podItem.spec?.containers?.[0]?.name;
    if (!containerName) return;

    xtermRef.current?.clear();
    setLogs({ logs: [], lastLineShown: -1 });
    setShowReconnectButton(false);

    const cancel = podItem.getLogs(
      containerName,
      ({ logs: newLogs }: { logs: string[]; hasJsonLogs: boolean }) => {
        setLogs(current => {
          if (current.lastLineShown >= newLogs.length) {
            xtermRef.current?.clear();
            xtermRef.current?.write(newLogs.join('').replace(/\n/g, '\r\n'));
          } else {
            xtermRef.current?.write(
              newLogs
                .slice(current.lastLineShown + 1)
                .join('')
                .replace(/\n/g, '\r\n')
            );
          }
          return { logs: newLogs, lastLineShown: newLogs.length - 1 };
        });
      },
      {
        tailLines: 100,
        showTimestamps: true,
        follow: true,
        onReconnectStop: () => setShowReconnectButton(true),
      }
    );

    return () => cancel();
  }, [podItem]);

  if (podError) {
    return (
      <CommonComponents.LogViewer
        noDialog
        open
        title={`Logs: ${podName}`}
        logs={[`Error loading pod: ${(podError as any)?.message ?? 'Unknown error'}`]}
        onClose={() => {}}
      />
    );
  }

  return (
    <CommonComponents.LogViewer
      noDialog
      open
      title={`Logs: ${podName}`}
      downloadName={podName}
      logs={logs.logs}
      xtermRef={xtermRef}
      onClose={() => {}}
      handleReconnect={() => {
        setShowReconnectButton(false);
        setLogs({ logs: [], lastLineShown: -1 });
      }}
      showReconnectButton={showReconnectButton}
    />
  );
}

/**
 * Launches a side-pane log viewer for a specific pod using the Activity system.
 */
export function launchPodLogs({
  podName,
  namespace,
  cluster,
  title,
}: {
  podName: string;
  namespace: string;
  cluster?: string;
  title?: string;
}) {
  Activity.launch({
    id: `pod-logs-${namespace}-${podName}`,
    title: title || `Logs: ${podName}`,
    cluster,
    icon: <Icon icon="mdi:text-box-outline" width="100%" height="100%" />,
    location: 'full',
    content: <NotebookLogsViewer podName={podName} namespace={namespace} cluster={cluster} />,
  });
}

/**
 * Launches a side-pane log viewer for a Kubeflow Notebook using the Activity system.
 * The notebook's primary pod is always named `<notebookName>-0`.
 */
export function launchNotebookLogs({
  notebookName,
  namespace,
  cluster,
}: {
  notebookName: string;
  namespace: string;
  cluster?: string;
}) {
  const podName = `${notebookName}-0`;
  launchPodLogs({
    podName,
    namespace,
    cluster,
    title: `Logs: ${notebookName}`,
  });
}

/**
 * React Component that discovers the pod for a Pipeline Run and renders its logs.
 */
export function PipelineRunLogsViewer({
  runName,
  namespace,
  cluster,
}: {
  runName: string;
  namespace: string;
  cluster?: string;
}) {
  const [kfpPods] = K8s.ResourceClasses.Pod.useList({
    namespace,
    cluster,
    labelSelector: `pipeline/runid=${runName}`,
  });

  const [argoPods] = K8s.ResourceClasses.Pod.useList({
    namespace,
    cluster,
    labelSelector: `workflows.argoproj.io/workflow=${runName}`,
  });

  if (!kfpPods || !argoPods) {
    return (
      <CommonComponents.LogViewer
        noDialog
        open
        title={`Logs: Run — ${runName}`}
        logs={['Discovering pod for pipeline run...']}
        onClose={() => {}}
      />
    );
  }

  const allPods = [...(kfpPods || []), ...(argoPods || [])];
  const pod = allPods.sort((a, b) => {
    const aRunning = a.status?.phase === 'Running' ? 1 : 0;
    const bRunning = b.status?.phase === 'Running' ? 1 : 0;
    if (aRunning !== bRunning) {
      return bRunning - aRunning;
    }
    const aTime = Date.parse(a.metadata.creationTimestamp || '0');
    const bTime = Date.parse(b.metadata.creationTimestamp || '0');
    return bTime - aTime;
  })[0];

  if (!pod) {
    return (
      <CommonComponents.LogViewer
        noDialog
        open
        title={`Logs: Run — ${runName}`}
        logs={[
          `No pods found for run ${runName}. It may be a sample CRD without pods, or its pods were garbage collected after completion.`,
        ]}
        onClose={() => {}}
      />
    );
  }

  return <NotebookLogsViewer podName={pod.metadata.name} namespace={namespace} cluster={cluster} />;
}

/**
 * Launches a side-pane log viewer for a Pipeline Run.
 */
export function launchPipelineRunLogs({
  runName,
  namespace,
  cluster,
}: {
  runName: string;
  namespace: string;
  cluster?: string;
}) {
  Activity.launch({
    id: `run-logs-${namespace}-${runName}`,
    title: `Logs: Run — ${runName}`,
    cluster,
    icon: <Icon icon="mdi:text-box-outline" width="100%" height="100%" />,
    location: 'full',
    content: <PipelineRunLogsViewer runName={runName} namespace={namespace} cluster={cluster} />,
  });
}

export function KatibTrialLogsViewer({
  trialName,
  namespace,
  cluster,
}: {
  trialName: string;
  namespace: string;
  cluster?: string;
}) {
  const [lookupStage, setLookupStage] = React.useState<'trial-name' | 'trial' | 'fallback'>(
    'trial-name'
  );

  React.useEffect(() => {
    setLookupStage('trial-name');
  }, [trialName, namespace, cluster]);

  const labelSelector =
    lookupStage === 'trial-name'
      ? `katib.kubeflow.org/trial-name=${trialName}`
      : lookupStage === 'trial'
      ? `katib.kubeflow.org/trial=${trialName}`
      : undefined;

  const [pods] = K8s.ResourceClasses.Pod.useList({ namespace, cluster, labelSelector });

  React.useEffect(() => {
    if (!pods) {
      return;
    }
    if (pods.length === 0 && lookupStage === 'trial-name') {
      setLookupStage('trial');
    } else if (pods.length === 0 && lookupStage === 'trial') {
      setLookupStage('fallback');
    }
  }, [pods, lookupStage]);

  if (!pods) {
    return (
      <CommonComponents.LogViewer
        noDialog
        open
        title={`Logs: Trial - ${trialName}`}
        logs={['Discovering pod for Katib trial...']}
        onClose={() => {}}
      />
    );
  }

  const pod = pods
    .filter(podItem => {
      const labels = podItem.metadata.labels ?? {};
      return (
        labels['katib.kubeflow.org/trial'] === trialName ||
        labels['katib.kubeflow.org/trial-name'] === trialName ||
        labels.trial === trialName ||
        podItem.metadata.name.includes(trialName)
      );
    })
    .sort((a, b) => {
      const aRunning = a.status?.phase === 'Running' ? 1 : 0;
      const bRunning = b.status?.phase === 'Running' ? 1 : 0;
      if (aRunning !== bRunning) {
        return bRunning - aRunning;
      }
      const aTime = Date.parse(a.metadata.creationTimestamp || '0');
      const bTime = Date.parse(b.metadata.creationTimestamp || '0');
      return bTime - aTime;
    })[0];

  if (!pod) {
    return (
      <CommonComponents.LogViewer
        noDialog
        open
        title={`Logs: Trial - ${trialName}`}
        logs={[
          `No pods found for trial ${trialName}. It may be sample data without worker pods, or the worker pod may have been removed.`,
        ]}
        onClose={() => {}}
      />
    );
  }

  return <NotebookLogsViewer podName={pod.metadata.name} namespace={namespace} cluster={cluster} />;
}

/**
 * Launches a side-pane log viewer for a Katib Trial worker pod using the Activity system.
 * Discovers the correct worker pod by iterating through Katib label formats.
 *
 * @param props The options for launching the log viewer.
 * @param props.trialName The name of the Katib trial.
 * @param props.namespace The namespace containing the trial.
 * @param props.cluster Optional cluster context if multi-cluster is active.
 */
export function launchKatibTrialLogs({
  trialName,
  namespace,
  cluster,
}: {
  trialName: string;
  namespace: string;
  cluster?: string;
}) {
  Activity.launch({
    id: `katib-trial-logs-${namespace}-${trialName}`,
    title: `Logs: Trial - ${trialName}`,
    cluster,
    icon: <Icon icon="mdi:text-box-outline" width="100%" height="100%" />,
    location: 'full',
    content: <KatibTrialLogsViewer trialName={trialName} namespace={namespace} cluster={cluster} />,
  });
}

/**
 * React Component that discovers the pod for a Deployment and renders its logs.
 */
export function DeploymentLogsViewer({
  deploymentName,
  namespace,
  matchLabels,
  cluster,
}: {
  deploymentName: string;
  namespace: string;
  matchLabels: Record<string, string>;
  cluster?: string;
}) {
  const labelSelector = Object.entries(matchLabels || {})
    .map(([k, v]) => `${k}=${v}`)
    .join(',');
  const hasMatchLabels = labelSelector.length > 0;

  const [pods] = K8s.ResourceClasses.Pod.useList({
    namespace,
    cluster,
    labelSelector: hasMatchLabels ? labelSelector : '__headlamp_no_match_labels__=__never__',
  });

  if (!hasMatchLabels) {
    return (
      <CommonComponents.LogViewer
        noDialog
        open
        title={`Logs: ${deploymentName}`}
        logs={[
          `Cannot discover pods for deployment ${deploymentName}: deployment selector labels are empty.`,
        ]}
        onClose={() => {}}
      />
    );
  }

  if (!pods) {
    return (
      <CommonComponents.LogViewer
        noDialog
        open
        title={`Logs: ${deploymentName}`}
        logs={['Discovering pod for deployment...']}
        onClose={() => {}}
      />
    );
  }

  const pod = pods.sort((a, b) => {
    const aRunning = a.status?.phase === 'Running' ? 1 : 0;
    const bRunning = b.status?.phase === 'Running' ? 1 : 0;
    if (aRunning !== bRunning) {
      return bRunning - aRunning;
    }
    const aTime = Date.parse(a.metadata.creationTimestamp || '0');
    const bTime = Date.parse(b.metadata.creationTimestamp || '0');
    return bTime - aTime;
  })[0];

  if (!pod) {
    return (
      <CommonComponents.LogViewer
        noDialog
        open
        title={`Logs: ${deploymentName}`}
        logs={[`No pods found for deployment ${deploymentName}.`]}
        onClose={() => {}}
      />
    );
  }

  return <NotebookLogsViewer podName={pod.metadata.name} namespace={namespace} cluster={cluster} />;
}

/**
 * Launches a side-pane log viewer for a Deployment.
 */
export function launchDeploymentLogs({
  deploymentName,
  namespace,
  matchLabels,
  cluster,
}: {
  deploymentName: string;
  namespace: string;
  matchLabels: Record<string, string>;
  cluster?: string;
}) {
  Activity.launch({
    id: `deploy-logs-${namespace}-${deploymentName}`,
    title: `Logs: ${deploymentName}`,
    cluster,
    icon: <Icon icon="mdi:text-box-outline" width="100%" height="100%" />,
    location: 'full',
    content: (
      <DeploymentLogsViewer
        deploymentName={deploymentName}
        namespace={namespace}
        matchLabels={matchLabels}
        cluster={cluster}
      />
    ),
  });
}

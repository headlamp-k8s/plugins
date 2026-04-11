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
  Activity.launch({
    id: `notebook-logs-${namespace}-${notebookName}`,
    title: `Logs: ${notebookName}`,
    cluster,
    icon: <Icon icon="mdi:text-box-outline" width="100%" height="100%" />,
    location: 'full',
    content: <NotebookLogsViewer podName={podName} namespace={namespace} cluster={cluster} />,
  });
}

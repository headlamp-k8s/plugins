import Pod from '@kinvolk/headlamp-plugin/lib/k8s/pod';
import type { Terminal as XTerm } from '@xterm/xterm';
import React from 'react';
import { formatPrefixedLogFragment, sortLogsByTimestamp } from './jobLogs';

/**
 * Inputs that control the Job log streaming lifecycle.
 */
type UseJobLogsStreamOptions = {
  /** Pods currently selected in the viewer. */
  selectedPods: Pod[];
  /** Selected pod name or `all` when aggregating logs across pods. */
  selectedPodName: 'all' | string;
  /** Selected container name. */
  selectedContainer: string;
  /** Number of log lines requested from the cluster. */
  lines: number;
  /** Whether previous container logs should be shown. */
  showPrevious: boolean;
  /** Whether timestamps should be shown in the log output. */
  showTimestamps: boolean;
  /** Whether the log stream should continue following new output. */
  follow: boolean;
  /** Whether all selected pods are already terminal and should suppress reconnect UI. */
  allSelectedPodsAreTerminal: boolean;
};

/**
 * Stream state and controls exposed to the Job logs viewer.
 */
type UseJobLogsStreamResult = {
  /** Current real log content shown in the terminal and used for downloads. */
  logs: string[];
  /** Whether the reconnect button should be shown. */
  showReconnectButton: boolean;
  /** Terminal instance owned by the log stream hook. */
  xtermRef: React.RefObject<XTerm | null>;
  /** Clears current stream state and restarts log streaming. */
  handleReconnect: () => void;
};

/**
 * Manages pod log streaming state for the Volcano Job logs viewer.
 *
 * @param options Current log stream configuration.
 * @returns Streamed logs, reconnect state, terminal ref, and reconnect handler.
 */
export function useJobLogsStream({
  selectedPods,
  selectedPodName,
  selectedContainer,
  lines,
  showPrevious,
  showTimestamps,
  follow,
  allSelectedPodsAreTerminal,
}: UseJobLogsStreamOptions): UseJobLogsStreamResult {
  const xtermRef = React.useRef<XTerm | null>(null);
  const [logs, setLogs] = React.useState<string[]>([]);
  const [showReconnectButton, setShowReconnectButton] = React.useState(false);
  const [reconnectNonce, setReconnectNonce] = React.useState(0);
  const allPodLogsByPodRef = React.useRef<Record<string, string[]>>({});
  const lastProcessedLogCountByPodRef = React.useRef(new Map<string, number>());

  const clearLogs = React.useCallback(() => {
    xtermRef.current?.clear();
    setLogs([]);
    allPodLogsByPodRef.current = {};
    lastProcessedLogCountByPodRef.current.clear();
  }, []);

  const writeEntireLogBuffer = React.useCallback((nextLogs: string[]) => {
    xtermRef.current?.clear();
    xtermRef.current?.write(nextLogs.join('').replace(/\n/g, '\r\n'));
  }, []);

  const rebuildAllPodsLogBuffer = React.useCallback(() => {
    const aggregatedLogs = sortLogsByTimestamp(
      Object.entries(allPodLogsByPodRef.current).flatMap(([podName, podLogs]) =>
        podLogs.map(log => formatPrefixedLogFragment(podName, selectedContainer, log))
      )
    );

    writeEntireLogBuffer(aggregatedLogs);
    setLogs(aggregatedLogs);
  }, [selectedContainer, writeEntireLogBuffer]);

  const appendAllPodsLogFragments = React.useCallback(
    (podName: string, nextLogs: string[]) => {
      const previousCount = lastProcessedLogCountByPodRef.current.get(podName) ?? 0;
      const nextCount = nextLogs.length;

      allPodLogsByPodRef.current = {
        ...allPodLogsByPodRef.current,
        [podName]: nextLogs,
      };

      if (nextCount < previousCount) {
        lastProcessedLogCountByPodRef.current.set(podName, nextCount);
        rebuildAllPodsLogBuffer();
        return;
      }

      if (nextCount === previousCount) {
        return;
      }

      const newFragments = nextLogs
        .slice(previousCount)
        .map(log => formatPrefixedLogFragment(podName, selectedContainer, log));

      xtermRef.current?.write(newFragments.join('').replace(/\n/g, '\r\n'));
      setLogs(currentLogs => currentLogs.concat(newFragments));
      lastProcessedLogCountByPodRef.current.set(podName, nextCount);
    },
    [rebuildAllPodsLogBuffer, selectedContainer]
  );

  const updateSinglePodLogBuffer = React.useCallback(
    (nextLogs: string[], lastRenderedCount: number) => {
      if (!xtermRef.current) {
        setLogs(nextLogs);
        return nextLogs.length;
      }

      if (nextLogs.length < lastRenderedCount) {
        writeEntireLogBuffer(nextLogs);
      } else if (nextLogs.length > lastRenderedCount) {
        xtermRef.current.write(nextLogs.slice(lastRenderedCount).join('').replace(/\n/g, '\r\n'));
      }

      setLogs(nextLogs);
      return nextLogs.length;
    },
    [writeEntireLogBuffer]
  );

  React.useEffect(() => {
    if (!selectedContainer) {
      clearLogs();
      return;
    }

    if (!selectedPods.length) {
      clearLogs();
      return;
    }

    setShowReconnectButton(false);

    if (selectedPodName === 'all') {
      clearLogs();
      const cleanups = selectedPods.map(pod =>
        pod.getLogs(
          selectedContainer,
          ({ logs: nextLogs }: { logs: string[]; hasJsonLogs?: boolean }) => {
            appendAllPodsLogFragments(pod.getName(), [...nextLogs]);
          },
          {
            tailLines: lines,
            showPrevious,
            showTimestamps,
            follow,
            onReconnectStop: () => {
              if (!allSelectedPodsAreTerminal) {
                setShowReconnectButton(true);
              }
            },
          }
        )
      );

      return () => cleanups.forEach(cleanup => cleanup());
    }

    const pod = selectedPods[0];
    if (!pod) {
      clearLogs();
      return;
    }

    let lastRenderedCount = 0;
    clearLogs();

    return pod.getLogs(
      selectedContainer,
      ({ logs: nextLogs }: { logs: string[]; hasJsonLogs?: boolean }) => {
        lastRenderedCount = updateSinglePodLogBuffer([...nextLogs], lastRenderedCount);
      },
      {
        tailLines: lines,
        showPrevious,
        showTimestamps,
        follow,
        onReconnectStop: () => {
          if (!allSelectedPodsAreTerminal) {
            setShowReconnectButton(true);
          }
        },
      }
    );
  }, [
    allSelectedPodsAreTerminal,
    clearLogs,
    follow,
    lines,
    reconnectNonce,
    selectedContainer,
    selectedPodName,
    selectedPods,
    showPrevious,
    showTimestamps,
  ]);

  const handleReconnect = React.useCallback(() => {
    clearLogs();
    setShowReconnectButton(false);
    setReconnectNonce(value => value + 1);
  }, [clearLogs]);

  return {
    logs,
    showReconnectButton,
    xtermRef,
    handleReconnect,
  };
}

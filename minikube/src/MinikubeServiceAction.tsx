import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { ActionButton } from '@kinvolk/headlamp-plugin/lib/components/common';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import { Alert, Snackbar } from '@mui/material';
import React from 'react';
import { isElectron, isMinikube } from './isElectron';

declare const pluginRunCommand: any;

function getRunner() {
  if (typeof pluginRunCommand === 'function') {
    return pluginRunCommand;
  }
  if (typeof window !== 'undefined' && typeof (window as any)?.pluginRunCommand === 'function') {
    return (window as any).pluginRunCommand;
  }
  return null;
}

type RunningServiceProcess = {
  stdout?: {
    on: (event: string, listener: (data: any) => void) => void;
    off?: (event: string, listener: (data: any) => void) => void;
    removeListener?: (event: string, listener: (data: any) => void) => void;
  };
  stderr?: {
    on: (event: string, listener: (data: any) => void) => void;
    off?: (event: string, listener: (data: any) => void) => void;
    removeListener?: (event: string, listener: (data: any) => void) => void;
  };
  on?: (event: string, listener: (value: any) => void) => void;
  off?: (event: string, listener: (value: any) => void) => void;
  removeListener?: (event: string, listener: (value: any) => void) => void;
  kill?: () => void;
};

function removeStreamListener(
  stream:
    | {
        off?: (event: string, listener: (data: any) => void) => void;
        removeListener?: (event: string, listener: (data: any) => void) => void;
      }
    | undefined,
  event: string,
  listener: (data: any) => void
) {
  stream?.off?.(event, listener);
  stream?.removeListener?.(event, listener);
}

function removeProcessListener(
  process: RunningServiceProcess,
  event: string,
  listener: (value: any) => void
) {
  process.off?.(event, listener);
  process.removeListener?.(event, listener);
}

function openUrl(url: string) {
  try {
    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      const win = window.open(url, '_blank');
      if (win) return;
    }
    if (typeof document !== 'undefined') {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  } catch (e) {
    console.error('[Minikube] Failed to open URL in browser:', e);
  }
}

export interface MinikubeServiceActionProps {
  item?: KubeObject;
}

export function MinikubeServiceAction({ item }: MinikubeServiceActionProps) {
  const [loading, setLoading] = React.useState(false);
  const [tunnelActive, setTunnelActive] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: 'info' | 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });
  const clusters = K8s.useClustersConf();
  const processRef = React.useRef<RunningServiceProcess | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const settledRef = React.useRef(false);
  const tunnelActiveRef = React.useRef(false);
  const openedUrlRef = React.useRef(false);
  const stdoutBufferRef = React.useRef('');
  const stderrBufferRef = React.useRef('');
  const listenersRef = React.useRef<Array<() => void>>([]);

  const clusterName = typeof (item as any)?.cluster === 'string' ? (item as any).cluster : '';

  const name =
    typeof item?.getName === 'function'
      ? item.getName()
      : item.metadata?.name || (item as any)?.jsonData?.metadata?.name || '';
  const namespace =
    typeof item?.getNamespace === 'function'
      ? item.getNamespace()
      : item.metadata?.namespace || (item as any)?.jsonData?.metadata?.namespace || 'default';

  function clearTimer() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function removeListeners() {
    listenersRef.current.forEach(remove => remove());
    listenersRef.current = [];
  }

  function stopTunnel() {
    clearTimer();
    removeListeners();
    settledRef.current = true;
    tunnelActiveRef.current = false;
    setTunnelActive(false);
    try {
      processRef.current?.kill?.();
    } catch {
      // The process may already have exited.
    }
    processRef.current = null;
    setLoading(false);
    setSnackbar({
      open: true,
      message: `Stopped Minikube tunnel for service "${name}".`,
      severity: 'info',
    });
  }

  React.useEffect(() => {
    return () => {
      clearTimer();
      removeListeners();
      settledRef.current = true;
      try {
        processRef.current?.kill?.();
      } catch {
        // The process may already have exited.
      }
      processRef.current = null;
      tunnelActiveRef.current = false;
    };
  }, []);

  const cluster = clusterName ? (clusters || {})[clusterName] : undefined;
  if (
    !item ||
    item.kind !== 'Service' ||
    !isElectron() ||
    !clusterName ||
    !cluster ||
    !isMinikube(cluster as any)
  ) {
    return null;
  }

  function handleOpenService() {
    if (loading || processRef.current || tunnelActive) {
      if (tunnelActive && processRef.current) {
        stopTunnel();
      }
      return;
    }

    const runner = getRunner();

    if (!runner) {
      console.warn('[Minikube] Runner not available');
      setSnackbar({
        open: true,
        message: 'Command runner is not available in this environment.',
        severity: 'error',
      });
      return;
    }

    settledRef.current = false;
    tunnelActiveRef.current = false;
    setTunnelActive(false);
    openedUrlRef.current = false;
    stdoutBufferRef.current = '';
    stderrBufferRef.current = '';
    listenersRef.current = [];
    setLoading(true);
    setSnackbar({
      open: true,
      message: `Fetching Minikube service URL for "${name}"...`,
      severity: 'info',
    });

    try {
      console.log(
        `[Minikube] Running service command for profile ${clusterName}, ${namespace}/${name}`
      );
      const cmd = runner(
        'minikube',
        ['service', name, '-n', namespace, '-p', clusterName, '--url'],
        {}
      ) as RunningServiceProcess;
      if (!cmd) {
        throw new Error('Minikube command process was not created.');
      }

      processRef.current = cmd;

      function clearTimer() {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }

      function removeListeners() {
        listenersRef.current.forEach(remove => remove());
        listenersRef.current = [];
      }

      function settleWithError(message: string) {
        if (settledRef.current) return;
        settledRef.current = true;
        clearTimer();
        removeListeners();
        setLoading(false);
        tunnelActiveRef.current = false;
        setTunnelActive(false);
        processRef.current = null;
        setSnackbar({
          open: true,
          message,
          severity: 'error',
        });
      }

      function consumeBuffer(bufferRef: React.MutableRefObject<string>) {
        let newlineIndex = bufferRef.current.indexOf('\n');
        while (newlineIndex !== -1) {
          const line = bufferRef.current.slice(0, newlineIndex).replace(/\r$/, '');
          bufferRef.current = bufferRef.current.slice(newlineIndex + 1);
          processLine(line);
          newlineIndex = bufferRef.current.indexOf('\n');
        }
      }

      function processLine(line: string) {
        if (settledRef.current || openedUrlRef.current) return;
        const matches = line.match(/https?:\/\/[^\s"'<>]+/g);
        if (!matches) return;

        const url = matches[0].replace(/[),.;\]]+$/, '');
        if (!url) return;
        openedUrlRef.current = true;
        tunnelActiveRef.current = true;
        setTunnelActive(true);
        clearTimer();
        setLoading(false);
        setSnackbar({
          open: true,
          message: `Opening ${url} in your browser...`,
          severity: 'success',
        });
        openUrl(url);
      }

      function flushBuffers() {
        consumeBuffer(stdoutBufferRef);
        consumeBuffer(stderrBufferRef);
        if (!settledRef.current && !openedUrlRef.current) {
          if (stdoutBufferRef.current) processLine(stdoutBufferRef.current);
          if (!openedUrlRef.current && stderrBufferRef.current)
            processLine(stderrBufferRef.current);
        }
        stdoutBufferRef.current = '';
        stderrBufferRef.current = '';
      }

      const stdoutListener = (data: any) => {
        if (settledRef.current) return;
        const chunk = data?.toString?.() ?? String(data);
        stdoutBufferRef.current += chunk;
        console.log('[Minikube] service stdout:', chunk);
        consumeBuffer(stdoutBufferRef);
      };
      const stderrListener = (data: any) => {
        if (settledRef.current) return;
        const chunk = data?.toString?.() ?? String(data);
        stderrBufferRef.current += chunk;
        console.warn('[Minikube] service stderr:', chunk);
        consumeBuffer(stderrBufferRef);
      };
      const exitListener = (code: number | null) => {
        if (settledRef.current) return;
        flushBuffers();
        clearTimer();
        setLoading(false);
        if (openedUrlRef.current) {
          settledRef.current = true;
          tunnelActiveRef.current = false;
          setTunnelActive(false);
          processRef.current = null;
          removeListeners();
          return;
        }
        settleWithError(
          code !== 0
            ? `Minikube exited with code ${code}. Make sure Minikube is running.`
            : `No URL returned by Minikube for service "${name}". Does the service expose a port?`
        );
      };
      const errorListener = (err: any) => {
        settleWithError(`Failed to execute Minikube: ${err?.message || err}`);
      };

      listenersRef.current = [
        () => removeStreamListener(cmd.stdout, 'data', stdoutListener),
        () => removeStreamListener(cmd.stderr, 'data', stderrListener),
        () => removeProcessListener(cmd, 'exit', exitListener),
        () => removeProcessListener(cmd, 'error', errorListener),
      ];

      cmd.stdout?.on?.('data', stdoutListener);
      cmd.stderr?.on?.('data', stderrListener);
      cmd.on?.('exit', exitListener);
      cmd.on?.('error', errorListener);

      timerRef.current = setTimeout(() => {
        if (settledRef.current) return;
        settledRef.current = true;
        clearTimer();
        removeListeners();
        setLoading(false);
        tunnelActiveRef.current = false;
        setTunnelActive(false);
        try {
          processRef.current?.kill?.();
        } catch {
          // The process may already have exited.
        }
        processRef.current = null;
        setSnackbar({
          open: true,
          message: `Timed out waiting for Minikube URL for service "${name}".`,
          severity: 'error',
        });
      }, 30000);
    } catch (err: any) {
      settledRef.current = true;
      clearTimer();
      removeListeners();
      setLoading(false);
      tunnelActiveRef.current = false;
      setTunnelActive(false);
      processRef.current = null;
      console.error('[Minikube] Failed to run minikube service command:', err);
      setSnackbar({
        open: true,
        message: `Error: ${err?.message || err}`,
        severity: 'error',
      });
    }
  }

  return (
    <>
      <ActionButton
        description={
          tunnelActive
            ? 'Stop Minikube Service Tunnel'
            : loading
            ? 'Fetching Minikube Service URL...'
            : 'Open Minikube Service URL'
        }
        icon={tunnelActive ? 'mdi:stop' : loading ? 'mdi:loading' : 'mdi:open-in-new'}
        onClick={handleOpenService}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default MinikubeServiceAction;

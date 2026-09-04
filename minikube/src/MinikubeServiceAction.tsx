import { ActionButton } from '@kinvolk/headlamp-plugin/lib/components/common';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import { Alert, Snackbar } from '@mui/material';
import React from 'react';

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
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: 'info' | 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  if (!item || item.kind !== 'Service') {
    return null;
  }

  const name =
    typeof item.getName === 'function'
      ? item.getName()
      : item.metadata?.name || (item as any)?.jsonData?.metadata?.name || '';
  const namespace =
    typeof item.getNamespace === 'function'
      ? item.getNamespace()
      : item.metadata?.namespace || (item as any)?.jsonData?.metadata?.namespace || 'default';

  function handleOpenService() {
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

    setLoading(true);
    setSnackbar({
      open: true,
      message: `Fetching Minikube service URL for "${name}"...`,
      severity: 'info',
    });

    try {
      console.log(`[Minikube] Running service command for ${namespace}/${name}`);
      const cmd = runner('minikube', ['service', name, '-n', namespace, '--url'], {});

      let opened = false;

      // Safety timeout after 30 seconds
      const timer = setTimeout(() => {
        if (!opened) {
          setLoading(false);
          setSnackbar({
            open: true,
            message: `Timed out waiting for Minikube URL for service "${name}".`,
            severity: 'error',
          });
        }
      }, 30000);

      cmd.stdout?.on('data', (data: any) => {
        if (opened) return;
        const output = data.toString();
        console.log('[Minikube] service output:', output);
        const match = output.match(/https?:\/\/[^\s\r\n]+/);
        if (match) {
          opened = true;
          clearTimeout(timer);
          setLoading(false);
          const url = match[0];
          console.log('[Minikube] Opening URL:', url);
          setSnackbar({
            open: true,
            message: `Opening ${url} in your browser...`,
            severity: 'success',
          });
          openUrl(url);
        }
      });

      cmd.stderr?.on('data', (data: any) => {
        const errOutput = data.toString();
        console.warn('[Minikube] service stderr:', errOutput);
      });

      cmd.on?.('exit', (code: number) => {
        clearTimeout(timer);
        setLoading(false);
        if (!opened) {
          setSnackbar({
            open: true,
            message:
              code !== 0
                ? `Minikube exited with code ${code}. Make sure Minikube is running.`
                : `No URL returned by Minikube for service "${name}". Does the service expose a port?`,
            severity: 'error',
          });
        }
      });

      cmd.on?.('error', (err: any) => {
        clearTimeout(timer);
        setLoading(false);
        console.error('[Minikube] process error:', err);
        setSnackbar({
          open: true,
          message: `Failed to execute Minikube: ${err?.message || err}`,
          severity: 'error',
        });
      });
    } catch (err: any) {
      setLoading(false);
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
        description={loading ? 'Fetching Minikube Service URL...' : 'Open Minikube Service URL'}
        icon={loading ? 'mdi:loading' : 'mdi:open-in-new'}
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

import * as React from 'react';
import type { OptionsObject, SnackbarKey, SnackbarMessage } from 'notistack';
import { useSnackbar } from 'notistack';

type NotifyVariant = 'success' | 'error' | 'warning' | 'info';

type NotifyOptions = OptionsObject;

type NotifyCallback = (message: SnackbarMessage, options?: NotifyOptions) => SnackbarKey;

const DEFAULT_AUTO_HIDE_DURATION = 5000;

function buildNotify(
  enqueueSnackbar: (message: SnackbarMessage, options?: OptionsObject) => SnackbarKey,
  variant: NotifyVariant
): NotifyCallback {
  return (message, options) =>
    enqueueSnackbar(message, {
      autoHideDuration: options?.autoHideDuration ?? DEFAULT_AUTO_HIDE_DURATION,
      ...options,
      variant,
    });
}

export function useNotify() {
  const { enqueueSnackbar } = useSnackbar();

  const notifySuccess = React.useMemo(
    () => buildNotify(enqueueSnackbar, 'success'),
    [enqueueSnackbar]
  );
  const notifyError = React.useMemo(() => buildNotify(enqueueSnackbar, 'error'), [enqueueSnackbar]);
  const notifyWarning = React.useMemo(
    () => buildNotify(enqueueSnackbar, 'warning'),
    [enqueueSnackbar]
  );
  const notifyInfo = React.useMemo(() => buildNotify(enqueueSnackbar, 'info'), [enqueueSnackbar]);

  return React.useMemo(
    () => ({
      notifySuccess,
      notifyError,
      notifyWarning,
      notifyInfo,
    }),
    [notifySuccess, notifyError, notifyWarning, notifyInfo]
  );
}

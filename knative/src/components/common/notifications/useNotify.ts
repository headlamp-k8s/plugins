/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { OptionsObject, SnackbarKey, SnackbarMessage } from 'notistack';
import { useSnackbar } from 'notistack';
import * as React from 'react';

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

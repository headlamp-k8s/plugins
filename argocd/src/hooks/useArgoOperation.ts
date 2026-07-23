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

import { useSnackbar } from 'notistack';
import { useCallback, useRef, useState } from 'react';

type OperationFn = (name: string, namespace: string) => Promise<unknown>;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

/**
 * Hook for a single Argo CD operation with loading state and snackbar feedback.
 * Used by the Application detail view where one operation runs at a time.
 */
export function useArgoOperation(operationFn: OperationFn, operationLabel: string) {
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const inFlightRef = useRef(false);

  const execute = useCallback(
    async (name: string, namespace: string) => {
      if (isLoading) return;
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setIsLoading(true);
      try {
        await operationFn(name, namespace);
        enqueueSnackbar(`${operationLabel} triggered for ${name}`, { variant: 'success' });
      } catch (error) {
        enqueueSnackbar(
          `Failed to ${operationLabel.toLowerCase()} ${name}: ${getErrorMessage(error)}`,
          { variant: 'error' }
        );
      } finally {
        inFlightRef.current = false;
        setIsLoading(false);
      }
    },
    [isLoading, operationFn, operationLabel, enqueueSnackbar]
  );

  return { execute, isLoading };
}

/**
 * Hook for per-app Argo CD operations with independent loading states.
 * Used by the Application list view where multiple apps can be operated on concurrently.
 */
export function useArgoOperationMap(operationFn: OperationFn, operationLabel: string) {
  const { enqueueSnackbar } = useSnackbar();
  const [loadingKeys, setLoadingKeys] = useState<Record<string, boolean>>({});
  const inFlightKeys = useRef<Set<string>>(new Set());

  const execute = useCallback(
    async (name: string, namespace: string) => {
      const key = `${namespace}/${name}`;
      if (loadingKeys[key]) return;
      if (inFlightKeys.current.has(key)) return;
      inFlightKeys.current.add(key);
      setLoadingKeys(prev => ({ ...prev, [key]: true }));
      try {
        await operationFn(name, namespace);
        enqueueSnackbar(`${operationLabel} triggered for ${name}`, { variant: 'success' });
      } catch (error) {
        enqueueSnackbar(
          `Failed to ${operationLabel.toLowerCase()} ${name}: ${getErrorMessage(error)}`,
          { variant: 'error' }
        );
      } finally {
        inFlightKeys.current.delete(key);
        setLoadingKeys(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [loadingKeys, operationFn, operationLabel, enqueueSnackbar]
  );

  const isLoading = useCallback(
    (name: string, namespace: string) => !!loadingKeys[`${namespace}/${name}`],
    [loadingKeys]
  );

  return { execute, isLoading };
}

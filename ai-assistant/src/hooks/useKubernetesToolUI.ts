import {
  type KubernetesToolUICallbacks,
  type KubernetesToolUIState,
} from '@headlamp-k8s/ai-common/tools/kubernetes/context';
import { useMemo, useState } from 'react';

type TranslationFunction = (key: string, options?: Record<string, unknown>) => string;
import { handleActualApiRequest } from '../api/clusterActions';

/**
 * React hook that manages the UI state and callbacks for Kubernetes API tool
 * operations. Provides state for showing confirmation dialogs, tracking
 * request/response status, and wrapping API calls with history updates.
 *
 * @param updateHistory - Optional callback invoked after API success or failure to refresh chat history.
 * @param t - Optional translation function for i18n support.
 * @returns An object containing the current UI state and callback functions.
 */
export function useKubernetesToolUI(
  updateHistory?: () => void,
  t?: TranslationFunction
): {
  state: KubernetesToolUIState;
  callbacks: KubernetesToolUICallbacks;
} {
  const [showApiConfirmation, setShowApiConfirmation] = useState(false);
  const [apiRequest, setApiRequest] = useState<KubernetesToolUIState['apiRequest']>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiRequestError, setApiRequestError] = useState<string | null>(null);

  const state: KubernetesToolUIState = useMemo(
    () => ({
      showApiConfirmation,
      apiRequest,
      apiResponse,
      apiLoading,
      apiRequestError,
    }),
    [showApiConfirmation, apiRequest, apiResponse, apiLoading, apiRequestError]
  );

  // Create a wrapper for handleActualApiRequest that will be bound to the context later
  const handleActualApiRequestCallback = useMemo(() => {
    return async (
      url: string,
      method: string,
      body: string = '',
      onClose: () => void = () => {},
      aiManager?: any,
      resourceInfo?: any,
      targetCluster?: string,
      onFailure?: (error: any, operationType: string, resourceInfo?: any) => void,
      onSuccess?: (response: any, operationType: string, resourceInfo?: any) => void
    ) => {
      // Create wrapped callbacks that also call updateHistory
      const wrappedOnSuccess = onSuccess
        ? (response: any, operationType: string, resourceInfo?: any) => {
            onSuccess(response, operationType, resourceInfo);
            if (updateHistory) {
              updateHistory();
            }
          }
        : updateHistory
        ? () => updateHistory()
        : undefined;

      const wrappedOnFailure = onFailure
        ? (error: any, operationType: string, resourceInfo?: any) => {
            onFailure(error, operationType, resourceInfo);
            if (updateHistory) {
              updateHistory();
            }
          }
        : updateHistory
        ? () => updateHistory()
        : undefined;

      return handleActualApiRequest(
        url,
        method,
        body,
        onClose,
        aiManager,
        resourceInfo,
        targetCluster,
        wrappedOnFailure,
        wrappedOnSuccess,
        t
      );
    };
  }, [t, updateHistory]);

  const callbacks: KubernetesToolUICallbacks = useMemo(
    () => ({
      setShowApiConfirmation,
      setApiRequest,
      setApiResponse,
      setApiLoading,
      setApiRequestError,
      handleActualApiRequest: handleActualApiRequestCallback,
    }),
    [handleActualApiRequestCallback]
  );

  return { state, callbacks };
}

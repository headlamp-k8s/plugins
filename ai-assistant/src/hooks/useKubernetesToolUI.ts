import { useMemo, useState } from 'react';
import { handleActualApiRequest } from '../helper/apihelper';
import { KubernetesToolUICallbacks, KubernetesToolUIState } from '../langchain/tools/kubernetes';

export function useKubernetesToolUI(updateHistory?: () => void): {
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
        wrappedOnSuccess
      );
    };
  }, [updateHistory]);

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

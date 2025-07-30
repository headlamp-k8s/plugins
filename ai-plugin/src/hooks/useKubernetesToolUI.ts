import { useMemo, useState } from 'react';
import { handleActualApiRequest } from '../helper/apihelper';
import { KubernetesToolUICallbacks, KubernetesToolUIState } from '../langchain/tools/kubernetes';

export function useKubernetesToolUI(): {
  state: KubernetesToolUIState;
  callbacks: KubernetesToolUICallbacks;
} {
  const [showApiConfirmation, setShowApiConfirmation] = useState(false);
  const [apiRequest, setApiRequest] = useState<KubernetesToolUIState['apiRequest']>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiRequestError, setApiRequestError] = useState<string | null>(null);

  const state: KubernetesToolUIState = useMemo(() => ({
    showApiConfirmation,
    apiRequest,
    apiResponse,
    apiLoading,
    apiRequestError,
  }), [showApiConfirmation, apiRequest, apiResponse, apiLoading, apiRequestError]);

  // Create a wrapper for handleActualApiRequest that will be bound to the context later
  const handleActualApiRequestCallback = useMemo(() => {
    return async (
      url: string,
      method: string,
      body: string = '',
      onClose: () => void = () => {},
      aiManager?: any,
      resourceInfo?: any,
      targetCluster?: string
    ) => {
      return handleActualApiRequest(url, method, body, onClose, aiManager, resourceInfo, targetCluster);
    };
  }, []);

  const callbacks: KubernetesToolUICallbacks = useMemo(() => ({
    setShowApiConfirmation,
    setApiRequest,
    setApiResponse,
    setApiLoading,
    setApiRequestError,
    handleActualApiRequest: handleActualApiRequestCallback,
  }), [handleActualApiRequestCallback]);

  return { state, callbacks };
}

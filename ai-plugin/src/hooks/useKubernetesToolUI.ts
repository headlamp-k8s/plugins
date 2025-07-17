import { useState } from 'react';
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

  const state: KubernetesToolUIState = {
    showApiConfirmation,
    apiRequest,
    apiResponse,
    apiLoading,
    apiRequestError,
  };

  const callbacks: KubernetesToolUICallbacks = {
    setShowApiConfirmation,
    setApiRequest,
    setApiResponse,
    setApiLoading,
    setApiRequestError,
    handleActualApiRequest,
  };

  return { state, callbacks };
}

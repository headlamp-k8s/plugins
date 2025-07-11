import { useState } from 'react';
import { KubernetesToolUIState, KubernetesToolUICallbacks } from '../langchain/tools/kubernetes';
import { handleActualApiRequest } from '../helper/apihelper';

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

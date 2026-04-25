export interface KubernetesToolUIState {
  showApiConfirmation: boolean;
  apiRequest: {
    url: string;
    method: string;
    body?: string;
    cluster?: string;
    toolCallId?: string;
    pendingPrompt?: any;
  } | null;
  apiResponse: any;
  apiLoading: boolean;
  apiRequestError: string | null;
}

export interface KubernetesToolUICallbacks {
  setShowApiConfirmation: (show: boolean) => void;
  setApiRequest: (request: KubernetesToolUIState['apiRequest']) => void;
  setApiResponse: (response: any) => void;
  setApiLoading: (loading: boolean) => void;
  setApiRequestError: (error: string | null) => void;
  handleActualApiRequest: (
    url: string,
    method: string,
    body?: string,
    onClose?: () => void,
    aiManager?: any,
    resourceInfo?: any,
    targetCluster?: string,
    onFailure?: (error: any, operationType: string, resourceInfo?: any) => void,
    onSuccess?: (response: any, operationType: string, resourceInfo?: any) => void
  ) => Promise<void>;
}

export interface KubernetesToolContext {
  ui: KubernetesToolUIState;
  callbacks: KubernetesToolUICallbacks;
  selectedClusters: string[];
  aiManager?: any; // Optional AI manager for history tracking
}

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

/** UI state managed for Kubernetes API confirmation flows. */
export interface KubernetesToolUIState {
  /** Whether the API confirmation dialog is currently visible. */
  showApiConfirmation: boolean;
  /** The pending API request awaiting confirmation or execution. */
  apiRequest: {
    /** The Kubernetes API URL to call. */
    url: string;
    /** The HTTP method to use for the request. */
    method: string;
    /** The optional request body payload. */
    body?: string;
    /** The target cluster for the request when one is specified. */
    cluster?: string;
    /** The originating tool call identifier. */
    toolCallId?: string;
    /** The prompt associated with the pending tool request. */
    pendingPrompt?: any;
  } | null;
  /** The latest API response returned to the UI. */
  apiResponse: any;
  /** Whether an API request is currently in progress. */
  apiLoading: boolean;
  /** The latest API request error message, if any. */
  apiRequestError: string | null;
}

/** UI callbacks used by the Kubernetes tool to update modal state and execute requests. */
export interface KubernetesToolUICallbacks {
  /** Updates whether the API confirmation dialog is shown. */
  setShowApiConfirmation: (show: boolean) => void;
  /** Stores the pending API request details in UI state. */
  setApiRequest: (request: KubernetesToolUIState['apiRequest']) => void;
  /** Stores the latest API response for display. */
  setApiResponse: (response: any) => void;
  /** Updates the loading state for API requests. */
  setApiLoading: (loading: boolean) => void;
  /** Stores the latest API request error. */
  setApiRequestError: (error: string | null) => void;
  /** Executes the actual Kubernetes API request through the UI layer. */
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
  ) => Promise<any>;
}

/** Runtime context required by the Kubernetes tool implementation. */
export interface KubernetesToolContext {
  /** Current UI state for API request confirmation and results. */
  ui: KubernetesToolUIState;
  /** UI callbacks used to update state and issue requests. */
  callbacks: KubernetesToolUICallbacks;
  /** Clusters currently selected in the dashboard. */
  selectedClusters: string[];
  /** Optional AI manager used for chat history tracking. */
  aiManager?: any; // Optional AI manager for history tracking
}

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

import type { ConversationMessage as Prompt } from '../../conversation/types';

/** Minimal manager history used to update Kubernetes tool-call messages. */
export interface KubernetesAIManagerContext {
  /** History entries whose tool IDs and names may be updated after execution. */
  history: Array<Pick<Prompt, 'role'> & Partial<Pick<Prompt, 'content' | 'toolCallId' | 'name'>>>;
}

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
    pendingPrompt?: Prompt;
  } | null;
  /** The latest API response returned to the UI. */
  apiResponse: unknown;
  /** Whether an API request is currently in progress. */
  apiLoading: boolean;
  /** The latest API request error message, if any. */
  apiRequestError: string | null;
}

/** UI callbacks used by the Kubernetes tool to update modal state and execute requests. */
export interface KubernetesToolUICallbacks {
  /**
   * Updates whether the API confirmation dialog is shown.
   *
   * @param show - Whether the confirmation dialog should be visible.
   * @returns No value.
   */
  setShowApiConfirmation: (show: boolean) => void;
  /**
   * Stores the pending API request details in UI state.
   *
   * @param request - Pending request details, or `null` to clear them.
   * @returns No value.
   */
  setApiRequest: (request: KubernetesToolUIState['apiRequest']) => void;
  /**
   * Stores the latest API response for display.
   *
   * @param response - API response payload, or `null` to clear it.
   * @returns No value.
   */
  setApiResponse: (response: unknown) => void;
  /**
   * Updates the loading state for API requests.
   *
   * @param loading - Whether an API request is in progress.
   * @returns No value.
   */
  setApiLoading: (loading: boolean) => void;
  /**
   * Stores the latest API request error.
   *
   * @param error - Human-readable error, or `null` to clear it.
   * @returns No value.
   */
  setApiRequestError: (error: string | null) => void;
  /**
   * Executes a Kubernetes API request through the UI layer.
   *
   * @param url - Kubernetes API path to request.
   * @param method - HTTP method used for the operation.
   * @param body - Optional serialized request body.
   * @param onClose - Optional callback invoked when the operation closes.
   * @param aiManager - Optional history context updated by the UI workflow.
   * @param resourceInfo - Optional resource metadata for dialogs and callbacks.
   * @param targetCluster - Optional cluster that should receive the request.
   * @param onFailure - Optional failure callback receiving error and operation details.
   * @param onSuccess - Optional success callback receiving response and operation details.
   * @returns The API response payload.
   */
  handleActualApiRequest: (
    url: string,
    method: string,
    body?: string,
    onClose?: () => void,
    aiManager?: KubernetesAIManagerContext,
    resourceInfo?: unknown,
    targetCluster?: string,
    onFailure?: (error: unknown, operationType: string, resourceInfo?: unknown) => void,
    onSuccess?: (response: unknown, operationType: string, resourceInfo?: unknown) => void
  ) => Promise<unknown>;
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
  aiManager?: KubernetesAIManagerContext;
}

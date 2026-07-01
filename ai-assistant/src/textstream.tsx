/**
 * Headlamp-specific TextStreamContainer wrapper.
 *
 * Thin wrapper around the framework-agnostic TextStreamContainer from ai-ui
 * that injects headlamp's ContentRenderer (with K8s link resolution) and
 * EditorDialog (with cluster apply support).
 */

import type { AgentThinkingStep } from '@headlamp-k8s/ai-common/agent/agentTypes';
import { Prompt } from '@headlamp-k8s/ai-common/ai/manager';
import TextStreamContainerBase from '@headlamp-k8s/ai-ui/components/chat/TextStreamContainer';
import React from 'react';
import ContentRenderer from './ContentRenderer';
import EditorDialog from './editordialog';

const TextStreamContainer = React.memo(function TextStreamContainer({
  history,
  isLoading,
  apiError,
  onOperationSuccess,
  onOperationFailure,
  onYamlAction,
  onRetryTool,
  agentThinkingSteps,
}: {
  history: Prompt[];
  isLoading: boolean;
  apiError: string | null;
  onOperationSuccess?: (response: any) => void;
  onOperationFailure?: (error: any, operationType: string, resourceInfo?: any) => void;
  onYamlAction?: (yaml: string, title: string, resourceType: string, isDelete: boolean) => void;
  onRetryTool?: (toolName: string, args: Record<string, any>) => void;
  promptWidth?: string;
  /** Live thinking steps streamed from the AKS agent during processing. */
  agentThinkingSteps?: AgentThinkingStep[];
}) {
  return (
    <TextStreamContainerBase
      history={history}
      isLoading={isLoading}
      apiError={apiError}
      onOperationSuccess={onOperationSuccess}
      onOperationFailure={onOperationFailure}
      onYamlAction={onYamlAction}
      onRetryTool={onRetryTool}
      agentThinkingSteps={agentThinkingSteps}
      ContentRendererSlot={ContentRenderer}
      EditorDialogSlot={EditorDialog}
    />
  );
});

export default TextStreamContainer;

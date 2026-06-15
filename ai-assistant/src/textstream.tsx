/**
 * Headlamp-specific TextStreamContainer wrapper.
 *
 * Thin wrapper around the framework-agnostic TextStreamContainer from ai-ui
 * that injects headlamp's ContentRenderer (with K8s link resolution) and
 * EditorDialog (with cluster apply support).
 */

import TextStreamContainerBase, {
  type TextStreamContainerProps,
} from '@headlamp-k8s/ai-ui/components/chat/TextStreamContainer';
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
  promptWidth,
  agentThinkingSteps,
}: Omit<TextStreamContainerProps, 'ContentRendererSlot' | 'EditorDialogSlot'>) {
  return (
    <TextStreamContainerBase
      history={history}
      isLoading={isLoading}
      apiError={apiError}
      onOperationSuccess={onOperationSuccess}
      onOperationFailure={onOperationFailure}
      onYamlAction={onYamlAction}
      onRetryTool={onRetryTool}
      promptWidth={promptWidth}
      agentThinkingSteps={agentThinkingSteps}
      ContentRendererSlot={ContentRenderer}
      EditorDialogSlot={EditorDialog}
    />
  );
});

export default TextStreamContainer;

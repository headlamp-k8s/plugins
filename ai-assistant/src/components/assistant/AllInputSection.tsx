import type { AIInputSectionProps as BaseProps } from '@headlamp-k8s/ai-ui/components/assistant/AllInputSection';
import { AIInputSection as AIInputSectionBase } from '@headlamp-k8s/ai-ui/components/assistant/AllInputSection';
import { ToolsDialog } from '@headlamp-k8s/ai-ui/components/assistant/ToolsDialog';
import { ActionButton } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';

type AIInputSectionProps = Omit<BaseProps, 'ToolsDialogSlot' | 'ActionButtonSlot'>;

export const AIInputSection: React.FC<AIInputSectionProps> = props => (
  <AIInputSectionBase {...props} ToolsDialogSlot={ToolsDialog} ActionButtonSlot={ActionButton} />
);

export default AIInputSection;

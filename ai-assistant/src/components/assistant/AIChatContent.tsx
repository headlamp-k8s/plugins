import type { AgentThinkingStep } from '@headlamp-k8s/ai-common/agents/types';
import type { ConversationMessage } from '@headlamp-k8s/ai-common/conversation/types';
import AIChatContentBase from '@headlamp-k8s/ai-ui/components/assistant/AIChatContent';
import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import TextStreamContainer from '../../textstream';

/** Props for the AIChatContent component that renders the chat message history. */
interface AIChatContentProps {
  /** Array of chat messages (prompts and responses) to display. */
  history: ConversationMessage[];
  /** Whether an AI response is currently being generated. */
  isLoading: boolean;
  /** Error message from the last API call, or null if none. */
  apiError: string | null;
  /** Callback invoked when a Kubernetes API operation succeeds. */
  onOperationSuccess: (response: any) => void;
  /** Callback invoked when a Kubernetes API operation fails. */
  onOperationFailure: (error: any, operationType: string, resourceInfo?: any) => void;
  /** Callback invoked when the user triggers a YAML apply/delete action. */
  onYamlAction: (yaml: string, title: string, type: string, isDeleteOp: boolean) => void;
  /** Callback to retry a failed tool invocation with the given name and arguments. */
  onRetryTool?: (toolName: string, args: Record<string, any>) => void;
  /** Live thinking steps streamed from the AKS agent during processing. */
  agentThinkingSteps?: AgentThinkingStep[];
}

function SettingsLink({ children }: { children: React.ReactNode }) {
  return (
    <Link routeName="pluginDetails" params={{ name: '@headlamp-k8s/ai-assistant' }}>
      {children}
    </Link>
  );
}

export default function AIChatContent(props: AIChatContentProps) {
  return (
    <AIChatContentBase
      {...props}
      TextStreamSlot={TextStreamContainer}
      SettingsLinkSlot={SettingsLink}
    />
  );
}

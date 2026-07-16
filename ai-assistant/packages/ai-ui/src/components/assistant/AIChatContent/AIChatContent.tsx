import type { AgentThinkingStep } from '@headlamp-k8s/ai-common/agents/types';
import type { ConversationMessage } from '@headlamp-k8s/ai-common/conversation/types';
import type { ArgumentMap } from '@headlamp-k8s/ai-common/mcp/tools/types';
import { Alert, Box } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

/** Props forwarded to the host-provided chat stream renderer. */
export interface AIChatTextStreamProps {
  /** Conversation messages to render. */
  history: ConversationMessage[];
  /** Whether an assistant response is being generated. */
  isLoading: boolean;
  /** Current API error, if one exists. */
  apiError: string | null;
  /** Receives a successful Kubernetes operation response. */
  onOperationSuccess: (response: unknown) => void;
  /** Receives a failed Kubernetes operation and optional resource metadata. */
  onOperationFailure: (error: unknown, operationType: string, resourceInfo?: unknown) => void;
  /** Applies or deletes a YAML resource through the host. */
  onYamlAction: (yaml: string, title: string, type: string, isDeleteOp: boolean) => void;
  /** Retries a named tool with its validated argument map. */
  onRetryTool?: (toolName: string, args: ArgumentMap) => void;
  /** Live agent activity displayed while a response is generated. */
  agentThinkingSteps?: AgentThinkingStep[];
}

/** Props for the AIChatContent component that renders the chat message history. */
export interface AIChatContentProps {
  /** Array of chat messages (prompts and responses) to display. */
  history: ConversationMessage[];
  /** Whether an AI response is currently being generated. */
  isLoading: boolean;
  /** Error message from the last API call, or null if none. */
  apiError: string | null;
  /** Callback invoked when a Kubernetes API operation succeeds. */
  onOperationSuccess: (response: unknown) => void;
  /** Callback invoked when a Kubernetes API operation fails. */
  onOperationFailure: (error: unknown, operationType: string, resourceInfo?: unknown) => void;
  /** Callback invoked when the user triggers a YAML apply/delete action. */
  onYamlAction: (yaml: string, title: string, type: string, isDeleteOp: boolean) => void;
  /** Callback to retry a failed tool invocation with the given name and arguments. */
  onRetryTool?: (toolName: string, args: ArgumentMap) => void;
  /** Live thinking steps streamed from the agent during processing. */
  agentThinkingSteps?: AgentThinkingStep[];
  /** Component to render the chat text stream. */
  TextStreamSlot: React.ComponentType<AIChatTextStreamProps>;
  /** Component or element to render the settings link in error alerts. */
  SettingsLinkSlot?: React.ComponentType<{ children: React.ReactNode }>;
}

/**
 * Renders chat history through a host stream slot and displays API errors.
 *
 * @param props - Chat state, operation callbacks, and host rendering slots.
 * @returns Scrollable chat content and optional error alert.
 */
export default function AIChatContent({
  history,
  isLoading,
  apiError,
  onOperationSuccess,
  onOperationFailure,
  onYamlAction,
  onRetryTool,
  agentThinkingSteps,
  TextStreamSlot,
  SettingsLinkSlot,
}: AIChatContentProps): React.ReactElement {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'auto',
        maxWidth: '100%',
        minWidth: 0,
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
      }}
    >
      {apiError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            SettingsLinkSlot ? <SettingsLinkSlot>{t('Settings')}</SettingsLinkSlot> : undefined
          }
        >
          {apiError}
        </Alert>
      )}

      <TextStreamSlot
        history={history}
        isLoading={isLoading}
        apiError={apiError}
        onOperationSuccess={onOperationSuccess}
        onOperationFailure={onOperationFailure}
        onYamlAction={onYamlAction}
        onRetryTool={onRetryTool}
        agentThinkingSteps={agentThinkingSteps}
      />
    </Box>
  );
}

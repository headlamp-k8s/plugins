import { Prompt } from '@headlamp-k8s/ai-common/ai/manager';
import { Alert, Box, Button } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

/** Props for the AIChatContent component that renders the chat message history. */
export interface AIChatContentProps {
  /** Array of chat messages (prompts and responses) to display. */
  history: Prompt[];
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
  /** Live thinking steps from the agent (type is kept generic for platform independence). */
  agentThinkingSteps?: any[];
  /** Component to render the chat text stream. */
  TextStreamSlot: React.ComponentType<any>;
  /** Component or element to render the settings link in error alerts. */
  SettingsLinkSlot?: React.ComponentType<{ children: React.ReactNode }>;
}

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
}: AIChatContentProps) {
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
            SettingsLinkSlot ? (
              <Button color="inherit" size="small">
                <SettingsLinkSlot>{t('Settings')}</SettingsLinkSlot>
              </Button>
            ) : undefined
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

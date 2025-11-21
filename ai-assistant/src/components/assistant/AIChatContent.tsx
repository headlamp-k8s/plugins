import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Alert, Box, Button } from '@mui/material';
import React from 'react';
import { Prompt } from '../../ai/manager';
import TextStreamContainer from '../../textstream';

interface AIChatContentProps {
  history: Prompt[];
  isLoading: boolean;
  apiError: string | null;
  onOperationSuccess: (response: any) => void;
  onOperationFailure: (error: any, operationType: string, resourceInfo?: any) => void;
  onYamlAction: (yaml: string, title: string, type: string, isDeleteOp: boolean) => void;
  onRetryTool?: (toolName: string, args: Record<string, any>) => void;
}

export default function AIChatContent({
  history,
  isLoading,
  apiError,
  onOperationSuccess,
  onOperationFailure,
  onYamlAction,
  onRetryTool,
}: AIChatContentProps) {
  return (
    <Box
      sx={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'auto', // Allow horizontal scrolling when needed
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
            <Button color="inherit" size="small">
              <Link
                routeName="pluginDetails"
                params={{
                  name: '@headlamp-k8s/ai-assistant',
                }}
              >
                Settings
              </Link>
            </Button>
          }
        >
          {apiError}
        </Alert>
      )}

      <TextStreamContainer
        history={history}
        isLoading={isLoading}
        apiError={apiError}
        onOperationSuccess={onOperationSuccess}
        onOperationFailure={onOperationFailure}
        onYamlAction={onYamlAction}
        onRetryTool={onRetryTool}
      />
    </Box>
  );
}

import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Alert, Box, Button } from '@mui/material';
import React from 'react';
import { Prompt } from '../ai/manager';
import TextStreamContainer from '../textstream';

interface AIChatContentProps {
  history: Prompt[];
  isLoading: boolean;
  apiError: string | null;
  onOperationSuccess: (response: any) => void;
  onYamlAction: (yaml: string, title: string, type: string, isDeleteOp: boolean) => void;
}

export default function AIChatContent({
  history,
  isLoading,
  apiError,
  onOperationSuccess,
  onYamlAction,
}: AIChatContentProps) {
  return (
    <Box
      sx={{
        height: '100%',
        overflowY: 'auto',
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
                  name: '@headlamp-k8s/headlamp-ai',
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
        onYamlAction={onYamlAction}
      />
    </Box>
  );
}

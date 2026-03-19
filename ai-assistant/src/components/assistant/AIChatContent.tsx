import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Alert, Box, Button } from '@mui/material';
import React from 'react';
import { Prompt } from '../../ai/manager';
// [PROACTIVE_DIAGNOSIS_DISABLED] import { useProactiveDiagnosis } from '../../hooks/useProactiveDiagnosis';
import TextStreamContainer from '../../textstream';
// [PROACTIVE_DIAGNOSIS_DISABLED] import ProactiveDiagnosisSection from './ProactiveDiagnosisSection';

interface AIChatContentProps {
  history: Prompt[];
  isLoading: boolean;
  apiError: string | null;
  onOperationSuccess: (response: any) => void;
  onOperationFailure: (error: any, operationType: string, resourceInfo?: any) => void;
  onYamlAction: (yaml: string, title: string, type: string, isDeleteOp: boolean) => void;
}

export default function AIChatContent({
  history,
  isLoading,
  apiError,
  onOperationSuccess,
  onOperationFailure,
  onYamlAction,
}: AIChatContentProps) {
  // [PROACTIVE_DIAGNOSIS_DISABLED]
  // const { diagnoses, isCycleRunning, scrollToEventUid, clearScrollTarget } =
  //   useProactiveDiagnosis();

  return (
    <Box
      sx={{
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* [PROACTIVE_DIAGNOSIS_DISABLED]
      <ProactiveDiagnosisSection
        diagnoses={diagnoses}
        scrollToEventUid={scrollToEventUid}
        onScrollComplete={clearScrollTarget}
        isCycleRunning={isCycleRunning}
        onYamlAction={onYamlAction}
      />
      */}

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
      />
    </Box>
  );
}

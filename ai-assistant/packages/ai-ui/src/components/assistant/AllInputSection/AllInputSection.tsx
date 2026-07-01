import { getProviderById } from '@headlamp-k8s/ai-common/config/modelConfig';
import { StoredProviderConfig } from '@headlamp-k8s/ai-common/managers/ProviderConfigManager';
import { Icon } from '@iconify/react';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  ListSubheader,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { getModelDisplayName, getProviderModelsForChat } from '../../../providers/modelProviders';
import { DefaultActionButton } from '../../defaults/DefaultSlots/DefaultSlots';
import type { ActionButtonSlotProps } from '../AIAssistantHeader/AIAssistantHeader';
import TestModeInput from '../TestModeInput/TestModeInput';

export type { ActionButtonSlotProps } from '../AIAssistantHeader/AIAssistantHeader';

/** Chat or agent mode selection. */
export type ChatMode = 'chat' | 'agent';

/** Props for a tools dialog component injected via composition. */
export interface ToolsDialogSlotProps {
  /** Whether the dialog is currently visible. */
  open: boolean;
  /** Callback invoked when the dialog is closed. */
  onClose: () => void;
  /** Array of currently enabled tool identifiers. */
  enabledTools: string[];
  /** Callback invoked when the set of enabled tools changes. */
  onToolsChange: (enabledTools: string[]) => void;
}

/** Props for the AIInputSection component that contains the chat input and controls. */
export interface AIInputSectionProps {
  /** Current value of the prompt text field. */
  promptVal: string;
  /** Setter for the prompt text field value. */
  setPromptVal: (value: string) => void;
  /** Whether an AI request is currently in progress. */
  loading: boolean;
  /** Whether the assistant is operating in test mode. */
  isTestMode: boolean;
  /** The currently active provider configuration, or null if none is set. */
  activeConfig: StoredProviderConfig | null;
  /** All available saved provider configurations. */
  availableConfigs: StoredProviderConfig[];
  /** The currently selected model identifier. */
  selectedModel: string;
  /** Whether agent (multi-step) mode is enabled. */
  isAgentMode?: boolean;
  /** Current status of the agent mode availability check. */
  agentModeStatus?: 'idle' | 'checking' | 'found' | 'not-found';
  /** Whether a proactive diagnosis cycle is currently running. */
  isDiagnosisRunning?: boolean;
  /** Array of currently enabled tool identifiers. */
  enabledTools: string[];
  /** Callback to send a user prompt to the AI. */
  onSend: (prompt: string) => void;
  /** Callback to stop a running AI request. */
  onStop: () => void;
  /** Callback to clear the chat history. */
  onClearHistory: () => void;
  /** Callback invoked when the provider configuration or model selection changes. */
  onConfigChange: (config: StoredProviderConfig, model: string) => void;
  /** Callback to toggle agent mode on or off. */
  onToggleAgentMode?: (enabled: boolean) => void;
  /** Callback to inject a test-mode response into the chat. */
  onTestModeResponse: (
    content: string | object,
    type: 'assistant' | 'user',
    hasError?: boolean
  ) => void;
  /** Callback invoked when the set of enabled tools changes. */
  onToolsChange: (enabledTools: string[]) => void;
  /** Chat mode ('chat' or 'agent'). */
  chatMode?: ChatMode;
  /** Callback to change the chat mode. */
  onChatModeChange?: (mode: ChatMode) => void;
  /** Optional component to render the tools dialog. */
  ToolsDialogSlot?: React.ComponentType<ToolsDialogSlotProps>;
  /** Component used to render icon action buttons. Falls back to MUI IconButton + Tooltip. */
  ActionButtonSlot?: React.ComponentType<ActionButtonSlotProps>;
}

export const AIInputSection: React.FC<AIInputSectionProps> = ({
  promptVal,
  setPromptVal,
  loading,
  isTestMode,
  activeConfig,
  availableConfigs,
  selectedModel,
  isAgentMode = false,
  agentModeStatus = 'idle',
  isDiagnosisRunning = false,
  enabledTools,
  onSend,
  onStop,
  onClearHistory,
  onConfigChange,
  onTestModeResponse,
  onToggleAgentMode,
  onToolsChange,
  chatMode = 'chat',
  onChatModeChange,
  ToolsDialogSlot,
  ActionButtonSlot = DefaultActionButton,
}) => {
  const { t } = useTranslation();
  const [showToolsDialog, setShowToolsDialog] = React.useState(false);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (isDiagnosisRunning) return;
      const prompt = promptVal;
      setPromptVal('');
      onSend(prompt);
    }
  };

  const handleSendClick = () => {
    if (isDiagnosisRunning) return;
    const prompt = promptVal;
    setPromptVal('');
    onSend(prompt);
  };

  const handleProviderModelChange = (value: string) => {
    const [providerId, ...modelNameParts] = value.split('-');
    const modelName = modelNameParts.join('-');
    const newConfig = availableConfigs.find(c => c.providerId === providerId);
    if (newConfig) {
      onConfigChange(newConfig, modelName);
    }
  };

  const getCurrentValue = () => {
    if (!activeConfig) return 'default-default';
    const providerId = activeConfig.providerId;
    const modelName = selectedModel;
    return `${providerId}-${modelName}`;
  };

  const renderSelectValue = (selected: string) => {
    const [providerId, ...modelNameParts] = selected.split('-');
    const modelName = modelNameParts.join('-');
    const selectedConfig = availableConfigs.find(c => c.providerId === providerId);
    const providerInfo = selectedConfig ? getProviderById(selectedConfig.providerId) : null;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {providerInfo && (
          <Icon
            icon={providerInfo.icon || 'mdi:robot'}
            width="16px"
            height="16px"
            style={{ marginRight: 4 }}
          />
        )}
        <Typography variant="body2" noWrap>
          {getModelDisplayName(modelName)}
        </Typography>
      </Box>
    );
  };

  return (
    <Box>
      {/* Test Mode Input Component */}
      <TestModeInput onAddTestResponse={onTestModeResponse} isTestMode={isTestMode} />

      {/* Proactive diagnosis in-progress banner */}
      {isDiagnosisRunning && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1,
            mb: 1,
            borderRadius: 1,
            bgcolor: 'info.main',
            color: 'info.contrastText',
          }}
        >
          <CircularProgress size={16} sx={{ color: 'inherit' }} />
          <Typography variant="body2">
            {t('Proactive diagnosis in progress — please wait for it to complete before chatting.')}
          </Typography>
        </Box>
      )}

      <TextField
        id="deployment-ai-prompt"
        onChange={event => setPromptVal(event.target.value)}
        onKeyDown={handleKeyDown}
        variant="outlined"
        value={promptVal}
        label={
          isTestMode
            ? t('Type user message (Test Mode)')
            : isAgentMode
            ? t('Ask Holmes (Agent Mode)')
            : t('Ask AI')
        }
        multiline
        fullWidth
        disabled={isDiagnosisRunning}
        minRows={2}
        sx={{
          width: '100%',
          '& .MuiInputBase-root': {
            wordWrap: 'break-word',
            overflowX: 'hidden',
          },
        }}
      />

      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
        sx={{
          '& > .MuiGrid-item': {
            maxWidth: '100% !important',
          },
        }}
      >
        <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
          <ActionButtonSlot
            description={t('Clear History')}
            icon="mdi:broom"
            onClick={onClearHistory}
          />

          {/* Mode Selector: Chat / Holmes Agent */}
          {!isTestMode && onToggleAgentMode && (
            <Box ml={1}>
              <Select
                value={isAgentMode ? 'agent' : 'chat'}
                onChange={e => {
                  const mode = e.target.value;
                  onToggleAgentMode(mode === 'agent');
                }}
                size="small"
                sx={{ minWidth: 150, height: 32 }}
                variant="outlined"
                disabled={agentModeStatus === 'checking'}
                renderValue={selected => (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Icon
                      icon={selected === 'agent' ? 'mdi:robot' : 'mdi:chat'}
                      width="16px"
                      height="16px"
                      style={{ marginRight: 6 }}
                    />
                    <Typography variant="body2">
                      {selected === 'agent' ? t('Holmes Agent') : t('Chat')}
                    </Typography>
                  </Box>
                )}
              >
                <MenuItem value="chat">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon icon="mdi:chat" width="16px" height="16px" />
                    <Typography variant="body2">{t('Chat')}</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="agent">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon icon="mdi:robot" width="16px" height="16px" />
                    <Typography variant="body2">{t('Holmes Agent')}</Typography>
                  </Box>
                </MenuItem>
              </Select>
            </Box>
          )}

          {/* Provider Selection Dropdown – hidden in agent mode */}
          {availableConfigs.length > 0 && !isTestMode && !isAgentMode && (
            <Box ml={2} sx={{ display: 'flex', alignItems: 'center' }}>
              <Select
                value={getCurrentValue()}
                onChange={e => handleProviderModelChange(String(e.target.value))}
                size="small"
                sx={{ minWidth: 180, height: 32 }}
                variant="outlined"
                renderValue={renderSelectValue}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 320,
                    },
                  },
                }}
              >
                {availableConfigs.map(config => {
                  const providerInfo = getProviderById(config.providerId);
                  const models = getProviderModelsForChat(config, availableConfigs);
                  return [
                    <ListSubheader
                      key={`provider-header-${config.providerId}`}
                      sx={{ display: 'flex', alignItems: 'center', paddingLeft: 1 }}
                    >
                      <Icon
                        icon={providerInfo?.icon || 'mdi:robot'}
                        width="16px"
                        height="16px"
                        style={{ marginRight: 8 }}
                      />
                      {config.displayName || providerInfo?.name || config.providerId}
                    </ListSubheader>,
                    ...models.map(model => (
                      <MenuItem
                        key={`${config.providerId}-${model}`}
                        value={`${config.providerId}-${model}`}
                        selected={
                          activeConfig?.providerId === config.providerId && selectedModel === model
                        }
                        sx={{ paddingLeft: 2 }}
                      >
                        <Typography variant="body2">{getModelDisplayName(model)}</Typography>
                        {activeConfig?.providerId === config.providerId &&
                          selectedModel === model && (
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{ ml: 1, color: 'primary.main' }}
                            >
                              {t('(Default)')}
                            </Typography>
                          )}
                      </MenuItem>
                    )),
                  ];
                })}
              </Select>
            </Box>
          )}

          {/* Tools Button */}
          {!isTestMode && !isAgentMode && (
            <Box ml={1}>
              <ActionButtonSlot
                description={t('Manage Tools')}
                icon="mdi:tools"
                onClick={() => setShowToolsDialog(true)}
              />
            </Box>
          )}
        </Grid>

        <Grid item>
          {loading && !isDiagnosisRunning ? (
            <Button
              variant="contained"
              color="secondary"
              endIcon={<Icon icon="mdi:stop" width="20px" />}
              onClick={onStop}
              size="small"
            >
              {t('Stop')}
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={<Icon icon="mdi:send" width="20px" />}
              onClick={handleSendClick}
              size="small"
              disabled={loading || isDiagnosisRunning || !promptVal}
            >
              {t('Send')}
            </Button>
          )}
        </Grid>
      </Grid>

      {/* Tools Dialog */}
      {ToolsDialogSlot && (
        <ToolsDialogSlot
          open={showToolsDialog}
          onClose={() => setShowToolsDialog(false)}
          enabledTools={enabledTools}
          onToolsChange={onToolsChange}
        />
      )}
    </Box>
  );
};

export default AIInputSection;

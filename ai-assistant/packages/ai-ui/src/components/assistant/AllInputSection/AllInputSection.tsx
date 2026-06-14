import { getProviderById } from '@headlamp-k8s/ai-common/providers/catalog';
import type { StoredProviderConfig } from '@headlamp-k8s/ai-common/providers/savedConfigs';
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
  /** Commits enabled built-in tools, optionally through an asynchronous host operation. */
  onToolsChange: (enabledTools: string[]) => void | Promise<void>;
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
  /** Commits enabled built-in tools, optionally through an asynchronous host operation. */
  onToolsChange: (enabledTools: string[]) => void | Promise<void>;
  /** Chat mode ('chat' or 'agent'). */
  /** @deprecated Use `isAgentMode` and `onToggleAgentMode`; remove in the next major release. */
  chatMode?: ChatMode;
  /** Callback to change the chat mode. */
  /** @deprecated Use `onToggleAgentMode`; remove in the next major release. */
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
  isAgentMode,
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
  const agentModeEnabled = isAgentMode ?? chatMode === 'agent';
  const handleAgentModeChange = (enabled: boolean): void => {
    if (onToggleAgentMode) {
      onToggleAgentMode(enabled);
    } else {
      onChatModeChange?.(enabled ? 'agent' : 'chat');
    }
  };
  const submitPrompt = (): void => {
    const prompt = promptVal.trim();
    if (!prompt || loading || isDiagnosisRunning) return;
    setPromptVal('');
    onSend(prompt);
  };

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submitPrompt();
    }
  };

  const handleSendClick = (): void => submitPrompt();

  const handleProviderModelChange = (value: string): void => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      return;
    }
    if (!Array.isArray(parsed) || parsed.length !== 2) return;
    const [configIndex, modelName] = parsed;
    if (!Number.isInteger(configIndex) || typeof modelName !== 'string') return;
    const newConfig = availableConfigs[configIndex as number];
    if (newConfig) {
      onConfigChange(newConfig, modelName);
    }
  };

  const getCurrentValue = (): string => {
    if (!activeConfig) return JSON.stringify(['default', 'default']);
    const configIndex = availableConfigs.indexOf(activeConfig);
    const modelName = selectedModel;
    return JSON.stringify([configIndex, modelName]);
  };

  const renderSelectValue = (selected: string): React.ReactNode => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(selected);
    } catch {
      parsed = [];
    }
    const configIndex = Array.isArray(parsed) && Number.isInteger(parsed[0]) ? parsed[0] : -1;
    const modelName = Array.isArray(parsed) && typeof parsed[1] === 'string' ? parsed[1] : '';
    const selectedConfig = availableConfigs[configIndex as number];
    const providerInfo = selectedConfig ? getProviderById(selectedConfig.providerId) : null;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {providerInfo && (
          <Icon
            icon={providerInfo.icon || 'mdi:robot'}
            width="16px"
            height="16px"
            style={{ marginRight: 4 }}
            aria-hidden="true"
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
          <CircularProgress
            size={16}
            aria-label={t('Proactive diagnosis progress')}
            sx={{ color: 'inherit' }}
          />
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
            : agentModeEnabled
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
            iconButtonProps={{ disabled: loading || isDiagnosisRunning }}
          />

          {/* Mode Selector: Chat / Holmes Agent */}
          {!isTestMode && (onToggleAgentMode || onChatModeChange) && (
            <Box ml={1}>
              <Select
                inputProps={{ 'aria-label': t('Assistant mode') }}
                value={agentModeEnabled ? 'agent' : 'chat'}
                onChange={e => {
                  const mode = e.target.value;
                  handleAgentModeChange(mode === 'agent');
                }}
                size="small"
                sx={{ minWidth: 150, height: 32 }}
                variant="outlined"
                disabled={loading || isDiagnosisRunning || agentModeStatus === 'checking'}
                renderValue={selected => (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Icon
                      icon={selected === 'agent' ? 'mdi:robot' : 'mdi:chat'}
                      width="16px"
                      height="16px"
                      style={{ marginRight: 6 }}
                      aria-hidden="true"
                    />
                    <Typography variant="body2">
                      {selected === 'agent' ? t('Holmes Agent') : t('Chat')}
                    </Typography>
                  </Box>
                )}
              >
                <MenuItem value="chat">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon icon="mdi:chat" width="16px" height="16px" aria-hidden="true" />
                    <Typography variant="body2">{t('Chat')}</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="agent">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon icon="mdi:robot" width="16px" height="16px" aria-hidden="true" />
                    <Typography variant="body2">{t('Holmes Agent')}</Typography>
                  </Box>
                </MenuItem>
              </Select>
            </Box>
          )}

          {/* Provider Selection Dropdown – hidden in agent mode */}
          {availableConfigs.length > 0 && !isTestMode && !agentModeEnabled && (
            <Box ml={2} sx={{ display: 'flex', alignItems: 'center' }}>
              <Select
                inputProps={{ 'aria-label': t('Provider and model') }}
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
                {availableConfigs.map((config, configIndex) => {
                  const providerInfo = getProviderById(config.providerId);
                  const models = getProviderModelsForChat(config, availableConfigs);
                  return [
                    <ListSubheader
                      key={`provider-header-${configIndex}`}
                      sx={{ display: 'flex', alignItems: 'center', paddingLeft: 1 }}
                    >
                      <Icon
                        icon={providerInfo?.icon || 'mdi:robot'}
                        width="16px"
                        height="16px"
                        style={{ marginRight: 8 }}
                        aria-hidden="true"
                      />
                      {config.displayName || providerInfo?.name || config.providerId}
                    </ListSubheader>,
                    ...models.map(model => (
                      <MenuItem
                        key={`${configIndex}-${model}`}
                        value={JSON.stringify([configIndex, model])}
                        selected={activeConfig === config && selectedModel === model}
                        sx={{ paddingLeft: 2 }}
                      >
                        <Typography variant="body2">{getModelDisplayName(model)}</Typography>
                        {activeConfig === config && selectedModel === model && (
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
          {!isTestMode && !agentModeEnabled && (
            <Box ml={1}>
              <ActionButtonSlot
                description={t('Manage Tools')}
                icon="mdi:tools"
                onClick={() => setShowToolsDialog(true)}
                iconButtonProps={{ disabled: loading || isDiagnosisRunning }}
              />
            </Box>
          )}
        </Grid>

        <Grid item>
          {loading && !isDiagnosisRunning ? (
            <Button
              variant="contained"
              color="secondary"
              endIcon={<Icon icon="mdi:stop" width="20px" aria-hidden="true" />}
              onClick={onStop}
              size="small"
            >
              {t('Stop')}
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={<Icon icon="mdi:send" width="20px" aria-hidden="true" />}
              onClick={handleSendClick}
              size="small"
              disabled={loading || isDiagnosisRunning || !promptVal.trim()}
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

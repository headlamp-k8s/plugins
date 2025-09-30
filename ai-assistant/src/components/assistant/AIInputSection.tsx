import { Icon } from '@iconify/react';
import { ActionButton } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Box,
  Button,
  Grid,
  ListSubheader,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';
import { getProviderById } from '../../config/modelConfig';
import { getModelDisplayName, getProviderModelsForChat } from '../../utils/modalUtils';
import { StoredProviderConfig } from '../../utils/ProviderConfigManager';
import TestModeInput from './TestModeInput';
import { ToolsDialog } from './ToolsDialog';

interface AIInputSectionProps {
  promptVal: string;
  setPromptVal: (value: string) => void;
  loading: boolean;
  isTestMode: boolean;
  activeConfig: StoredProviderConfig | null;
  availableConfigs: StoredProviderConfig[];
  selectedModel: string;
  enabledTools: string[];
  onSend: (prompt: string) => void;
  onStop: () => void;
  onClearHistory: () => void;
  onConfigChange: (config: StoredProviderConfig, model: string) => void;
  onTestModeResponse: (content: string | object, type: 'assistant' | 'user', hasError?: boolean) => void;
  onToolsChange: (enabledTools: string[]) => void;
}

export const AIInputSection: React.FC<AIInputSectionProps> = ({
  promptVal,
  setPromptVal,
  loading,
  isTestMode,
  activeConfig,
  availableConfigs,
  selectedModel,
  enabledTools,
  onSend,
  onStop,
  onClearHistory,
  onConfigChange,
  onTestModeResponse,
  onToolsChange,
}) => {
  const [showToolsDialog, setShowToolsDialog] = React.useState(false);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const prompt = promptVal;
      setPromptVal('');
      onSend(prompt);
    }
  };

  const handleSendClick = () => {
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

      <TextField
        id="deployment-ai-prompt"
        onChange={event => setPromptVal(event.target.value)}
        onKeyDown={handleKeyDown}
        variant="outlined"
        value={promptVal}
        label={isTestMode ? 'Type user message (Test Mode)' : 'Ask AI'}
        multiline
        fullWidth
        minRows={2}
        sx={{
          width: '100%',
          '& .MuiInputBase-root': {
            wordWrap: 'break-word',
            overflowX: 'hidden',
          },
        }}
      />

      <Grid container justifyContent="space-between" alignItems="center">
        <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
          <ActionButton description="Clear History" onClick={onClearHistory} icon="mdi:broom" />

          {/* Provider Selection Dropdown */}
          {availableConfigs.length > 0 && !isTestMode && (
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
                              (Default)
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
          {!isTestMode && (
            <Box ml={1}>
              <ActionButton
                description="Manage Tools"
                onClick={() => setShowToolsDialog(true)}
                icon="mdi:tools"
                iconButtonProps={{
                  size: 'small',
                }}
              />
            </Box>
          )}
        </Grid>

        <Grid item>
          {loading ? (
            <Button
              variant="contained"
              color="secondary"
              endIcon={<Icon icon="mdi:stop" width="20px" />}
              onClick={onStop}
              size="small"
            >
              Stop
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={<Icon icon="mdi:send" width="20px" />}
              onClick={handleSendClick}
              size="small"
              disabled={loading || !promptVal}
            >
              Send
            </Button>
          )}
        </Grid>
      </Grid>

      {/* Tools Dialog */}
      <ToolsDialog
        open={showToolsDialog}
        onClose={() => setShowToolsDialog(false)}
        enabledTools={enabledTools}
        onToolsChange={onToolsChange}
      />
    </Box>
  );
};

import { Icon } from '@iconify/react';
import {
  Box,
  Button,
  Chip,
  Divider,
  FormHelperText,
  Grid,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { getProviderById, getProviderFields, modelProviders } from '../config/modelConfig';
import { StoredProviderConfig } from '../utils/ProviderConfigManager';

interface ModelSelectorProps {
  selectedProvider: string;
  config: Record<string, any>;
  onProviderChange: (providerId: string) => void;
  onConfigChange: (config: Record<string, any>) => void;
  savedConfigs?: StoredProviderConfig[];
  onSaveConfig?: (providerId: string, config: Record<string, any>, makeDefault: boolean) => void;
  onSelectSavedConfig?: (config: StoredProviderConfig) => void;
  configName?: string;
  onConfigNameChange?: (name: string) => void;
}

export default function ModelSelector({
  selectedProvider,
  config,
  onProviderChange,
  onConfigChange,
  savedConfigs = [],
  onSaveConfig,
  onSelectSavedConfig,
  configName = '',
  onConfigNameChange,
}: ModelSelectorProps) {
  const [isCustomName, setIsCustomName] = useState(false);

  // Track if this is a new configuration being edited
  const isNewConfig = !savedConfigs.some(
    sc => sc.providerId === selectedProvider && areConfigsSimilar(sc.config, config)
  );

  const handleFieldChange = (fieldName: string, value: any) => {
    onConfigChange({
      ...config,
      [fieldName]: value,
    });
  };

  // Compare two configuration objects to see if they're essentially the same
  function areConfigsSimilar(config1: Record<string, any>, config2: Record<string, any>): boolean {
    // Compare key fields based on provider type
    if (config1.apiKey && config2.apiKey) {
      return config1.apiKey === config2.apiKey;
    }
    if (config1.baseUrl && config2.baseUrl) {
      return config1.baseUrl === config2.baseUrl;
    }
    return false;
  }

  const provider = getProviderById(selectedProvider);
  const fields = getProviderFields(selectedProvider);

  // Generate a name for the config if not provided
  useEffect(() => {
    if (!isCustomName && onConfigNameChange && provider) {
      // Only auto-generate name if it hasn't been manually edited
      let name = '';

      if (config.displayName) {
        name = config.displayName;
      } else {
        switch (selectedProvider) {
          case 'openai':
            name = `OpenAI (${config.model || 'gpt-4o'})`;
            break;
          case 'azure':
            name = `Azure (${config.deploymentName || ''})`;
            break;
          case 'anthropic':
            name = `Anthropic (${config.model || 'claude'})`;
            break;
          case 'local':
            name = `${config.model || 'Local model'}`;
            break;
          default:
            name = selectedProvider;
        }
      }
      onConfigNameChange(name);
    }
  }, [selectedProvider, config, onConfigNameChange, isCustomName, provider]);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Saved Configurations Section */}
      {savedConfigs.length > 0 && onSelectSavedConfig && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Saved Configurations
          </Typography>

          <Grid container spacing={2}>
            {savedConfigs.map((savedConfig, index) => {
              const isActive =
                savedConfig.providerId === selectedProvider &&
                areConfigsSimilar(savedConfig.config, config);

              // Find provider info for icon
              const savedProvider = getProviderById(savedConfig.providerId);

              return (
                <Grid item key={index} xs={6} md={4} lg={3}>
                  <Paper
                    elevation={isActive ? 3 : 1}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: isActive ? '2px solid' : '1px solid',
                      borderColor: isActive ? 'primary.main' : 'divider',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.light',
                      },
                    }}
                    onClick={() => onSelectSavedConfig(savedConfig)}
                  >
                    {savedConfig.isDefault && (
                      <Chip
                        label="Default"
                        size="small"
                        color="primary"
                        sx={{
                          position: 'absolute',
                          top: -10,
                          right: -10,
                          fontSize: '0.7rem',
                        }}
                      />
                    )}
                    <Icon
                      icon={savedProvider?.icon || 'mdi:robot'}
                      width="24px"
                      height="24px"
                      style={{ marginBottom: '8px' }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 'medium', textAlign: 'center' }}>
                      {savedConfig.displayName || savedConfig.config.displayName || 'Saved Config'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" align="center">
                      {savedProvider?.name || savedConfig.providerId}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {isNewConfig ? 'Configure New Provider' : 'Edit Configuration'}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {modelProviders.map(provider => (
          <Grid item key={provider.id} xs={6} md={3}>
            <Paper
              elevation={selectedProvider === provider.id ? 3 : 1}
              sx={{
                p: 2,
                cursor: 'pointer',
                border: selectedProvider === provider.id ? '2px solid' : '1px solid',
                borderColor: selectedProvider === provider.id ? 'primary.main' : 'divider',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                },
              }}
              onClick={() => onProviderChange(provider.id)}
            >
              <Icon icon={provider.icon} width="32px" height="32px" />
              <Typography variant="body1" sx={{ mt: 1, fontWeight: 'medium' }}>
                {provider.name}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {provider && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Configure {provider.name}
          </Typography>

          {onConfigNameChange && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Configuration Name
              </Typography>
              <TextField
                value={configName}
                onChange={e => {
                  setIsCustomName(true);
                  onConfigNameChange(e.target.value);
                }}
                size="small"
                fullWidth
                placeholder="Give this configuration a name"
                helperText="A friendly name to identify this configuration"
              />
            </Box>
          )}

          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            {provider.description}
          </Typography>

          <Grid container spacing={2}>
            {fields.map(field => (
              <Grid item xs={12} md={6} key={field.name}>
                {field.type === 'select' ? (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {field.label}
                      {field.required && (
                        <Box component="span" sx={{ color: 'error.main' }}>
                          {' '}
                          *
                        </Box>
                      )}
                    </Typography>
                    <Select
                      value={config[field.name] || ''}
                      onChange={e => handleFieldChange(field.name, e.target.value)}
                      fullWidth
                      size="small"
                      displayEmpty
                    >
                      <MenuItem value="" disabled>
                        <em>Select {field.label}</em>
                      </MenuItem>
                      {field.options?.map(option => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                    {field.description && <FormHelperText>{field.description}</FormHelperText>}
                  </Box>
                ) : field.type === 'number' ? (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {field.label}
                      {field.required && (
                        <Box component="span" sx={{ color: 'error.main' }}>
                          {' '}
                          *
                        </Box>
                      )}
                    </Typography>
                    <TextField
                      type="number"
                      value={config[field.name] || ''}
                      onChange={e => handleFieldChange(field.name, e.target.value)}
                      fullWidth
                      size="small"
                      placeholder={field.placeholder}
                      inputProps={{ step: 0.1 }}
                    />
                    {field.description && <FormHelperText>{field.description}</FormHelperText>}
                  </Box>
                ) : (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {field.label}
                      {field.required && (
                        <Box component="span" sx={{ color: 'error.main' }}>
                          {' '}
                          *
                        </Box>
                      )}
                    </Typography>
                    <TextField
                      type={field.name.toLowerCase().includes('key') ? 'password' : 'text'}
                      value={config[field.name] || ''}
                      onChange={e => handleFieldChange(field.name, e.target.value)}
                      fullWidth
                      size="small"
                      placeholder={field.placeholder}
                    />
                    {field.description && <FormHelperText>{field.description}</FormHelperText>}
                  </Box>
                )}
              </Grid>
            ))}
          </Grid>

          {onSaveConfig && (
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => onSaveConfig(selectedProvider, config, false)}
                disabled={
                  !provider?.fields.every(
                    field => !field.required || (config[field.name] && config[field.name] !== '')
                  )
                }
              >
                Save Configuration
              </Button>

              <Button
                variant="outlined"
                color="primary"
                onClick={() => onSaveConfig(selectedProvider, config, true)}
                disabled={
                  !provider?.fields.every(
                    field => !field.required || (config[field.name] && config[field.name] !== '')
                  )
                }
                startIcon={<Icon icon="mdi:star" />}
              >
                Save as Default
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

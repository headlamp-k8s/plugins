import { Icon } from '@iconify/react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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

interface ProviderSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectProvider: (providerId: string) => void;
}

function ProviderSelectionDialog({
  open,
  onClose,
  onSelectProvider,
}: ProviderSelectionDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md">
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Icon icon="mdi:plus-circle" width="24px" height="24px" />
          <Typography variant="h6">Select Provider</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Select a provider to add a new configuration
        </Typography>
        <Grid container spacing={2}>
          {modelProviders.map(provider => (
            <Grid item key={provider.id} xs={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 2,
                  },
                }}
                onClick={() => {
                  onSelectProvider(provider.id);
                }}
              >
                <Icon icon={provider.icon} width="32px" height="32px" />
                <Typography variant="body1" sx={{ mt: 1, fontWeight: 'medium' }}>
                  {provider.name}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

// Configuration dialog component
interface ConfigurationDialogProps {
  open: boolean;
  onClose: () => void;
  providerId: string;
  config: Record<string, any>;
  onConfigChange: (config: Record<string, any>) => void;
  configName: string;
  onConfigNameChange?: (name: string) => void;
  onSave?: (makeDefault: boolean) => void;
}

function ConfigurationDialog({
  open,
  onClose,
  providerId,
  config,
  onConfigChange,
  configName,
  onConfigNameChange,
  onSave,
}: ConfigurationDialogProps) {
  const [isCustomName, setIsCustomName] = useState(false);
  const provider = getProviderById(providerId);
  const fields = getProviderFields(providerId);

  const handleFieldChange = (fieldName: string, value: any) => {
    onConfigChange({
      ...config,
      [fieldName]: value,
    });
  };

  // Generate a name for the config if not provided
  useEffect(() => {
    if (!isCustomName && onConfigNameChange && provider) {
      // Only auto-generate name if it hasn't been manually edited
      let name = '';

      if (config.displayName) {
        name = config.displayName;
      } else {
        switch (providerId) {
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
            name = providerId;
        }
      }
      onConfigNameChange(name);
    }
  }, [providerId, config, onConfigNameChange, isCustomName, provider]);

  const isValid = provider?.fields.every(
    field => !field.required || (config[field.name] && config[field.name] !== '')
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          {provider && <Icon icon={provider.icon} width="24px" height="24px" />}
          <Typography variant="h6">
            {provider ? `Configure ${provider.name}` : 'Configure Provider'}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {provider && (
          <Box sx={{ p: 1 }}>
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
              {provider.description}
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
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color={isValid ? 'success.main' : 'error.main'}>
            {isValid ? 'Configuration is valid.' : 'Please fill in all required fields.'}
          </Typography>
        </Box>
        <Button onClick={onClose}>Cancel</Button>
        {onSave && (
          <>
            <Button
              variant="contained"
              color="primary"
              onClick={() => onSave(false)}
              disabled={!isValid}
            >
              Save Configuration
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => onSave(true)}
              disabled={!isValid}
              startIcon={<Icon icon="mdi:star" />}
            >
              Save as Default
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProviderId, setDialogProviderId] = useState('');
  const [dialogConfig, setDialogConfig] = useState<Record<string, any>>({});
  const [dialogConfigName, setDialogConfigName] = useState('');

  // New state for provider selection dialog
  const [providerSelectionOpen, setProviderSelectionOpen] = useState(false);

  // Track if this is a new configuration being edited
  const isNewConfig = !savedConfigs.some(
    sc => sc.providerId === selectedProvider && areConfigsSimilar(sc.config, config)
  );

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

  // Open dialog with provider configuration
  const handleOpenDialog = (providerId: string) => {
    setDialogProviderId(providerId);

    // If this is the currently selected provider, use its config
    if (providerId === selectedProvider) {
      setDialogConfig({ ...config });
      setDialogConfigName(configName);
    } else {
      // Otherwise use default config for the selected provider
      const defaultConfig = getProviderById(providerId)?.defaultConfig || {};
      setDialogConfig({ ...defaultConfig });
      setDialogConfigName('');
    }

    setDialogOpen(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Handle saving config from dialog
  const handleSaveDialog = (makeDefault: boolean) => {
    if (onSaveConfig) {
      // Apply the changes from dialog to the main config
      onProviderChange(dialogProviderId);
      onConfigChange(dialogConfig);
      if (onConfigNameChange) {
        onConfigNameChange(dialogConfigName);
      }

      // Save the configuration
      onSaveConfig(dialogProviderId, dialogConfig, makeDefault);

      // Close dialog
      setDialogOpen(false);
    }
  };

  // Handle dialog config change
  const handleDialogConfigChange = (newConfig: Record<string, any>) => {
    setDialogConfig(newConfig);
  };

  // Handle dialog config name change
  const handleDialogConfigNameChange = (name: string) => {
    setDialogConfigName(name);
  };

  // Handle provider selection from the provider selection dialog
  const handleProviderSelection = (providerId: string) => {
    setProviderSelectionOpen(false);
    handleOpenDialog(providerId);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Configured Providers Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1">
            {savedConfigs.length === 0
              ? 'No Configured Providers'
              : 'Configured Providers'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Icon icon="mdi:plus-circle" />}
            onClick={() => setProviderSelectionOpen(true)}
          >
            Add Provider
          </Button>
        </Box>

        {savedConfigs.length === 0 ? (
          <Paper
            sx={{
              p: 3,
              mb: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              borderStyle: 'dashed',
              borderWidth: 1,
              borderColor: 'divider',
            }}
          >
            <Icon icon="mdi:robot-confused" width="48px" height="48px" style={{ opacity: 0.6 }} />
            <Typography variant="body1" sx={{ mt: 2, mb: 1 }}>
              No AI providers configured yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Click "Add Provider" to configure your first AI provider
            </Typography>
          </Paper>
        ) : (
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
                        boxShadow: 1,
                      },
                    }}
                    onClick={() => onSelectSavedConfig?.(savedConfig)}
                  >
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                      <Button
                        size="small"
                        sx={{ minWidth: '30px', p: 0.5 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(savedConfig.providerId);
                          // Pre-select this saved config
                          setDialogConfig({ ...savedConfig.config });
                          setDialogConfigName(savedConfig.displayName || '');
                        }}
                      >
                        <Icon icon="mdi:pencil" width="16px" />
                      </Button>
                    </Box>

                    {savedConfig.isDefault && (
                      <Chip
                        label="Default"
                        size="small"
                        color="primary"
                        sx={{
                          position: 'absolute',
                          top: -10,
                          left: -10,
                          fontSize: '0.7rem',
                        }}
                      />
                    )}
                    <Icon
                      icon={savedProvider?.icon || 'mdi:robot'}
                      width="32px"
                      height="32px"
                      style={{ marginBottom: '8px' }}
                    />
                    <Typography variant="body1" sx={{ fontWeight: 'medium', textAlign: 'center' }}>
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
        )}
      </Box>

      {/* Provider Selection Dialog */}
      <ProviderSelectionDialog
        open={providerSelectionOpen}
        onClose={() => setProviderSelectionOpen(false)}
        onSelectProvider={handleProviderSelection}
      />

      {/* Configuration Dialog */}
      <ConfigurationDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        providerId={dialogProviderId}
        config={dialogConfig}
        onConfigChange={handleDialogConfigChange}
        configName={dialogConfigName}
        onConfigNameChange={onConfigNameChange ? handleDialogConfigNameChange : undefined}
        onSave={onSaveConfig ? handleSaveDialog : undefined}
      />
    </Box>
  );
}

import { Icon } from '@iconify/react';
import { ConfirmDialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Autocomplete } from '@mui/material';
import { useEffect, useState } from 'react';
import {
  getDefaultConfig,
  getProviderById,
  getProviderFields,
  modelProviders,
} from '../../config/modelConfig';
import {
  deleteProviderConfig,
  getActiveConfig,
  SavedConfigurations,
  saveProviderConfig,
  saveTermsAcceptance,
  StoredProviderConfig,
} from '../../utils/ProviderConfigManager';
import TermsDialog from './TermsDialog';

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
  const provider = getProviderById(providerId);
  const fields = getProviderFields(providerId);
  const [initialRender, setInitialRender] = useState(true);

  const handleFieldChange = (fieldName: string, value: any) => {
    // Update the config with the new field value
    onConfigChange({
      ...config,
      [fieldName]: value,
    });

    // If we're changing a model identifier field and have a standard auto-generated name,
    // this will trigger the useEffect to update the name
    // The useEffect will handle the name update based on the configName pattern
  };

  // Generate a name on initial render if no name is provided
  useEffect(() => {
    // Only set the name if it's an initial render and no name has been set
    if (onConfigNameChange && provider && initialRender && !configName) {
      // Simply use the provider name as the initial configuration name
      const name = provider.name || providerId;
      onConfigNameChange(name);
      setInitialRender(false);
    }
  }, [providerId, configName, onConfigNameChange, provider, initialRender]);

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
                  {field.type === 'select' && field.name === 'model' ? (
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
                      <Autocomplete
                        freeSolo
                        options={field.options || []}
                        value={config[field.name] || ''}
                        onChange={(_, newValue) => {
                          handleFieldChange(field.name, newValue || '');
                        }}
                        onInputChange={(_, newInputValue) => {
                          handleFieldChange(field.name, newInputValue);
                        }}
                        renderInput={params => (
                          <TextField
                            {...params}
                            fullWidth
                            size="small"
                            placeholder="Enter or select model name (e.g., gpt-4, claude-3-opus, custom-model)"
                            helperText={
                              config[field.name]
                                ? field.options?.includes(config[field.name])
                                  ? `Using model: ${config[field.name]}`
                                  : `Using custom model: ${config[field.name]}`
                                : 'Enter a model name or select from the dropdown'
                            }
                            InputProps={{
                              ...params.InputProps,
                              startAdornment:
                                config[field.name] &&
                                !field.options?.includes(config[field.name]) ? (
                                  <Box sx={{ mr: 1 }}>
                                    <Chip
                                      label="Custom"
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                      sx={{ fontSize: '0.7rem', height: '20px' }}
                                    />
                                  </Box>
                                ) : null,
                              endAdornment: config[field.name] ? (
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    const defaultModel = field.default || field.options?.[0] || '';
                                    handleFieldChange(field.name, defaultModel);
                                  }}
                                  title="Reset to default model"
                                >
                                  <Icon icon="mdi:restore" width="16px" />
                                </IconButton>
                              ) : null,
                            }}
                          />
                        )}
                      />
                      {field.description && <FormHelperText>{field.description}</FormHelperText>}
                    </Box>
                  ) : field.type === 'select' ? (
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

            {/* Show only this model switch - only show if multiple models are available */}
            {(() => {
              // Get all available models for this provider
              const modelField = fields.find(field => field.name === 'model');
              const availableModels = modelField?.options || [];
              const hasCustomModel = config.model && !availableModels.includes(config.model);
              const totalModels = availableModels.length + (hasCustomModel ? 1 : 0);

              // Only show the switch if there are multiple models available
              if (totalModels > 1) {
                return (
                  <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.showOnlyThisModel || false}
                          onChange={e => {
                            handleFieldChange('showOnlyThisModel', e.target.checked);
                          }}
                          size="small"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2">
                            Show only this model in chat window
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            When enabled, only this specific model will appear in the chat selector,
                            hiding other models from this provider.
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                );
              }
              return null;
            })()}
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
          <Button
            variant="contained"
            color="primary"
            onClick={() => onSave(true)}
            disabled={!isValid}
          >
            Save
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

interface ModelSelectorProps {
  selectedProvider: string;
  config: Record<string, any>;
  savedConfigs: SavedConfigurations;
  configName?: string;
  isConfigView?: boolean;
  onChange?: (changes: {
    providerId: string;
    config: Record<string, any>;
    displayName: string;
    savedConfigs?: SavedConfigurations;
  }) => void;
  onTermsAccept?: (updatedConfigs: SavedConfigurations) => void;
}

export default function ModelSelector({
  selectedProvider,
  config,
  savedConfigs,
  configName = '',
  isConfigView = false,
  onChange,
  onTermsAccept,
}: ModelSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProviderId, setDialogProviderId] = useState('');
  const [dialogConfig, setDialogConfig] = useState<Record<string, any>>({});
  const [dialogConfigName, setDialogConfigName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // New state for provider selection dialog
  const [providerSelectionOpen, setProviderSelectionOpen] = useState(false);

  // State for terms dialog
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);

  // State for the 3-dot menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedConfigIndex, setSelectedConfigIndex] = useState<number | null>(null);
  const openMenu = Boolean(anchorEl);

  // Check if terms have been accepted
  const hasAcceptedTerms = () => {
    return savedConfigs?.termsAccepted || false;
  };

  // Save terms acceptance
  const acceptTerms = () => {
    if (onTermsAccept) {
      const updatedConfigs = saveTermsAcceptance(savedConfigs);
      onTermsAccept(updatedConfigs);
    }
  };

  // Compare two configuration objects to see if they're essentially the same
  function areConfigsSimilar(config1: Record<string, any>, config2: Record<string, any>): boolean {
    // If one of the configs is empty or undefined, they're not similar
    if (!config1 || !config2) return false;

    // Compare API key if both have it
    if (config1.apiKey && config2.apiKey) {
      if (config1.apiKey !== config2.apiKey) {
        return false;
      }

      // For API keys, also check model and deploymentName if they exist
      // to distinguish between different configurations using the same key
      if (config1.model && config2.model && config1.model !== config2.model) {
        return false;
      }

      if (
        config1.deploymentName &&
        config2.deploymentName &&
        config1.deploymentName !== config2.deploymentName
      ) {
        return false;
      }

      // If they share the same API key and don't have conflicting models/deployments,
      // consider them similar
      return true;
    }

    // Check if both have base URL
    if (config1.baseUrl && config2.baseUrl) {
      if (config1.baseUrl !== config2.baseUrl) {
        return false;
      }

      // For base URLs, also check model if it exists
      if (config1.model && config2.model && config1.model !== config2.model) {
        return false;
      }

      // If they share the same base URL and model, consider them similar
      return true;
    }

    // If we don't have API keys or base URLs to compare (unusual),
    // do a more thorough check on important fields

    // Compare models if both have them
    if (config1.model && config2.model) {
      if (config1.model !== config2.model) {
        return false;
      }
    } else if ((config1.model && !config2.model) || (!config1.model && config2.model)) {
      // One has a model and the other doesn't - they're different
      return false;
    }

    // Compare deploymentNames if both have them
    if (config1.deploymentName && config2.deploymentName) {
      if (config1.deploymentName !== config2.deploymentName) {
        return false;
      }
    } else if (
      (config1.deploymentName && !config2.deploymentName) ||
      (!config1.deploymentName && config2.deploymentName)
    ) {
      // One has a deploymentName and the other doesn't - they're different
      return false;
    }

    // If we've made it this far and both configs have either matching models
    // or matching deploymentNames, consider them similar
    if ((config1.model && config2.model) || (config1.deploymentName && config2.deploymentName)) {
      return true;
    }

    // If we don't have enough information to make a determination, consider them different
    return false;
  }

  // Open dialog with provider configuration
  const handleOpenDialog = (providerId: string, isNewConfig = false) => {
    setDialogProviderId(providerId);

    // Get provider info to access its name
    const providerInfo = getProviderById(providerId);
    const providerName = providerInfo?.name || providerId;

    // If this is editing the currently selected provider, use its config
    if (providerId === selectedProvider && !isNewConfig) {
      setDialogConfig({ ...config });
      setDialogConfigName(configName);
    } else {
      // For a new config or a different provider, use default config
      const defaultConfig = getDefaultConfig(providerId);
      setDialogConfig({ ...defaultConfig });

      // Generate a unique name for this configuration

      // Check if there are existing configurations for this provider
      const existingConfigsForProvider = savedConfigs?.providers?.filter(
        p => p.providerId === providerId
      );

      if (existingConfigsForProvider && existingConfigsForProvider.length > 0) {
        // Find the highest number used in existing configurations
        let maxNumber = 0;
        const regex = new RegExp(`^${providerName}\\s+(\\d+)$`);

        existingConfigsForProvider.forEach(p => {
          if (p.displayName) {
            const match = p.displayName.match(regex);
            if (match && match[1]) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > maxNumber) {
                maxNumber = num;
              }
            }
          }
        });

        // Use the next available number
        setDialogConfigName(`${providerName} ${maxNumber + 1}`);
      } else {
        // Use the provider name as the initial configuration name for the first instance
        setDialogConfigName(providerName);
      }
    }

    setDialogOpen(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Handle saving config from dialog
  const handleSaveDialog = (makeDefault: boolean) => {
    // Apply the changes from dialog to the main config
    handleProviderChange(dialogProviderId);
    handleConfigChange(dialogConfig);
    handleConfigNameChange(dialogConfigName);

    // Save the configuration - also pass the display name
    handleSaveConfig(dialogProviderId, dialogConfig, makeDefault, dialogConfigName);

    // Close dialog
    setDialogOpen(false);
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
    // Always treat selection from the provider dialog as a new configuration
    handleOpenDialog(providerId, true);
  };

  const handleAddProviderClick = () => {
    // Check if this is the first provider and terms haven't been accepted
    const isFirstProvider = !savedConfigs?.providers?.length;

    if (isFirstProvider && !hasAcceptedTerms()) {
      setTermsDialogOpen(true);
    } else {
      setProviderSelectionOpen(true);
    }
  };

  const handleTermsAccept = () => {
    acceptTerms();
    setTermsDialogOpen(false);
    setProviderSelectionOpen(true);
  };

  const handleTermsClose = () => {
    setTermsDialogOpen(false);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  // Menu handling

  // Handle provider change internally
  const handleProviderChange = (providerId: string) => {
    // Try to find an existing config for this provider
    const existingConfig = savedConfigs?.providers?.find(p => p.providerId === providerId);

    if (existingConfig) {
      // Use existing config
      if (onChange) {
        onChange({
          providerId,
          config: { ...existingConfig.config },
          displayName: existingConfig.displayName || '',
        });
      }
    } else {
      // Reset config to defaults when changing to a new provider
      if (onChange) {
        onChange({
          providerId,
          config: getDefaultConfig(providerId),
          displayName: '',
        });
      }
    }
  };

  // Handle configuration changes internally
  const handleConfigChange = (newConfig: Record<string, any>) => {
    if (onChange) {
      onChange({
        providerId: selectedProvider,
        config: newConfig,
        displayName: configName,
      });
    }
  };

  // Handle saving a configuration internally
  const handleSaveConfig = (
    providerId: string,
    config: Record<string, any>,
    makeDefault: boolean,
    displayName?: string
  ) => {
    // Save the configuration with the display name from dialog or existing one
    const updatedConfigs = saveProviderConfig(
      savedConfigs,
      providerId,
      config,
      makeDefault,
      displayName || configName
    );

    // Notify parent of changes
    if (onChange) {
      onChange({
        providerId,
        config,
        displayName: displayName || configName,
        savedConfigs: updatedConfigs,
      });
    }
  };

  // Handle selecting a saved configuration internally
  const handleSelectSavedConfig = (config: StoredProviderConfig) => {
    if (onChange) {
      onChange({
        providerId: config.providerId,
        config: { ...config.config },
        displayName: config.displayName || '',
      });
    }
  };

  // Handle config name changes internally
  const handleConfigNameChange = (name: string) => {
    if (onChange) {
      onChange({
        providerId: selectedProvider,
        config,
        displayName: name,
      });
    }
  };

  // Handle deleting a config internally
  const handleDeleteConfig = (providerId: string, configToDelete: Record<string, any>) => {
    const updatedConfigs = deleteProviderConfig(savedConfigs, providerId, configToDelete);

    // If we're deleting the currently active config, we need to update our local state
    if (providerId === selectedProvider && areConfigsSimilar(configToDelete, config)) {
      // Find the new active provider
      const newActiveConfig = getActiveConfig(updatedConfigs);
      if (newActiveConfig && onChange) {
        onChange({
          providerId: newActiveConfig.providerId,
          config: { ...newActiveConfig.config },
          displayName: newActiveConfig.displayName || '',
          savedConfigs: updatedConfigs,
        });
      } else if (onChange) {
        // No configs left, reset to defaults
        onChange({
          providerId: 'openai',
          config: getDefaultConfig('openai'),
          displayName: '',
          savedConfigs: updatedConfigs,
        });
      }
    } else if (onChange) {
      // Not deleting the active config, just update the saved configs
      onChange({
        providerId: selectedProvider,
        config,
        displayName: configName,
        savedConfigs: updatedConfigs,
      });
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Configured Providers Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1">
            {!savedConfigs?.providers?.length ? 'No Configured Providers' : 'Configured Providers'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Icon icon="mdi:plus-circle" />}
            onClick={handleAddProviderClick}
          >
            Add Provider
          </Button>
        </Box>

        {!savedConfigs?.providers?.length ? (
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
            {savedConfigs?.providers?.map((savedConfig, index) => {
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
                      cursor: isConfigView ? 'default' : 'pointer',
                      border: isActive ? '2px solid' : '1px solid',
                      borderColor: isActive ? 'primary.main' : 'divider',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.light',
                        boxShadow: isConfigView ? 0 : 1,
                      },
                    }}
                    onClick={() => {
                      if (!isConfigView) {
                        handleSelectSavedConfig(savedConfig);
                      }
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Box>
                        {savedConfigs && index === (savedConfigs.defaultProviderIndex ?? 0) && (
                          <Chip
                            label="Default"
                            size="small"
                            color="primary"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        onClick={e => {
                          e.stopPropagation();
                          setAnchorEl(e.currentTarget);
                          setSelectedConfigIndex(index);
                        }}
                      >
                        <Icon icon="mdi:dots-vertical" width="16px" />
                      </IconButton>
                    </Box>

                    <Icon
                      icon={savedProvider?.icon || 'mdi:robot'}
                      width="32px"
                      height="32px"
                      style={{ marginBottom: '8px' }}
                    />
                    <Typography variant="body1" sx={{ fontWeight: 'medium', textAlign: 'center' }}>
                      {savedConfig.displayName || savedProvider?.name || savedConfig.providerId}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" align="center">
                      {savedConfig.config.model || savedConfig.config.deploymentName ? (
                        <Box>
                          {savedConfig.config.model || savedConfig.config.deploymentName}
                          {savedConfig.config.showOnlyThisModel && (
                            <Box
                              component="span"
                              sx={{ color: 'primary.main', fontWeight: 'medium' }}
                            >
                              {' • Only this model'}
                            </Box>
                          )}
                        </Box>
                      ) : (
                        'Configuration'
                      )}
                    </Typography>

                    <Menu
                      anchorEl={anchorEl}
                      open={openMenu}
                      onClose={handleCloseMenu}
                      MenuListProps={{
                        'aria-labelledby': 'basic-button',
                      }}
                    >
                      <MenuItem
                        onClick={e => {
                          e.stopPropagation();
                          handleCloseMenu();
                          if (
                            selectedConfigIndex !== null &&
                            savedConfigs?.providers[selectedConfigIndex]
                          ) {
                            const selectedSavedConfig =
                              savedConfigs?.providers[selectedConfigIndex];
                            // Use false for isNewConfig to indicate we're editing an existing config
                            handleOpenDialog(selectedSavedConfig.providerId, false);
                            // Pre-select this saved config
                            setDialogConfig({ ...selectedSavedConfig.config });
                            setDialogConfigName(selectedSavedConfig.displayName || '');
                          }
                        }}
                      >
                        <Icon icon="mdi:pencil" width="16px" style={{ marginRight: 8 }} />
                        Edit
                      </MenuItem>
                      <MenuItem
                        onClick={e => {
                          e.stopPropagation();
                          handleCloseMenu();
                          // Handle make default action using selectedConfigIndex
                          if (
                            selectedConfigIndex !== null &&
                            savedConfigs?.providers[selectedConfigIndex]
                          ) {
                            const selectedSavedConfig = savedConfigs.providers[selectedConfigIndex];
                            handleProviderChange(selectedSavedConfig.providerId);
                            handleConfigChange(selectedSavedConfig.config);
                            // Pass the display name to ensure we're setting the correct config as default
                            handleSaveConfig(
                              selectedSavedConfig.providerId,
                              selectedSavedConfig.config,
                              true,
                              selectedSavedConfig.displayName
                            );
                          }
                        }}
                      >
                        <Icon icon="mdi:star" width="16px" style={{ marginRight: 8 }} />
                        Make Default
                      </MenuItem>
                      <MenuItem
                        onClick={e => {
                          e.stopPropagation();
                          handleCloseMenu();
                          // Handle delete action using selectedConfigIndex
                          if (
                            selectedConfigIndex !== null &&
                            savedConfigs?.providers[selectedConfigIndex]
                          ) {
                            setShowDeleteConfirm(true);
                          }
                        }}
                        sx={{ color: 'error.main' }}
                      >
                        <Icon icon="mdi:trash-can" width="16px" style={{ marginRight: 8 }} />
                        Delete
                      </MenuItem>
                    </Menu>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* Terms Dialog */}
      <TermsDialog open={termsDialogOpen} onClose={handleTermsClose} onAccept={handleTermsAccept} />

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
        onConfigNameChange={handleDialogConfigNameChange}
        onSave={handleSaveDialog}
      />

      <ConfirmDialog
        // @ts-ignore - 'open' property is not in the type definition but is required
        open={showDeleteConfirm}
        handleClose={() => {
          setShowDeleteConfirm(false);
          setSelectedConfigIndex(null);
        }}
        onConfirm={() => {
          if (selectedConfigIndex !== null && savedConfigs?.providers[selectedConfigIndex]) {
            const selectedSavedConfig = savedConfigs.providers[selectedConfigIndex];
            handleDeleteConfig(selectedSavedConfig.providerId, selectedSavedConfig.config);
          }
        }}
        title="Delete Configuration"
        description="Are you sure you want to delete this configuration?"
        cancelLabel="Cancel"
        confirmLabel="Delete"
      />
    </Box>
  );
}

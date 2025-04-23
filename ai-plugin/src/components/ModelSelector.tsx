import { Icon } from '@iconify/react';
import {
  Box,
  FormHelperText,
  Grid,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';
import { getProviderById, getProviderFields, modelProviders } from '../config/modelConfig';

interface ModelSelectorProps {
  selectedProvider: string;
  config: Record<string, any>;
  onProviderChange: (providerId: string) => void;
  onConfigChange: (config: Record<string, any>) => void;
}

export default function ModelSelector({
  selectedProvider,
  config,
  onProviderChange,
  onConfigChange,
}: ModelSelectorProps) {
  const handleFieldChange = (fieldName: string, value: any) => {
    onConfigChange({
      ...config,
      [fieldName]: value,
    });
  };

  const provider = getProviderById(selectedProvider);
  const fields = getProviderFields(selectedProvider);

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Select AI Model Provider
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
        </Box>
      )}
    </Box>
  );
}

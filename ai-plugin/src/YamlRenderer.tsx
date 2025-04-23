import { ActionButton } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Paper, Typography } from '@mui/material';
import React from 'react';
import YAML from 'yaml';

interface YamlRendererProps {
  yamlContent: string;
  onOpenEditor: () => void;
}

export default function YamlRenderer({ yamlContent, onOpenEditor }: YamlRendererProps) {
  const [isValid, setIsValid] = React.useState(true);
  const [resourceType, setResourceType] = React.useState('Resource');
  const [formattedYaml, setFormattedYaml] = React.useState(yamlContent);

  React.useEffect(() => {
    try {
      // Parse YAML to get resource type
      const resource = YAML.parse(yamlContent);
      if (resource && resource.kind) {
        setResourceType(resource.kind);
      }

      // Format YAML for better readability
      // Using the parsed object ensures proper formatting even if the input was not perfectly formatted
      const prettyYaml = YAML.stringify(resource, { indent: 2 });
      setFormattedYaml(prettyYaml);
      setIsValid(true);
    } catch (e) {
      console.error('Error parsing YAML:', e);
      setIsValid(false);
      setFormattedYaml(yamlContent);
    }
  }, [yamlContent]);

  return (
    <Box sx={{ position: 'relative', mt: 2, mb: 3, borderRadius: 1, overflow: 'hidden' }}>
      <Paper
        elevation={2}
        sx={{
          p: 2,
          backgroundColor: theme => (theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa'),
          borderRadius: 1,
          borderLeft: '4px solid',
          borderColor: isValid ? 'primary.main' : 'warning.main',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
            pb: 1,
            borderBottom: '1px solid',
            borderColor: theme =>
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
            {resourceType} YAML
          </Typography>
          <ActionButton
            icon="mdi:pencil"
            description="Open in Editor"
            onClick={onOpenEditor}
            color="primary"
            iconButtonProps={{
              sx: {
                bgcolor: 'background.paper',
                boxShadow: 1,
                '&:hover': {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                },
              },
            }}
          />
        </Box>
        <pre
          style={{
            margin: 0,
            padding: '0.75rem',
            overflow: 'auto',
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            maxHeight: '400px',
            backgroundColor: theme =>
              theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
            borderRadius: '4px',
          }}
        >
          {formattedYaml}
        </pre>
      </Paper>
    </Box>
  );
}

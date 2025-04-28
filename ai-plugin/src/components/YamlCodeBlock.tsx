import { Box, Button, Paper, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import YAML from 'yaml';

interface YamlCodeBlockProps {
  content: string;
  onApply: (yaml: string, title: string, resourceType: string) => void;
}

export default function YamlCodeBlock({ content, onApply }: YamlCodeBlockProps) {
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [resourceType, setResourceType] = useState<string>('Resource');
  const [resourceName, setResourceName] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);

  React.useEffect(() => {
    validateYaml(content);
  }, [content]);

  const validateYaml = (yamlContent: string) => {
    try {
      // Try to parse the YAML
      const parsed = YAML.parse(yamlContent);

      if (!parsed) {
        setValidationMessage('Invalid YAML structure');
        setIsValid(false);
        return;
      }

      // Check for required Kubernetes fields
      if (!parsed.apiVersion) {
        setValidationMessage('Missing apiVersion field');
        setIsValid(false);
        return;
      }

      if (!parsed.kind) {
        setValidationMessage('Missing kind field');
        setIsValid(false);
        return;
      }

      // Set resource information from the parsed YAML
      setResourceType(parsed.kind);
      setResourceName(parsed.metadata?.name || '');

      // Special validations for specific resource types
      if (parsed.kind === 'Job') {
        if (!parsed.spec?.template?.metadata?.labels) {
          setValidationMessage('Job requires template.metadata.labels for selector matching');
          setIsValid(false);
          return;
        }

        if (!parsed.spec?.template?.spec?.restartPolicy) {
          setValidationMessage('Job requires template.spec.restartPolicy (Never or OnFailure)');
          setIsValid(false);
          return;
        }
      }

      setIsValid(true);
      setValidationMessage(null);
    } catch (error) {
      console.error('YAML validation error:', error);
      setValidationMessage(`Invalid YAML: ${error.message}`);
      setIsValid(false);
    }
  };

  const handleApply = () => {
    if (isValid) {
      onApply(content, `Apply ${resourceType}`, resourceType);
    }
  };

  return (
    <Box sx={{ position: 'relative', my: 2 }}>
      <Paper
        elevation={1}
        sx={{
          borderLeft: '3px solid',
          borderColor: isValid ? 'primary.main' : 'warning.main',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            py: 1,
            borderBottom: '1px solid',
            borderColor: theme =>
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            bgcolor: theme =>
              theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
          }}
        >
          <Typography variant="caption" fontWeight="bold">
            {resourceType}
            {resourceName ? `: ${resourceName}` : ''}
          </Typography>

          <Tooltip title={!isValid ? validationMessage || 'Invalid YAML' : 'Create resource'}>
            <span>
              <Button
                variant="contained"
                size="small"
                color="primary"
                onClick={handleApply}
                disabled={!isValid}
              >
                Apply
              </Button>
            </span>
          </Tooltip>
        </Box>

        <SyntaxHighlighter
          language="yaml"
          style={oneDark}
          customStyle={{ margin: 0, borderRadius: 0 }}
        >
          {content}
        </SyntaxHighlighter>

        {!isValid && validationMessage && (
          <Box sx={{ p: 1, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <Typography variant="caption" fontWeight="medium">
              {validationMessage}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

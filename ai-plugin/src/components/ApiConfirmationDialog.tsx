import { Icon } from '@iconify/react';
import Editor from '@monaco-editor/react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Typography,
} from '@mui/material';
import React from 'react';
import YAML from 'yaml';

interface ApiConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  method: string;
  url: string;
  body?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  result?: any;
  error?: string;
}

export default function ApiConfirmationDialog({
  open,
  onClose,
  method,
  url,
  body,
  onConfirm,
  isLoading = false,
  result,
  error,
}: ApiConfirmationDialogProps) {
  const [editedBody, setEditedBody] = React.useState('');
  const themeName = localStorage.getItem('headlampThemePreference');
  const [resourceInfo, setResourceInfo] = React.useState<{
    kind: string;
    name: string;
    namespace?: string;
  } | null>(null);

  React.useEffect(() => {
    if (body) {
      // Try to convert to YAML if it's JSON
      try {
        // First check if it's already YAML
        const isYaml = body.trim().includes('apiVersion:') && body.trim().includes('kind:');

        if (isYaml) {
          setEditedBody(body);
        } else {
          // Try parsing as JSON and convert to YAML
          const jsonObject = JSON.parse(body);
          const yamlContent = YAML.stringify(jsonObject);
          setEditedBody(yamlContent);
        }
      } catch (e) {
        // If parsing fails, use as is
        console.warn('Failed to parse body as JSON or YAML:', e);
        setEditedBody(body);
      }

      // Try to extract resource information
      try {
        let parsed;
        // Try parsing as YAML first
        try {
          parsed = YAML.parse(body);
        } catch (e) {
          // If YAML parsing fails, try JSON
          parsed = JSON.parse(body);
        }

        if (parsed && parsed.kind && parsed.metadata && parsed.metadata.name) {
          setResourceInfo({
            kind: parsed.kind,
            name: parsed.metadata.name,
            namespace: parsed.metadata.namespace,
          });
        }
      } catch (e) {
        // If both parsing methods fail, continue without setting resourceInfo
        setResourceInfo(null);
      }
    } else {
      setEditedBody('');
      setResourceInfo(null);
    }
  }, [body]);

  // Also try to extract resource info from the URL if not found in body
  React.useEffect(() => {
    if (!resourceInfo && url) {
      const urlParts = url.split('/');
      // Try to extract resource kind and name from URL
      // Format often follows: /api/v1/namespaces/{namespace}/{resourceType}/{name}
      // or /apis/{group}/{version}/namespaces/{namespace}/{resourceType}/{name}

      const nameIndex = urlParts.length - 1;
      if (nameIndex > 0) {
        const resourceTypeIndex = nameIndex - 1;
        let namespaceIndex = -1;

        // Check if URL contains namespace
        const namespacePos = urlParts.indexOf('namespaces');
        if (namespacePos >= 0 && namespacePos + 1 < urlParts.length) {
          namespaceIndex = namespacePos + 1;
        }

        if (resourceTypeIndex > 0) {
          setResourceInfo({
            kind: urlParts[resourceTypeIndex],
            name: urlParts[nameIndex],
            namespace: namespaceIndex > 0 ? urlParts[namespaceIndex] : undefined,
          });
        }
      }
    }
  }, [url, resourceInfo]);

  // When the user submits, convert YAML back to JSON if needed for certain operations
  const handleSubmit = () => {
    // Always call onConfirm which will trigger the API call
    onConfirm();

    // Close the dialog immediately for modifying operations (POST, PUT, PATCH, DELETE)
    // as clusterAction will handle the loading state
    if (
      isModifyingOperation ||
      method.toUpperCase() === 'PUT' ||
      method.toUpperCase() === 'PATCH'
    ) {
      onClose();
    }
    // For GET operations, the dialog will stay open to show results
  };

  const getMethodColor = () => {
    switch (method.toUpperCase()) {
      case 'GET':
        return '#4caf50'; // Green
      case 'POST':
        return '#2196f3'; // Blue
      case 'PUT':
      case 'PATCH':
        return '#ff9800'; // Orange
      case 'DELETE':
        return '#f44336'; // Red
      default:
        return '#757575'; // Grey
    }
  };

  const getMethodIcon = () => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'mdi:database-search';
      case 'POST':
        return 'mdi:database-plus';
      case 'PUT':
      case 'PATCH':
        return 'mdi:database-edit';
      case 'DELETE':
        return 'mdi:database-remove';
      default:
        return 'mdi:database';
    }
  };

  const getTitle = () => {
    const base =
      method.toUpperCase() === 'DELETE'
        ? 'Delete'
        : method.toUpperCase() === 'POST'
        ? 'Create'
        : method.toUpperCase() === 'GET'
        ? 'Fetch'
        : 'Update';

    // Add resource info to title if available
    if (resourceInfo) {
      return `${base} ${resourceInfo.kind}: ${resourceInfo.name}`;
    }

    return `${base} Resource`;
  };

  const getConfirmButtonText = () => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'Fetch';
      case 'POST':
        return 'Create';
      case 'PUT':
      case 'PATCH':
        return 'Update';
      case 'DELETE':
        return 'Delete';
      default:
        return 'Send Request';
    }
  };

  // Consider both DELETE and POST as special operations that use clusterAction
  const isModifyingOperation = ['DELETE', 'POST'].includes(method.toUpperCase());
  const isDestructiveOperation = method.toUpperCase() === 'DELETE';

  const getWarningText = () => {
    if (isDestructiveOperation) {
      if (!resourceInfo) {
        return 'This will permanently delete the resource. This action cannot be undone.';
      }

      const resourceIdentifier = resourceInfo.namespace
        ? `${resourceInfo.kind} "${resourceInfo.name}" in namespace "${resourceInfo.namespace}"`
        : `${resourceInfo.kind} "${resourceInfo.name}"`;

      return `This will permanently delete ${resourceIdentifier}. This action cannot be undone.`;
    }
    return null;
  };

  // Only show results for GET requests or non-modifying operations
  const shouldShowResult = result && !isLoading && method.toUpperCase() === 'GET';

  return (
    <Dialog
      open={open}
      onClose={!isLoading ? onClose : undefined}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <Icon
            icon={getMethodIcon()}
            style={{ color: getMethodColor(), marginRight: '8px' }}
            width="24"
            height="24"
          />
          <Typography variant="h6" component="span">
            {getTitle()}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {shouldShowResult && (
          <Box mb={3}>
            <Paper variant="outlined" sx={{ p: 2, maxHeight: '200px', overflow: 'auto' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
              </pre>
            </Paper>
          </Box>
        )}

        {isLoading && (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress size={40} />
          </Box>
        )}

        {!result && !isLoading && (
          <>
            {body && (
              <Box mb={3}>
                <Editor
                  height="350px"
                  language="yaml" // Always use YAML for better readability
                  value={editedBody}
                  onChange={value => setEditedBody(value || '')}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    readOnly: isDestructiveOperation, // Make read-only for DELETE operations
                  }}
                  theme={themeName === 'dark' ? 'vs-dark' : 'light'}
                />
              </Box>
            )}

            {isDestructiveOperation && (
              <Alert sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Warning:</strong> {getWarningText()}
                </Typography>
                {resourceInfo && (
                  <Box mt={1} ml={2}>
                    <Typography variant="body2">
                      <strong>Type:</strong> {resourceInfo.kind}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Name:</strong> {resourceInfo.name}
                    </Typography>
                    {resourceInfo.namespace && (
                      <Typography variant="body2">
                        <strong>Namespace:</strong> {resourceInfo.namespace}
                      </Typography>
                    )}
                  </Box>
                )}
              </Alert>
            )}

            {method.toUpperCase() === 'POST' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Info:</strong> This will create a new resource in the cluster.
                </Typography>
                {resourceInfo && (
                  <Box mt={1} ml={2}>
                    <Typography variant="body2">
                      <strong>Type:</strong> {resourceInfo.kind}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Name:</strong> {resourceInfo.name}
                    </Typography>
                    {resourceInfo.namespace && (
                      <Typography variant="body2">
                        <strong>Namespace:</strong> {resourceInfo.namespace}
                      </Typography>
                    )}
                  </Box>
                )}
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          {result ? 'Close' : 'Cancel'}
        </Button>
        {!result && !isLoading && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            color={isDestructiveOperation ? 'error' : 'primary'}
            startIcon={<Icon icon={getMethodIcon()} />}
          >
            {getConfirmButtonText()}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

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
  Divider,
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
  const [editedBody, setEditedBody] = React.useState(body || '');
  const themeName = localStorage.getItem('headlampThemePreference');

  React.useEffect(() => {
    if (body) {
      setEditedBody(body);
    }
  }, [body]);

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
    switch (method.toUpperCase()) {
      case 'GET':
        return 'Fetch Resource';
      case 'POST':
        return 'Create Resource';
      case 'PUT':
      case 'PATCH':
        return 'Update Resource';
      case 'DELETE':
        return 'Delete Resource';
      default:
        return 'API Request';
    }
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

  const isDestructiveOperation = method.toUpperCase() === 'DELETE';

  // Try to parse any YAML in the body
  const tryParseYaml = () => {
    if (!body) return null;

    try {
      const parsed = YAML.parse(body);
      if (parsed && parsed.kind) {
        return parsed;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const parsedYaml = tryParseYaml();
  const resourceInfo = parsedYaml && {
    kind: parsedYaml.kind,
    name: parsedYaml.metadata?.name,
    namespace: parsedYaml.metadata?.namespace || 'default',
  };

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

        {result && !isLoading && (
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              Response:
            </Typography>
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
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                Request Details:
              </Typography>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '100px' }}>
                    Method:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: getMethodColor(),
                      fontWeight: 'bold',
                      backgroundColor: `${getMethodColor()}20`,
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    {method.toUpperCase()}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '100px' }}>
                    URL:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {url}
                  </Typography>
                </Box>

                {resourceInfo && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Resource Information:
                    </Typography>

                    <Box display="flex" alignItems="center" mb={1}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '100px' }}>
                        Kind:
                      </Typography>
                      <Typography variant="body2">{resourceInfo.kind}</Typography>
                    </Box>

                    {resourceInfo.name && (
                      <Box display="flex" alignItems="center" mb={1}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '100px' }}>
                          Name:
                        </Typography>
                        <Typography variant="body2">{resourceInfo.name}</Typography>
                      </Box>
                    )}

                    {resourceInfo.namespace && (
                      <Box display="flex" alignItems="center" mb={1}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '100px' }}>
                          Namespace:
                        </Typography>
                        <Typography variant="body2">{resourceInfo.namespace}</Typography>
                      </Box>
                    )}
                  </>
                )}
              </Paper>
            </Box>

            {body && (
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom>
                  Request Body:
                </Typography>
                <Editor
                  height="200px"
                  language={body.trim().startsWith('{') ? 'json' : 'yaml'}
                  value={editedBody}
                  onChange={value => setEditedBody(value || '')}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                  }}
                  theme={themeName === 'dark' ? 'vs-dark' : 'light'}
                />
              </Box>
            )}

            {isDestructiveOperation && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Warning:</strong> This is a destructive operation that will permanently
                  delete the resource. This action cannot be undone.
                </Typography>
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
            onClick={onConfirm}
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

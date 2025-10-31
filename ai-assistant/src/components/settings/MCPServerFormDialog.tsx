import { Icon } from '@iconify/react';
import { Dialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Alert,
  Box,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

export interface MCPServer {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  enabled: boolean;
}

export interface MCPConfig {
  enabled: boolean;
  servers: MCPServer[];
}

interface MCPServerFormDialogProps {
  open: boolean;
  onClose: () => void;
  config: MCPConfig;
  onSave: (config: MCPConfig) => void;
}

interface ServerFormData {
  name: string;
  command: string;
  args: string;
  env: Array<{ key: string; value: string }>;
  enabled: boolean;
}

export default function MCPServerFormDialog({
  open,
  onClose,
  config,
  onSave,
}: MCPServerFormDialogProps) {
  const [servers, setServers] = useState<ServerFormData[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentServer, setCurrentServer] = useState<ServerFormData>({
    name: '',
    command: '',
    args: '',
    env: [],
    enabled: true,
  });
  const [validationError, setValidationError] = useState('');

  React.useEffect(() => {
    if (open) {
      // Convert config to form data
      const formData: ServerFormData[] = config.servers.map(server => ({
        name: server.name,
        command: server.command,
        args: server.args.join(' '),
        env: server.env
          ? Object.entries(server.env).map(([key, value]) => ({ key, value }))
          : [],
        enabled: server.enabled,
      }));
      setServers(formData);
      setEditingIndex(null);
      setCurrentServer({
        name: '',
        command: '',
        args: '',
        env: [],
        enabled: true,
      });
      setValidationError('');
    }
  }, [config, open]);

  const handleAddServer = () => {
    setEditingIndex(null);
    setCurrentServer({
      name: '',
      command: '',
      args: '',
      env: [],
      enabled: true,
    });
    setValidationError('');
  };

  const handleEditServer = (index: number) => {
    setEditingIndex(index);
    setCurrentServer(servers[index]);
    setValidationError('');
  };

  const handleDeleteServer = (index: number) => {
    const newServers = servers.filter((_, i) => i !== index);
    setServers(newServers);
    if (editingIndex === index) {
      setEditingIndex(null);
      setCurrentServer({
        name: '',
        command: '',
        args: '',
        env: [],
        enabled: true,
      });
    }
  };

  const handleToggleServerEnabled = (index: number) => {
    const newServers = [...servers];
    newServers[index].enabled = !newServers[index].enabled;
    setServers(newServers);
  };

  const handleAddEnvVar = () => {
    setCurrentServer({
      ...currentServer,
      env: [...currentServer.env, { key: '', value: '' }],
    });
  };

  const handleRemoveEnvVar = (index: number) => {
    setCurrentServer({
      ...currentServer,
      env: currentServer.env.filter((_, i) => i !== index),
    });
  };

  const handleEnvVarChange = (index: number, field: 'key' | 'value', value: string) => {
    const newEnv = [...currentServer.env];
    newEnv[index][field] = value;
    setCurrentServer({
      ...currentServer,
      env: newEnv,
    });
  };

  const validateServer = (server: ServerFormData): string | null => {
    if (!server.name.trim()) {
      return 'Server name is required';
    }

    if (!server.command.trim()) {
      return 'Command is required';
    }

    // Check for duplicate names (excluding current editing server)
    const existingNames = servers
      .filter((_, i) => i !== editingIndex)
      .map(s => s.name.toLowerCase());
    if (existingNames.includes(server.name.toLowerCase())) {
      return 'A server with this name already exists';
    }

    // Validate env variables
    for (const envVar of server.env) {
      if (!envVar.key.trim()) {
        return 'Environment variable keys cannot be empty';
      }
    }

    return null;
  };

  const handleSaveServer = () => {
    const error = validateServer(currentServer);
    if (error) {
      setValidationError(error);
      return;
    }

    const newServers = [...servers];
    if (editingIndex !== null) {
      newServers[editingIndex] = currentServer;
    } else {
      newServers.push(currentServer);
    }

    setServers(newServers);
    setEditingIndex(null);
    setCurrentServer({
      name: '',
      command: '',
      args: '',
      env: [],
      enabled: true,
    });
    setValidationError('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setCurrentServer({
      name: '',
      command: '',
      args: '',
      env: [],
      enabled: true,
    });
    setValidationError('');
  };

  const handleSaveConfig = () => {
    // Convert form data back to config format
    const newConfig: MCPConfig = {
      enabled: config.enabled,
      servers: servers.map(server => {
        const mcpServer: MCPServer = {
          name: server.name,
          command: server.command,
          args: server.args
            .split(/\s+/)
            .filter(arg => arg.trim())
            .map(arg => arg.trim()),
          enabled: server.enabled,
        };

        if (server.env.length > 0) {
          mcpServer.env = server.env.reduce((acc, { key, value }) => {
            if (key.trim()) {
              acc[key] = value;
            }
            return acc;
          }, {} as Record<string, string>);
        }

        return mcpServer;
      }),
    };

    onSave(newConfig);
    onClose();
  };

  const handleLoadExample = () => {
    const exampleServer: ServerFormData = {
      name: 'flux-mcp',
      command: 'flux-operator-mcp',
      args: 'serve --kube-context HEADLAMP_CURRENT_CLUSTER',
      env: [{ key: 'KUBECONFIG', value: 'PATH_TO_KUBECONFIG' }],
      enabled: true,
    };

    setCurrentServer(exampleServer);
    setEditingIndex(null);
    setValidationError('');
  };

  const isFormVisible = editingIndex !== null || currentServer.name || currentServer.command;

  return (
    <Dialog
      open={open}
      maxWidth="lg"
      fullWidth
      withFullScreen
      style={{ overflow: 'hidden' }}
      onClose={onClose}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Configure MCP Servers</Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={handleAddServer}
            startIcon={<Icon icon="mdi:plus" />}
          >
            Add Server
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box mb={3}>
          <Typography variant="body2" color="textSecondary">
            Configure MCP (Model Context Protocol) servers to extend the AI assistant's
            capabilities. Each server provides specific tools and functionality.
          </Typography>
        </Box>

        {/* Existing Servers List */}
        {servers.length > 0 && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Configured Servers ({servers.length})
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell align="center">Enabled</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {servers.map((server, index) => (
                    <TableRow key={index} selected={editingIndex === index}>
                      <TableCell>
                        <Typography variant="body2">
                          <strong>{server.name}</strong>
                        </Typography>
                        {server.env.length > 0 && (
                          <Typography variant="caption" color="textSecondary">
                            {server.env.length} env var(s)
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={server.enabled}
                          onChange={() => handleToggleServerEnabled(index)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEditServer(index)}>
                            <Icon icon="mdi:pencil" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteServer(index)}
                            color="error"
                          >
                            <Icon icon="mdi:delete" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Server Form */}
        {isFormVisible && (
          <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                {editingIndex !== null ? 'Edit Server' : 'Add New Server'}
              </Typography>
              <Button
                size="small"
                variant="text"
                onClick={handleLoadExample}
                startIcon={<Icon icon="mdi:file-document" />}
              >
                Load Example
              </Button>
            </Box>

            {validationError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {validationError}
              </Alert>
            )}

            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Server Name"
                value={currentServer.name}
                onChange={e => setCurrentServer({ ...currentServer, name: e.target.value })}
                fullWidth
                required
                helperText="Unique identifier for this MCP server"
              />

              <TextField
                label="Command"
                value={currentServer.command}
                onChange={e => setCurrentServer({ ...currentServer, command: e.target.value })}
                fullWidth
                required
                helperText="Executable command (e.g., 'docker', 'npx', 'python')"
              />

              <TextField
                label="Arguments"
                value={currentServer.args}
                onChange={e => setCurrentServer({ ...currentServer, args: e.target.value })}
                fullWidth
                multiline
                rows={2}
                helperText="Command-line arguments separated by spaces"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={currentServer.enabled}
                    onChange={e => setCurrentServer({ ...currentServer, enabled: e.target.checked })}
                  />
                }
                label="Enable this server"
              />

              {/* Environment Variables */}
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2">Environment Variables</Typography>
                  <Button
                    size="small"
                    onClick={handleAddEnvVar}
                    startIcon={<Icon icon="mdi:plus" />}
                  >
                    Add Variable
                  </Button>
                </Box>

                {currentServer.env.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                    No environment variables configured
                  </Typography>
                ) : (
                  <Box display="flex" flexDirection="column" gap={1}>
                    {currentServer.env.map((envVar, index) => (
                      <Box key={index} display="flex" gap={1} alignItems="center">
                        <TextField
                          label="Key"
                          value={envVar.key}
                          onChange={e => handleEnvVarChange(index, 'key', e.target.value)}
                          size="small"
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          label="Value"
                          value={envVar.value}
                          onChange={e => handleEnvVarChange(index, 'value', e.target.value)}
                          size="small"
                          sx={{ flex: 2 }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveEnvVar(index)}
                          color="error"
                        >
                          <Icon icon="mdi:delete" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
                <Button variant="outlined" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button variant="contained" onClick={handleSaveServer}>
                  {editingIndex !== null ? 'Update Server' : 'Add Server'}
                </Button>
              </Box>
            </Box>
          </Paper>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" color="primary" onClick={handleSaveConfig}>
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
}

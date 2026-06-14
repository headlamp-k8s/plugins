import type { MCPToolsConfig, MCPToolState } from '@headlamp-k8s/ai-common/mcp/types';
import { AVAILABLE_TOOLS } from '@headlamp-k8s/ai-common/tools/catalog/builtInTools';
import { Icon } from '@iconify/react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ElectronMCPClient } from '../../../mcp/electron-client';
import type { MCPTool } from '../../../types/electron';
import { DefaultDialog } from '../../defaults/DefaultSlots/DefaultSlots';

/** Describes an MCP tool available for use in the assistant. */
interface DisplayMCPTool extends MCPTool {
  /** Name of the MCP server providing this tool. */
  server: string;
  /** Bare tool name within the MCP server. */
  toolName: string;
}

/** Props for the ToolsDialog component that manages tool enablement. */
export interface ToolsDialogProps {
  /** Whether the dialog is currently visible. */
  open: boolean;
  /** Callback invoked when the dialog is closed. */
  onClose: () => void;
  /** Currently enabled built-in tool identifiers; MCP state is loaded from Electron. */
  enabledTools: string[];
  /** Commits enabled built-in tools after MCP settings persist successfully. */
  onToolsChange: (enabledTools: string[]) => void | Promise<void>;
  /** Component used to render the dialog shell. Falls back to MUI Dialog. */
  DialogSlot?: React.ElementType;
}

/**
 * Displays built-in and MCP tools with searchable, persisted enablement controls.
 *
 * Built-in changes are committed through `onToolsChange`; MCP changes are first
 * persisted through the Electron bridge and rolled back if the built-in commit fails.
 *
 * @param props - Dialog visibility, enabled tools, callbacks, and optional shell slot.
 * @returns Tool management dialog.
 */
export const ToolsDialog: React.FC<ToolsDialogProps> = ({
  open,
  onClose,
  enabledTools,
  onToolsChange,
  DialogSlot = DefaultDialog,
}) => {
  const { t } = useTranslation();
  const [localEnabledTools, setLocalEnabledTools] = useState<string[]>(enabledTools);
  const [allKnownMcpTools, setAllKnownMcpTools] = useState<DisplayMCPTool[]>([]);
  const [mcpToolsConfig, setMcpToolsConfig] = useState<MCPToolsConfig>({});
  const [originalMcpConfig, setOriginalMcpConfig] = useState<MCPToolsConfig>({});
  const [isLoadingMcp, setIsLoadingMcp] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());
  const [saveErrorKey, setSaveErrorKey] = useState('');
  const [isMcpConfigReady, setIsMcpConfigReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [requiresReload, setRequiresReload] = useState(false);
  const loadRequestId = React.useRef(0);
  const saveInProgress = React.useRef(false);
  const saveOperation = React.useRef<Promise<void>>(Promise.resolve());
  const dialogSessionId = React.useRef(0);
  const mounted = React.useRef(true);
  const titleId = React.useId();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      dialogSessionId.current += 1;
    };
  }, []);

  // Load MCP tools when dialog opens
  useEffect(() => {
    const requestId = ++loadRequestId.current;
    const sessionId = ++dialogSessionId.current;
    if (open) {
      setLocalEnabledTools(enabledTools);
      setSearchQuery('');
      setSaveErrorKey('');
      setIsMcpConfigReady(false);
      setRequiresReload(false);
      setIsLoadingMcp(true);
      void saveOperation.current.then(() => {
        if (
          mounted.current &&
          loadRequestId.current === requestId &&
          dialogSessionId.current === sessionId
        ) {
          void loadMcpTools(requestId);
        }
      });
    }
    return () => {
      if (loadRequestId.current === requestId) {
        loadRequestId.current += 1;
      }
      if (dialogSessionId.current === sessionId) {
        dialogSessionId.current += 1;
      }
    };
  }, [open]);

  // Sync local state when enabledTools prop changes
  useEffect(() => {
    setLocalEnabledTools(enabledTools);
  }, [enabledTools]);

  // Check if an MCP tool is enabled in the configuration
  const isMcpToolEnabled = (tool: DisplayMCPTool): boolean => {
    const serverConfig = mcpToolsConfig[tool.server];
    if (!serverConfig || !serverConfig[tool.toolName]) {
      return true; // Default to enabled for new tools
    }
    return serverConfig[tool.toolName].enabled !== false;
  };

  const loadMcpTools = async (requestId: number): Promise<void> => {
    setIsLoadingMcp(true);
    try {
      const mcpClient = new ElectronMCPClient();
      if (!mcpClient.isAvailable()) {
        if (loadRequestId.current === requestId) {
          setSaveErrorKey('Failed to load MCP tools.');
        }
        return;
      }

      // Load server configuration and tools configuration - these are our source of truth
      const toolsConfigResponse = await mcpClient.getToolsConfig();
      if (loadRequestId.current !== requestId) {
        return;
      }

      // Store MCP tools configuration
      if (toolsConfigResponse.success && toolsConfigResponse.config) {
        setMcpToolsConfig(toolsConfigResponse.config);
        setOriginalMcpConfig(structuredClone(toolsConfigResponse.config));
        setIsMcpConfigReady(true);
        setRequiresReload(false);
        setSaveErrorKey('');
      } else {
        setSaveErrorKey('Failed to load MCP tools.');
      }

      // Create tools from configuration (this is our source of truth)
      const toolsFromConfig: DisplayMCPTool[] = [];
      if (toolsConfigResponse.success && toolsConfigResponse.config) {
        Object.entries(toolsConfigResponse.config).forEach(([serverName, serverTools]) => {
          Object.keys(serverTools).forEach(toolName => {
            const fullToolName = `${serverName}__${toolName}`;
            toolsFromConfig.push({
              name: fullToolName,
              server: serverName,
              toolName,
            });
          });
        });
      }

      // Update allKnownMcpTools with tools from configuration
      setAllKnownMcpTools(prevKnown => {
        const structuredToolKey = (tool: DisplayMCPTool): string =>
          JSON.stringify([tool.server, tool.toolName]);
        const knownToolKeys = new Set(prevKnown.map(structuredToolKey));
        const newToolsFromConfig = toolsFromConfig.filter(
          tool => !knownToolKeys.has(structuredToolKey(tool))
        );
        return [...prevKnown, ...newToolsFromConfig];
      });

      // Auto-expand servers that have tools in configuration
      const serversWithTools = new Set<string>();
      toolsFromConfig.forEach(tool => {
        if (tool.server) {
          serversWithTools.add(tool.server);
        }
      });
      setExpandedServers(serversWithTools);
    } catch {
      if (loadRequestId.current === requestId) {
        setSaveErrorKey('Failed to load MCP tools.');
      }
    } finally {
      if (loadRequestId.current === requestId) {
        setIsLoadingMcp(false);
      }
    }
  };

  const handleToggleRegularTool = (toolName: string): void => {
    setLocalEnabledTools(prevTools => {
      if (prevTools.includes(toolName)) {
        return prevTools.filter(tool => tool !== toolName);
      } else {
        return [...prevTools, toolName];
      }
    });
  };

  const handleToggleMcpTool = (tool: DisplayMCPTool): void => {
    const currentlyEnabled = isMcpToolEnabled(tool);

    setMcpToolsConfig(prevConfig => {
      const currentTool: MCPToolState = prevConfig[tool.server]?.[tool.toolName] ?? {
        usageCount: 0,
      };
      return {
        ...prevConfig,
        [tool.server]: {
          ...(prevConfig[tool.server] ?? {}),
          [tool.toolName]: { ...currentTool, enabled: !currentlyEnabled },
        },
      };
    });
  };

  const handleToggleServer = (serverName: string): void => {
    const serverTools = allKnownMcpTools.filter(tool => tool.server === serverName);

    // Check if all tools from this server are currently enabled
    const allEnabled = serverTools.every(tool => isMcpToolEnabled(tool));

    // Update MCP configuration for all tools in this server
    setMcpToolsConfig(prevConfig => {
      const serverConfig = { ...(prevConfig[serverName] ?? {}) };
      serverTools.forEach(tool => {
        serverConfig[tool.toolName] = {
          ...(serverConfig[tool.toolName] ?? { usageCount: 0 }),
          enabled: !allEnabled,
        };
      });
      return { ...prevConfig, [serverName]: serverConfig };
    });
  };

  const isServerEnabled = (serverName: string): boolean => {
    const serverTools = allKnownMcpTools.filter(tool => tool.server === serverName);
    return serverTools.length > 0 && serverTools.every(tool => isMcpToolEnabled(tool));
  };

  // Filter tools based on search query - use allKnownMcpTools to show all tools (including disabled ones)
  const filteredMcpTools = allKnownMcpTools.filter(
    tool =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tool.description && tool.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group tools by server
  const groupedToolsByServer = filteredMcpTools.reduce((acc, tool) => {
    const serverName = tool.server || 'Unknown Server';
    if (!acc[serverName]) {
      acc[serverName] = [];
    }
    acc[serverName].push(tool);
    return acc;
  }, {} as Record<string, DisplayMCPTool[]>);

  const handleToggleServerExpansion = (serverName: string): void => {
    const newExpanded = new Set(expandedServers);
    if (newExpanded.has(serverName)) {
      newExpanded.delete(serverName);
    } else {
      newExpanded.add(serverName);
    }
    setExpandedServers(newExpanded);
  };

  const performSave = async (sessionId: number): Promise<void> => {
    let mcpConfigPersisted = false;
    let mcpClient: ElectronMCPClient | undefined;
    const isCurrentSession = (): boolean =>
      mounted.current && dialogSessionId.current === sessionId;
    const rollbackMcpConfig = async (): Promise<boolean> =>
      !mcpConfigPersisted || !mcpClient || (await mcpClient.updateToolsConfig(originalMcpConfig));
    try {
      // Save MCP tools configuration if it has changed
      const mcpConfigChanged =
        isMcpConfigReady && JSON.stringify(mcpToolsConfig) !== JSON.stringify(originalMcpConfig);

      if (mcpConfigChanged) {
        mcpClient = new ElectronMCPClient();
        if (!mcpClient.isAvailable() || !(await mcpClient.updateToolsConfig(mcpToolsConfig))) {
          if (isCurrentSession()) {
            setSaveErrorKey('Failed to save MCP tool settings.');
          }
          return;
        }
        mcpConfigPersisted = true;
      }

      if (!isCurrentSession()) {
        await rollbackMcpConfig();
        return;
      }

      try {
        await onToolsChange(localEnabledTools);
      } catch {
        const rollbackSucceeded = await rollbackMcpConfig();
        if (!isCurrentSession()) return;
        if (!rollbackSucceeded) {
          setIsMcpConfigReady(false);
          setRequiresReload(true);
          setSaveErrorKey(
            'Failed to restore MCP tool settings. Close and reopen this dialog before trying again.'
          );
          return;
        }
        setSaveErrorKey('Failed to save tool settings.');
        return;
      }
      if (isCurrentSession()) {
        onClose();
      }
    } catch {
      if (isCurrentSession()) {
        setSaveErrorKey('Failed to save tool settings.');
      }
    }
  };

  const handleSave = (): void => {
    if (saveInProgress.current) return;
    saveInProgress.current = true;
    setIsSaving(true);
    const sessionId = dialogSessionId.current;
    setSaveErrorKey('');
    const operation = performSave(sessionId).finally(() => {
      saveInProgress.current = false;
      if (mounted.current) {
        setIsSaving(false);
      }
    });
    saveOperation.current = operation;
  };

  const handleCancel = (): void => {
    if (saveInProgress.current) return;
    // Restore original state for both regular and MCP tools
    setLocalEnabledTools(enabledTools);
    setMcpToolsConfig(structuredClone(originalMcpConfig));
    onClose();
  };

  const getToolIcon = (toolName: string, toolType?: string): string => {
    if (toolType === 'mcp' || toolName.includes('mcp')) {
      return 'mdi:connection';
    }
    if (toolName.includes('kubernetes') || toolName.includes('k8s')) {
      return 'mdi:kubernetes';
    }
    return 'mdi:tool';
  };

  const renderMcpToolList = () => (
    <>
      <Box sx={{ mb: 2 }}>
        <Typography component="h3" variant="h6" sx={{ mb: 0.5 }}>
          {t('MCP Tools')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t(
            'These are Model Context Protocol tools that provide additional capabilities to the assistant.'
          )}
        </Typography>

        {/* Search Bar */}
        <TextField
          fullWidth
          disabled={isSaving || requiresReload}
          label={t('Search MCP tools')}
          placeholder={t('Search MCP tools...')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          size="small"
          sx={{ mt: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon aria-hidden icon="mdi:magnify" style={{ fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {isLoadingMcp ? (
        <Box role="status" sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress aria-hidden size={24} />
          <Typography variant="body2" sx={{ ml: 2 }}>
            {t('Loading MCP tools...')}
          </Typography>
        </Box>
      ) : (
        <>
          {Object.entries(groupedToolsByServer).map(([serverName, tools], serverIndex) => (
            <Accordion
              key={serverName}
              expanded={expandedServers.has(serverName)}
              onChange={
                isSaving || requiresReload
                  ? undefined
                  : () => handleToggleServerExpansion(serverName)
              }
              TransitionProps={{ timeout: 0 }}
              sx={{ mb: 1 }}
            >
              <AccordionSummary
                id={`${titleId}-server-${serverIndex}-summary`}
                aria-controls={`${titleId}-server-${serverIndex}-details`}
                expandIcon={<Icon aria-hidden icon="mdi:chevron-down" />}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <Icon aria-hidden icon="mdi:server" style={{ fontSize: 20 }} />
                    <Typography component="h4" variant="subtitle1">
                      {tools.length === 1
                        ? t('{{serverName}} (1 tool)', { serverName })
                        : t('{{serverName}} ({{count}} tools)', {
                            serverName,
                            count: tools.length,
                          })}
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, pt: 1 }}>
                  <Switch
                    size="small"
                    checked={isServerEnabled(serverName)}
                    disabled={!isMcpConfigReady || isSaving || requiresReload}
                    onChange={() => handleToggleServer(serverName)}
                    inputProps={{
                      'aria-label': t('Enable all tools from {{serverName}}', { serverName }),
                    }}
                  />
                </Box>
                <List sx={{ pl: 2 }}>
                  {tools.map((tool, index) => (
                    <React.Fragment key={`${serverName}-${tool.name}`}>
                      <ListItem divider={index < tools.length - 1}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            minWidth: 40,
                            justifyContent: 'center',
                            mr: 1,
                          }}
                        >
                          <Icon
                            aria-hidden
                            icon={getToolIcon(tool.name, 'mcp')}
                            style={{ fontSize: 18, marginRight: 8 }}
                          />
                        </Box>

                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1">{tool.name}</Typography>
                              <Chip label={t('MCP')} size="small" color="info" variant="outlined" />
                            </Box>
                          }
                          secondary={
                            tool.description ??
                            t('Tool: {{toolName}}', {
                              toolName: tool.toolName,
                            })
                          }
                        />

                        <ListItemSecondaryAction>
                          <Switch
                            size="small"
                            edge="end"
                            disabled={!isMcpConfigReady || isSaving || requiresReload}
                            onChange={() => handleToggleMcpTool(tool)}
                            checked={isMcpToolEnabled(tool)}
                            inputProps={{
                              'aria-label': t('Enable {{toolName}}', { toolName: tool.name }),
                            }}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}

          {filteredMcpTools.length === 0 && allKnownMcpTools.length > 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: 'italic', textAlign: 'center', py: 3 }}
            >
              {t('No tools match your search query.')}
            </Typography>
          )}

          {allKnownMcpTools.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: 'italic', textAlign: 'center', py: 3 }}
            >
              {t('No MCP tools available. Connect to MCP servers to see available tools.')}
            </Typography>
          )}
        </>
      )}
    </>
  ); // Get tool categories
  const kubernetesTools = AVAILABLE_TOOLS.filter(ToolClass => {
    const tempTool = new ToolClass();
    return tempTool.config.name.includes('kubernetes') || tempTool.config.name.includes('k8s');
  });

  const otherTools = AVAILABLE_TOOLS.filter(ToolClass => {
    const tempTool = new ToolClass();
    return !tempTool.config.name.includes('kubernetes') && !tempTool.config.name.includes('k8s');
  });

  const renderToolList = (
    tools: typeof AVAILABLE_TOOLS,
    title: string,
    subtitle?: string
  ): React.ReactNode => (
    <>
      <Box sx={{ mb: 2 }}>
        <Typography component="h3" variant="h6" sx={{ mb: 0.5 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>

      <List>
        {tools.map(ToolClass => {
          const tempTool = new ToolClass();
          const toolName = tempTool.config.name;
          const isEnabled = localEnabledTools.includes(toolName);

          return (
            <ListItem key={toolName} divider>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                <Icon
                  aria-hidden
                  icon={getToolIcon(toolName)}
                  style={{ fontSize: 20, marginRight: 8 }}
                />
              </Box>
              <ListItemText
                primary={<Typography variant="body1">{toolName}</Typography>}
                secondary={t(tempTool.config.shortDescription || tempTool.config.description)}
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  disabled={isSaving || requiresReload}
                  onChange={() => handleToggleRegularTool(toolName)}
                  checked={isEnabled}
                  color="primary"
                  inputProps={{
                    'aria-label': t('Enable {{toolName}}', {
                      toolName,
                    }),
                  }}
                />
              </ListItemSecondaryAction>
            </ListItem>
          );
        })}
      </List>
    </>
  );

  return (
    <DialogSlot
      open={open}
      onClose={handleCancel}
      aria-labelledby={titleId}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' },
      }}
    >
      <DialogTitle id={titleId}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon aria-hidden icon="mdi:tools" style={{ fontSize: 24 }} />
          <Typography component="span" variant="h6">
            {t('Manage Tools')}
          </Typography>
          <Chip
            label={
              localEnabledTools.length === 1
                ? t('1 built-in tool enabled')
                : t('{{count}} built-in tools enabled', { count: localEnabledTools.length })
            }
            size="small"
            color="primary"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        {saveErrorKey && (
          <Typography role="alert" color="error" sx={{ mb: 2 }}>
            {t(saveErrorKey)}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t(
            'Enable or disable tools that the AI can use. Changes take effect after you save them.'
          )}
        </Typography>

        {/* Kubernetes Tools */}
        {kubernetesTools.length > 0 && (
          <>
            {renderToolList(
              kubernetesTools,
              t('Kubernetes Tools'),
              t('Tools for interacting with Kubernetes clusters')
            )}
            <Divider sx={{ my: 3 }} />
          </>
        )}

        {/* Other Tools */}
        {otherTools.length > 0 &&
          renderToolList(
            otherTools,
            t('System Tools'),
            t('General purpose tools for various operations')
          )}

        {/* MCP Tools */}
        {renderMcpToolList()}

        {(kubernetesTools.length > 0 || otherTools.length > 0) && <Divider sx={{ my: 3 }} />}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel} disabled={isSaving}>
          {t('Cancel')}
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={isSaving || requiresReload}>
          {t('Save Changes')}
        </Button>
      </DialogActions>
    </DialogSlot>
  );
};

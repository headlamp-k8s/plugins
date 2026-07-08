import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import { type MCPConfig, type MCPServer, MCPSettings } from './MCPSettings';
import {
  browserOnlyMCPSettingsArgs,
  configuredMCPConfig,
  createDesktopApi,
  createMemoryConfigStore,
  disabledMCPConfig,
} from './MCPSettings.stories';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options
        ? key.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options[name] ?? ''))
        : key,
  }),
}));

vi.mock('@iconify/react', () => ({
  Icon: ({ icon, ...props }: { icon: string; 'aria-hidden'?: boolean | 'true' | 'false' }) => (
    <span data-icon={icon} {...props} />
  ),
}));

vi.mock('../MCPConfigEditorDialog/MCPConfigEditorDialog', () => ({
  default: ({
    open,
    onSave,
    onClose,
  }: {
    open: boolean;
    onSave: (config: MCPConfig) => void;
    onClose: () => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Mock JSON editor">
        <button
          onClick={() => {
            onSave({ enabled: true, servers: [] });
            onClose();
          }}
        >
          Stage JSON config
        </button>
      </div>
    ) : null,
}));

vi.mock('../MCPServerEditor/MCPServerEditor', () => ({
  default: ({
    open,
    server,
    onSave,
    onClose,
  }: {
    open: boolean;
    server?: MCPServer;
    onSave: (server: MCPServer) => void;
    onClose: () => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Mock server editor">
        <button
          onClick={() => {
            onSave(
              server
                ? { ...server, command: `${server.command}-edited` }
                : { name: 'new-server', command: 'npx', args: ['mcp'], enabled: true }
            );
            onClose();
          }}
        >
          Stage server
        </button>
        <button
          onClick={() => {
            if (server) onSave(server);
            onClose();
          }}
        >
          Keep server
        </button>
      </div>
    ) : null,
}));

beforeEach(() => {
  delete window.desktopApi;
  vi.restoreAllMocks();
});

afterEach(cleanup);

function renderDesktop(initialConfig: MCPConfig = configuredMCPConfig, onConfigChange = vi.fn()) {
  const store = createMemoryConfigStore({ mcpConfig: initialConfig, retained: true });
  const desktopApi = createDesktopApi(store);
  window.desktopApi = desktopApi;
  render(
    <main>
      <MCPSettings isRunningAsApp configStore={store} onConfigChange={onConfigChange} />
    </main>
  );
  return { store, desktopApi, onConfigChange };
}

it('renders browser-only guidance and passes axe', async () => {
  render(
    <main>
      <MCPSettings {...browserOnlyMCPSettingsArgs} />
    </main>
  );
  expect(
    screen.getByText('MCP server configuration is only available in the desktop app.')
  ).toBeTruthy();
  await expect(runAxe()).resolves.toEqual([]);
});

it('loads and renders configured desktop servers with named controls and passes axe', async () => {
  renderDesktop();

  expect(await screen.findByText('cluster-inspector')).toBeTruthy();
  expect(screen.getByText('2 servers configured; 1 enabled')).toBeTruthy();
  expect(screen.getByRole('checkbox', { name: 'Enable server cluster-inspector' })).toHaveProperty(
    'checked',
    true
  );
  expect(screen.getByRole('checkbox', { name: 'Auto approve server metrics' })).toHaveProperty(
    'checked',
    false
  );
  await expect(runAxe()).resolves.toEqual([]);
});

it('preserves staged server edits when globally disabling MCP', async () => {
  const { desktopApi, onConfigChange } = renderDesktop();
  const updateConfig = vi.spyOn(desktopApi.mcp, 'updateConfig');
  await screen.findByText('cluster-inspector');

  fireEvent.click(screen.getByRole('button', { name: 'Add MCP Server' }));
  fireEvent.click(screen.getByRole('button', { name: 'Stage server' }));
  expect(screen.getByText('(Unsaved changes)')).toBeTruthy();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Enable MCP Servers' }));

  await waitFor(() => expect(updateConfig).toHaveBeenCalled());
  const persisted = updateConfig.mock.calls[0][0];
  expect(persisted.enabled).toBe(false);
  expect(persisted.servers.map(server => server.name)).not.toContain('new-server');
  expect(onConfigChange).toHaveBeenCalledWith(persisted);

  fireEvent.click(screen.getByRole('checkbox', { name: 'Enable MCP Servers' }));
  await waitFor(() => expect(updateConfig).toHaveBeenCalledTimes(2));
  expect(await screen.findByText('new-server')).toBeTruthy();
  expect(screen.getByText('(Unsaved changes)')).toBeTruthy();
});

it('keeps staged changes and reports failure when desktop persistence fails', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const { desktopApi, onConfigChange } = renderDesktop();
  vi.spyOn(desktopApi.mcp, 'updateConfig').mockResolvedValue({
    success: false,
    error: 'disk full',
  });
  await screen.findByText('cluster-inspector');
  fireEvent.click(screen.getByRole('button', { name: 'Add MCP Server' }));
  fireEvent.click(screen.getByRole('button', { name: 'Stage server' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

  expect((await screen.findByRole('alert')).textContent).toContain(
    'Failed to save MCP configuration.'
  );
  expect(screen.getByText('(Unsaved changes)')).toBeTruthy();
  expect(onConfigChange).not.toHaveBeenCalled();
  expect(consoleError).toHaveBeenCalled();
});

it('prevents concurrent save requests while persistence is in flight', async () => {
  const { desktopApi } = renderDesktop();
  let resolveUpdate: (value: { success: boolean }) => void = () => undefined;
  const updateConfig = vi.spyOn(desktopApi.mcp, 'updateConfig').mockImplementation(
    () =>
      new Promise(resolve => {
        resolveUpdate = resolve;
      })
  );
  await screen.findByText('cluster-inspector');
  fireEvent.click(screen.getByRole('checkbox', { name: 'Enable server metrics' }));
  const saveButton = screen.getByRole('button', { name: 'Save Changes' });

  fireEvent.click(saveButton);
  expect(saveButton).toHaveProperty('disabled', true);
  fireEvent.click(saveButton);
  expect(updateConfig).toHaveBeenCalledOnce();

  resolveUpdate({ success: true });
  await waitFor(() => expect(screen.queryByText('(Unsaved changes)')).toBeNull());
});

it('saves staged changes, updates the generic store, and clears unsaved state', async () => {
  const { store, onConfigChange } = renderDesktop();
  await screen.findByText('cluster-inspector');
  fireEvent.click(screen.getByRole('checkbox', { name: 'Enable server metrics' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Auto approve server metrics' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

  await waitFor(() => expect(screen.queryByText('(Unsaved changes)')).toBeNull());
  const stored = store.mcpConfig();
  expect(stored?.servers[1]).toEqual(expect.objectContaining({ enabled: true, autoApprove: true }));
  expect(store.data().retained).toBe(true);
  expect(onConfigChange).toHaveBeenCalledWith(stored);
});

it('discards staged changes', async () => {
  renderDesktop();
  await screen.findByText('cluster-inspector');
  fireEvent.click(screen.getByRole('button', { name: 'Delete server metrics' }));
  expect(screen.queryByText('metrics')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
  expect(screen.getByText('metrics')).toBeTruthy();
  expect(screen.queryByText('(Unsaved changes)')).toBeNull();
});

it('stages edited servers but ignores an unchanged edit', async () => {
  renderDesktop();
  await screen.findByText('cluster-inspector');
  fireEvent.click(screen.getByRole('button', { name: 'Edit server cluster-inspector' }));
  fireEvent.click(screen.getByRole('button', { name: 'Keep server' }));
  expect(screen.queryByText('(Unsaved changes)')).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Edit server cluster-inspector' }));
  fireEvent.click(screen.getByRole('button', { name: 'Stage server' }));
  expect(screen.getByText('(Unsaved changes)')).toBeTruthy();
});

it('opens the JSON editor and stages its replacement config', async () => {
  renderDesktop();
  await screen.findByText('cluster-inspector');
  fireEvent.click(screen.getByRole('button', { name: 'Edit as JSON' }));
  fireEvent.click(screen.getByRole('button', { name: 'Stage JSON config' }));
  expect(
    screen.getByText('No MCP servers configured. Click "Add MCP Server" to get started.')
  ).toBeTruthy();
  expect(screen.getByText('(Unsaved changes)')).toBeTruthy();
});

it('falls back to stored config when the desktop bridge is absent or loading throws', async () => {
  const store = createMemoryConfigStore({ mcpConfig: configuredMCPConfig });
  const { rerender } = render(<MCPSettings isRunningAsApp configStore={store} />);
  expect(await screen.findByText('cluster-inspector')).toBeTruthy();

  const desktopApi = createDesktopApi(store);
  vi.spyOn(desktopApi.mcp, 'getConfig').mockRejectedValueOnce(new Error('bridge failed'));
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  window.desktopApi = desktopApi;
  rerender(<MCPSettings isRunningAsApp configStore={store} />);
  expect(await screen.findByText('metrics')).toBeTruthy();
});

it('uses the empty config for malformed stored data', async () => {
  const store = createMemoryConfigStore({ mcpConfig: { enabled: true, servers: [null] } });
  render(<MCPSettings isRunningAsApp configStore={store} />);
  const globalSwitch = await screen.findByRole('checkbox', { name: 'Enable MCP Servers' });
  expect(globalSwitch).toHaveProperty('checked', false);
  expect(screen.queryByText('Configured Servers')).toBeNull();
});

it('rejects duplicate stored server names case-insensitively', async () => {
  const duplicateConfig = {
    enabled: true,
    servers: [
      configuredMCPConfig.servers[0],
      { ...configuredMCPConfig.servers[0], name: 'CLUSTER-INSPECTOR' },
    ],
  };
  const store = createMemoryConfigStore({ mcpConfig: duplicateConfig });
  render(<MCPSettings isRunningAsApp configStore={store} />);
  expect(await screen.findByRole('checkbox', { name: 'Enable MCP Servers' })).toHaveProperty(
    'checked',
    false
  );
});

it('renders the singular server count', async () => {
  renderDesktop({ enabled: true, servers: [configuredMCPConfig.servers[0]] });
  expect(await screen.findByText('1 server configured; 1 enabled')).toBeTruthy();
});

it('loads a disabled config and can enable it', async () => {
  const { desktopApi } = renderDesktop(disabledMCPConfig);
  const updateConfig = vi.spyOn(desktopApi.mcp, 'updateConfig');
  const globalSwitch = await screen.findByRole('checkbox', { name: 'Enable MCP Servers' });
  fireEvent.click(globalSwitch);
  await waitFor(() => expect(updateConfig).toHaveBeenCalledWith({ enabled: true, servers: [] }));
});

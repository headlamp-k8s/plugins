import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { act } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import MCPConfigEditorDialog from './MCPConfigEditorDialog';
import {
  closedMCPConfigEditorArgs,
  openMCPConfigEditorArgs,
  sampleMCPConfig,
} from './MCPConfigEditorDialog.stories';

const editorMock = vi.hoisted(() => vi.fn());

vi.mock('@monaco-editor/react', () => ({
  default: (props: {
    value?: string;
    onChange?: (value: string | undefined) => void;
    theme?: string;
  }) => {
    editorMock(props);
    return (
      <textarea
        aria-label="Monaco editor"
        value={props.value ?? ''}
        onChange={event => props.onChange?.(event.target.value)}
      />
    );
  },
}));

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

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(cleanup);

function setEditorContent(value: string): void {
  fireEvent.change(screen.getByRole('textbox', { name: 'Monaco editor' }), {
    target: { value },
  });
}

it('initializes the editor, labels its views, uses the dark theme, and passes axe', async () => {
  localStorage.setItem('headlampThemePreference', 'dark');
  render(<MCPConfigEditorDialog {...openMCPConfigEditorArgs} />);

  expect(screen.getByRole('dialog', { name: 'Edit MCP Configuration' })).toBeTruthy();
  expect(screen.getByRole('tablist', { name: 'MCP configuration views' })).toBeTruthy();
  expect(screen.getByRole('region', { name: 'MCP configuration JSON editor' })).toBeTruthy();
  expect(screen.getByRole('textbox', { name: 'Monaco editor' })).toHaveProperty(
    'value',
    JSON.stringify(sampleMCPConfig, null, 2)
  );
  expect(editorMock).toHaveBeenCalledWith(expect.objectContaining({ theme: 'vs-dark' }));
  await expect(runAxe()).resolves.toEqual([]);
});

it('normalizes and saves a valid configuration before closing', () => {
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(<MCPConfigEditorDialog {...openMCPConfigEditorArgs} onSave={onSave} onClose={onClose} />);
  setEditorContent(
    JSON.stringify({
      enabled: true,
      servers: [
        {
          name: ' server ',
          command: ' command ',
          args: ['--stdio'],
          env: { KEY: 'value' },
          enabled: true,
          autoApprove: true,
          ignored: 'removed',
        },
      ],
      ignored: true,
    })
  );

  fireEvent.click(screen.getByRole('button', { name: 'Save Configuration' }));
  expect(onSave).toHaveBeenCalledWith({
    enabled: true,
    servers: [
      {
        name: 'server',
        command: 'command',
        args: ['--stdio'],
        env: { KEY: 'value' },
        enabled: true,
        autoApprove: true,
      },
    ],
  });
  expect(onClose).toHaveBeenCalledOnce();
});

it.each([
  [null, 'enabled field must be a boolean'],
  [{ enabled: true, servers: {} }, 'servers field must be an array'],
  [{ enabled: true, servers: [null] }, 'Server 1 must be an object'],
  [
    { enabled: true, servers: [{ name: '', command: 'cmd', args: [], enabled: true }] },
    'Server 1: name must be a non-empty string',
  ],
  [
    { enabled: true, servers: [{ name: 's', command: '', args: [], enabled: true }] },
    'Server 1: command must be a non-empty string',
  ],
  [
    { enabled: true, servers: [{ name: 's', command: 'cmd', args: [1], enabled: true }] },
    'Server 1: args must be an array of strings',
  ],
  [
    {
      enabled: true,
      servers: [{ name: 's', command: 'cmd', args: [], env: { KEY: 1 }, enabled: true }],
    },
    'Server 1: env must contain only string key-value pairs',
  ],
  [
    { enabled: true, servers: [{ name: 's', command: 'cmd', args: [], enabled: 'yes' }] },
    'Server 1: enabled must be a boolean',
  ],
  [
    {
      enabled: true,
      servers: [{ name: 's', command: 'cmd', args: [], enabled: true, autoApprove: 'yes' }],
    },
    'Server 1: autoApprove must be a boolean',
  ],
] as const)('rejects invalid configuration JSON', (value, message) => {
  const onSave = vi.fn();
  render(<MCPConfigEditorDialog {...openMCPConfigEditorArgs} onSave={onSave} />);
  setEditorContent(JSON.stringify(value));

  fireEvent.click(screen.getByRole('button', { name: 'Save Configuration' }));
  expect(screen.getByRole('alert').textContent).toBe(message);
  expect(onSave).not.toHaveBeenCalled();
});

it('rejects duplicate server names case-insensitively', () => {
  const onSave = vi.fn();
  render(<MCPConfigEditorDialog {...openMCPConfigEditorArgs} onSave={onSave} />);
  const server = { name: 'server', command: 'npx', args: [], enabled: true };
  setEditorContent(
    JSON.stringify({ enabled: true, servers: [server, { ...server, name: 'SERVER' }] })
  );

  fireEvent.click(screen.getByRole('button', { name: 'Save Configuration' }));
  expect(screen.getByRole('alert').textContent).toBe('Server names must be unique');
  expect(onSave).not.toHaveBeenCalled();
});

it('shows translated invalid JSON and clears validation when editing resumes', () => {
  render(<MCPConfigEditorDialog {...openMCPConfigEditorArgs} />);
  setEditorContent('{');
  fireEvent.click(screen.getByRole('button', { name: 'Save Configuration' }));
  expect(screen.getByRole('alert').textContent).toBe('Invalid JSON configuration');

  setEditorContent('{}');
  expect(screen.queryByRole('alert')).toBeNull();
  act(() => editorMock.mock.lastCall?.[0].onChange?.(undefined));
  expect(screen.getByRole('textbox', { name: 'Monaco editor' })).toHaveProperty('value', '{}');
});

it('loads the example, resets to host config, and cancels', () => {
  const onClose = vi.fn();
  render(<MCPConfigEditorDialog {...openMCPConfigEditorArgs} onClose={onClose} />);

  fireEvent.click(screen.getByRole('button', { name: 'Load Example' }));
  expect(screen.getByRole('textbox', { name: 'Monaco editor' })).toHaveProperty(
    'value',
    expect.stringContaining('flux-mcp')
  );
  fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
  expect(screen.getByRole('textbox', { name: 'Monaco editor' })).toHaveProperty(
    'value',
    JSON.stringify(sampleMCPConfig, null, 2)
  );
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onClose).toHaveBeenCalledOnce();
});

it('renders translated schema documentation, disables save, and passes axe', async () => {
  render(<MCPConfigEditorDialog {...openMCPConfigEditorArgs} />);
  fireEvent.click(screen.getByRole('tab', { name: 'Schema Documentation' }));

  expect(screen.getByRole('tabpanel', { name: 'Schema Documentation' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Configuration Schema', level: 3 })).toBeTruthy();
  expect(screen.getByLabelText('MCP configuration schema example').textContent).toContain(
    'boolean - Enable or disable all MCP servers'
  );
  expect(screen.getByRole('button', { name: 'Save Configuration' })).toHaveProperty(
    'disabled',
    true
  );
  await expect(runAxe()).resolves.toEqual([]);
});

it('falls back to the light theme when storage is unavailable', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
    throw new DOMException('Blocked', 'SecurityError');
  });
  expect(() => render(<MCPConfigEditorDialog {...openMCPConfigEditorArgs} />)).not.toThrow();
  expect(editorMock).toHaveBeenCalledWith(expect.objectContaining({ theme: 'light' }));
});

it('resets when reopened with new config and forwards a custom dialog slot', () => {
  const slot = vi.fn();
  function DialogSlot({
    children,
    open,
  }: PropsWithChildren<{ open?: boolean }>): React.ReactElement {
    slot(open);
    return <section>{children}</section>;
  }
  const { rerender } = render(
    <MCPConfigEditorDialog {...closedMCPConfigEditorArgs} DialogSlot={DialogSlot} />
  );
  const nextConfig = { enabled: false, servers: [] };
  rerender(
    <MCPConfigEditorDialog
      {...openMCPConfigEditorArgs}
      config={nextConfig}
      DialogSlot={DialogSlot}
    />
  );

  expect(screen.getByRole('textbox', { name: 'Monaco editor' })).toHaveProperty(
    'value',
    JSON.stringify(nextConfig, null, 2)
  );
  expect(slot).toHaveBeenCalledWith(false);
  expect(slot).toHaveBeenCalledWith(true);
});

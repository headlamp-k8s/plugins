import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import MCPServerEditor from './MCPServerEditor';
import {
  addServerArgs,
  closedServerEditorArgs,
  editServerArgs,
  sampleMCPServer,
} from './MCPServerEditor.stories';

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

afterEach(cleanup);

function changeField(name: string, value: string): void {
  fireEvent.change(screen.getByRole('textbox', { name: new RegExp(name, 'i') }), {
    target: { value },
  });
}

function save(): void {
  fireEvent.click(screen.getByRole('button', { name: /Add Server|Save/ }));
}

it('renders accessible add-server defaults and passes axe', async () => {
  render(
    <main>
      <MCPServerEditor {...addServerArgs} />
    </main>
  );

  expect(screen.getByRole('dialog', { name: 'Add MCP Server' })).toBeTruthy();
  expect(screen.getByRole('textbox', { name: /Arguments/ })).toHaveProperty('value', '[]');
  expect(screen.getByRole('checkbox', { name: 'Enabled' })).toHaveProperty('checked', true);
  expect(screen.getByRole('checkbox', { name: 'Auto Approve' })).toHaveProperty('checked', false);
  expect(screen.getByText('No environment variables configured')).toBeTruthy();
  await expect(runAxe()).resolves.toEqual([]);
});

it('loads the example server and clears stale validation', () => {
  render(<MCPServerEditor {...addServerArgs} />);
  save();
  expect(screen.getByRole('alert').textContent).toBe('Server name is required');

  fireEvent.click(screen.getByRole('button', { name: 'Load Example' }));

  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByRole('textbox', { name: /Server Name/ })).toHaveProperty('value', 'flux-mcp');
  expect(screen.getByRole('textbox', { name: /Command/ })).toHaveProperty(
    'value',
    'flux-operator-mcp'
  );
  expect(screen.getByRole('textbox', { name: /Arguments/ })).toHaveProperty(
    'value',
    JSON.stringify(['serve', '--kube-context', 'HEADLAMP_CURRENT_CLUSTER'])
  );
  expect(screen.getByRole('textbox', { name: 'Environment variable 1 key' })).toHaveProperty(
    'value',
    'KUBECONFIG'
  );
});

it.each([
  ['', 'npx', '[]', 'Server name is required'],
  ['server', '', '[]', 'Command is required'],
  [' EXISTING-SERVER ', 'npx', '[]', 'A server with this name already exists'],
  ['server', 'npx', '{', 'Arguments must be valid JSON'],
  ['server', 'npx', '[1]', 'Arguments must be a JSON array of strings'],
] as const)(
  'validates required, duplicate, and argument fields',
  (name, command, args, message) => {
    render(<MCPServerEditor {...addServerArgs} />);
    changeField('Server Name', name);
    changeField('Command', command);
    changeField('Arguments', args);

    save();
    expect(screen.getByRole('alert').textContent).toBe(message);
  }
);

it('validates empty and duplicate environment keys', () => {
  render(<MCPServerEditor {...addServerArgs} />);
  changeField('Server Name', 'server');
  changeField('Command', 'npx');
  fireEvent.click(screen.getByRole('button', { name: 'Add Variable' }));
  save();
  expect(screen.getByRole('alert').textContent).toBe('Environment variable keys cannot be empty');

  changeField('Environment variable 1 key', 'KEY');
  fireEvent.click(screen.getByRole('button', { name: 'Add Variable' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Environment variable 2 key' }), {
    target: { value: 'KEY' },
  });
  save();
  expect(screen.getByRole('alert').textContent).toBe('Environment variable keys must be unique');
});

it('saves normalized fields while preserving exact argument values and auto approval', () => {
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(<MCPServerEditor {...addServerArgs} onSave={onSave} onClose={onClose} />);
  changeField('Server Name', ' server ');
  changeField('Command', ' npx ');
  changeField('Arguments', JSON.stringify(['--label', 'production cluster']));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Auto Approve' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add Variable' }));
  changeField('Environment variable 1 key', ' LOG_LEVEL ');
  changeField('Environment variable 1 value', ' debug ');

  save();

  expect(onSave).toHaveBeenCalledWith({
    name: 'server',
    command: 'npx',
    args: ['--label', 'production cluster'],
    env: { LOG_LEVEL: ' debug ' },
    enabled: true,
    autoApprove: true,
  });
  expect(onClose).toHaveBeenCalledOnce();
});

it('round-trips editing state and excludes the original name from duplicates', () => {
  const onSave = vi.fn();
  render(<MCPServerEditor {...editServerArgs} onSave={onSave} />);

  expect(screen.getByRole('heading', { name: 'Edit Server' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Load Example' })).toBeNull();
  expect(screen.getByRole('textbox', { name: /Arguments/ })).toHaveProperty(
    'value',
    JSON.stringify(sampleMCPServer.args)
  );
  expect(screen.getByRole('checkbox', { name: 'Auto Approve' })).toHaveProperty('checked', true);
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(onSave).toHaveBeenCalledWith(sampleMCPServer);
});

it('adds, updates, and removes environment rows with translated accessible names', () => {
  render(<MCPServerEditor {...addServerArgs} />);
  fireEvent.click(screen.getByRole('button', { name: 'Add Variable' }));
  changeField('Environment variable 1 key', 'TOKEN');
  expect(screen.getByRole('button', { name: 'Remove environment variable TOKEN' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Remove environment variable TOKEN' }));
  expect(screen.getByText('No environment variables configured')).toBeTruthy();
});

it('resets when reopened and forwards a custom dialog slot', () => {
  const slot = vi.fn();
  function DialogSlot({
    children,
    open,
  }: PropsWithChildren<{ open?: boolean }>): React.ReactElement {
    slot(open);
    return <section>{children}</section>;
  }
  const { rerender } = render(
    <MCPServerEditor {...closedServerEditorArgs} DialogSlot={DialogSlot} />
  );
  rerender(<MCPServerEditor {...editServerArgs} DialogSlot={DialogSlot} />);

  expect(screen.getByRole('textbox', { name: /Server Name/ })).toHaveProperty(
    'value',
    sampleMCPServer.name
  );
  expect(slot).toHaveBeenCalledWith(false);
  expect(slot).toHaveBeenCalledWith(true);
});

it('cancels without saving', () => {
  const onClose = vi.fn();
  const onSave = vi.fn();
  render(<MCPServerEditor {...addServerArgs} onClose={onClose} onSave={onSave} />);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onClose).toHaveBeenCalledOnce();
  expect(onSave).not.toHaveBeenCalled();
});

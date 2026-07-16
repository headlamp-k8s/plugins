import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import LogsDialog from './LogsDialog';
import { emptyLogsDialogArgs, jsonLogsDialogArgs, plainLogsDialogArgs } from './LogsDialog.stories';

const editorMock = vi.hoisted(() => vi.fn());

vi.mock('@monaco-editor/react', () => ({
  default: (props: Record<string, unknown>) => {
    editorMock(props);
    return <pre data-testid="editor">{String(props.value ?? '')}</pre>;
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
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn(async () => undefined) },
  });
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:logs'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });
  localStorage.clear();
});

afterEach(cleanup);

it('renders plain logs in a named read-only editor region and passes axe', async () => {
  render(
    <main>
      <LogsDialog {...plainLogsDialogArgs} />
    </main>
  );

  expect(screen.getByRole('heading', { name: 'Pod api Logs (Editor View)' })).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Read-only logs for Pod api Logs' })).toBeTruthy();
  expect(screen.getByTestId('editor').textContent).toBe(plainLogsDialogArgs.logs);
  expect(editorMock).toHaveBeenCalledWith(
    expect.objectContaining({ language: 'text', theme: 'light' })
  );
  await expect(runAxe()).resolves.toEqual([]);
});

it('pretty-prints JSON and uses the persisted dark theme', () => {
  localStorage.setItem('headlampThemePreference', 'dark');
  render(<LogsDialog {...jsonLogsDialogArgs} />);

  expect(screen.getByText('(Auto-formatted)')).toBeTruthy();
  expect(screen.getByTestId('editor').textContent).toContain('"level": "info"');
  expect(editorMock).toHaveBeenCalledWith(
    expect.objectContaining({ language: 'json', theme: 'vs-dark' })
  );
});

it('falls back to the light theme when browser storage is unavailable', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
    throw new DOMException('Blocked', 'SecurityError');
  });

  expect(() => render(<LogsDialog {...plainLogsDialogArgs} />)).not.toThrow();
  expect(editorMock).toHaveBeenCalledWith(expect.objectContaining({ theme: 'light' }));
});

it('translates the empty-log fallback', () => {
  render(<LogsDialog {...emptyLogsDialogArgs} />);
  expect(screen.getByTestId('editor').textContent).toBe('No logs available');
});

it('copies formatted logs and recovers from clipboard failures', async () => {
  const writeText = vi.mocked(navigator.clipboard.writeText);
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  render(<LogsDialog {...jsonLogsDialogArgs} />);

  fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
  expect(writeText).toHaveBeenCalledWith(expect.stringContaining('"level": "info"'));

  writeText.mockRejectedValueOnce(new Error('denied'));
  fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
  await vi.waitFor(() => expect(consoleError).toHaveBeenCalled());
});

it.each([
  [jsonLogsDialogArgs, 'api-pod-logs.json'],
  [emptyLogsDialogArgs, 'resource-logs.txt'],
] as const)('downloads with a safe filename and releases the object URL', (args, filename) => {
  let downloadedFilename = '';
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(function (this: HTMLAnchorElement) {
      downloadedFilename = this.download;
    });
  render(<LogsDialog {...args} />);

  fireEvent.click(screen.getByRole('button', { name: 'Download' }));

  expect(click).toHaveBeenCalledOnce();
  expect(URL.createObjectURL).toHaveBeenCalled();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:logs');
  expect(downloadedFilename).toBe(filename);
});

it('invokes close and forwards a custom dialog slot', () => {
  const onClose = vi.fn();
  const slot = vi.fn();
  function CustomDialog({
    children,
    open,
  }: PropsWithChildren<{ open?: boolean }>): React.ReactElement {
    slot(open);
    return <aside>{children}</aside>;
  }
  render(<LogsDialog {...plainLogsDialogArgs} onClose={onClose} DialogSlot={CustomDialog} />);

  fireEvent.click(screen.getByRole('button', { name: 'Close' }));

  expect(onClose).toHaveBeenCalledOnce();
  expect(slot).toHaveBeenCalledWith(true);
});

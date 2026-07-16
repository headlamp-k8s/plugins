import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import MCPFormattedMessage, { withMCPFormatting } from './MCPFormattedMessage';
import { formattedErrorContent, formattedTableContent } from './MCPFormattedMessage.stories';

vi.mock('../../mcpOutput/MCPOutputDisplay/MCPOutputDisplay', () => ({
  default: (props: {
    output: { title: string };
    onExport?: (format: 'json' | 'csv' | 'txt') => void;
    onRetry?: () => void;
  }) => (
    <section aria-label="MCP output">
      <h2>{props.output.title}</h2>
      {props.onExport && (
        <>
          <button onClick={() => props.onExport?.('json')}>Export JSON</button>
          <button onClick={() => props.onExport?.('csv')}>Export CSV</button>
          <button onClick={() => props.onExport?.('txt')}>Export TXT</button>
        </>
      )}
      {props.onRetry && <button onClick={props.onRetry}>Retry</button>}
    </section>
  ),
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
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:x'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
});
afterEach(cleanup);

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

it.each([
  'plain text',
  '{',
  JSON.stringify({ formatted: false, mcpOutput: {} }),
  JSON.stringify({ formatted: true, mcpOutput: { type: 'table' } }),
  JSON.stringify({
    formatted: true,
    mcpOutput: { type: 'unknown', title: 'x', summary: 'x', data: {} },
  }),
])('returns nothing for unrelated or malformed content', content => {
  const { container } = render(<MCPFormattedMessage content={content} />);
  expect(container.childElementCount).toBe(0);
});

it('renders framing, metadata, error states, and passes axe', async () => {
  const { rerender } = render(
    <main>
      <MCPFormattedMessage content={formattedTableContent} />
    </main>
  );
  expect(screen.getByText('AI-Formatted Tool Output')).toBeTruthy();
  expect(screen.getByText(/Processed by AI in 100ms/)).toBeTruthy();
  expect(screen.getByText(/1 insights generated/)).toBeTruthy();
  expect(screen.getByText(/1 action items/)).toBeTruthy();
  await expect(runAxe()).resolves.toEqual([]);

  rerender(<MCPFormattedMessage content={formattedErrorContent} />);
  expect(screen.getByText('Tool Error - AI Analysis')).toBeTruthy();
  expect(screen.getByText('Tool Execution Failed')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Export JSON' })).toBeNull();
});

it('omits assistant framing when requested', () => {
  render(<MCPFormattedMessage content={formattedTableContent} isAssistant={false} />);
  expect(screen.queryByText('AI-Formatted Tool Output')).toBeNull();
});

it('exports escaped CSV and all formats with safe filenames and URL cleanup', async () => {
  const downloads: string[] = [];
  const blobs: Blob[] = [];
  vi.mocked(URL.createObjectURL).mockImplementation(blob => {
    if (blob instanceof Blob) blobs.push(blob);
    return 'blob:x';
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    downloads.push(this.download);
  });
  render(<MCPFormattedMessage content={formattedTableContent} />);
  for (const name of ['Export JSON', 'Export CSV', 'Export TXT']) {
    fireEvent.click(screen.getByRole('button', { name }));
  }
  expect(downloads).toEqual([
    'kubernetes-get-pods.json',
    'kubernetes-get-pods.csv',
    'kubernetes-get-pods.txt',
  ]);
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3);
  const csv = await readBlob(blobs[1]);
  expect(csv).toContain('"Name","Status"');
  expect(csv).toContain('"pod,""one""","Running"');
});

it('falls back to JSON for non-table CSV export', () => {
  const content = JSON.stringify({
    formatted: true,
    mcpOutput: { type: 'text', title: 'Text', summary: 'Text', data: { content: 'hello' } },
    raw: 'hello',
  });
  render(<MCPFormattedMessage content={content} />);
  fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
  expect(URL.createObjectURL).toHaveBeenCalledOnce();
});

it('retries only with guarded args and a metadata or fallback tool name', () => {
  const onRetryTool = vi.fn();
  const { rerender } = render(
    <MCPFormattedMessage content={formattedTableContent} onRetryTool={onRetryTool} />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(onRetryTool).toHaveBeenCalledWith('kubernetes/get pods', { namespace: 'default' });

  const base = {
    formatted: true,
    mcpOutput: { type: 'text', title: 'x', summary: 'x', data: {} },
    raw: '',
    originalArgs: { key: 'value' },
    toolName: 'fallback-tool',
  };
  rerender(<MCPFormattedMessage content={JSON.stringify(base)} onRetryTool={onRetryTool} />);
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(onRetryTool).toHaveBeenCalledWith('fallback-tool', { key: 'value' });
  rerender(
    <MCPFormattedMessage
      content={JSON.stringify({ ...base, originalArgs: [] })}
      onRetryTool={onRetryTool}
    />
  );
  expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  expect(onRetryTool).toHaveBeenCalledTimes(2);
});

it('routes valid formatted content through the HOC and falls back otherwise', () => {
  const onRetryTool = vi.fn();
  function Base({ content, label }: { content: string; label: string }) {
    return (
      <p>
        {label}:{content}
      </p>
    );
  }
  const Wrapped = withMCPFormatting(Base);
  const { rerender } = render(<Wrapped content="plain" label="base" />);
  expect(screen.getByText('base:plain')).toBeTruthy();
  rerender(
    <Wrapped
      content={formattedTableContent}
      label="base"
      isAssistant={false}
      onRetryTool={onRetryTool}
    />
  );
  expect(screen.getByRole('region', { name: 'MCP output' })).toBeTruthy();
  expect(screen.queryByText('AI-Formatted Tool Output')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(onRetryTool).toHaveBeenCalledWith('kubernetes/get pods', { namespace: 'default' });
});

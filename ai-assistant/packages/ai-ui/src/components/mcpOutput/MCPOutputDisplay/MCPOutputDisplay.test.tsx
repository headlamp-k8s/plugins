import type { FormattedMCPOutput } from '@headlamp-k8s/ai-common/mcp/tools/formattedOutput';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import MCPOutputDisplay, { isMarkdownContent, safeStringify } from './MCPOutputDisplay';
import {
  errorOutput,
  listOutput,
  markdownOutput,
  metricsOutput,
  tableOutput,
} from './MCPOutputDisplay.stories';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) =>
      key.replace(/{{(\w+)}}/g, (_, name: string) => String(values?.[name] ?? '')),
  }),
}));
vi.mock('@iconify/react', () => ({
  Icon: ({ icon, ...props }: { icon: string; 'aria-hidden'?: boolean | 'true' | 'false' }) => (
    <span data-icon={icon} {...props} />
  ),
}));
vi.mock('react-syntax-highlighter/dist/esm/prism-light', () => ({
  default: Object.assign(
    ({ children, language }: { children: string | string[]; language?: string }) => (
      <pre data-language={language}>{children}</pre>
    ),
    { registerLanguage: vi.fn() }
  ),
}));

const originalInnerWidth = window.innerWidth;
afterEach(() => {
  cleanup();
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth });
});

it('detects explicit and patterned markdown without accepting plain text', () => {
  expect(isMarkdownContent({ language: 'md', content: 'plain' })).toBe(true);
  expect(isMarkdownContent({ content: '## Heading\n\n- item' })).toBe(true);
  expect(isMarkdownContent({ content: 'just plain output' })).toBe(false);
  expect(isMarkdownContent({})).toBe(false);
});

it('renders Storybook table metadata, warnings, insights, actions, sorts, and passes axe', async () => {
  render(
    <main>
      <MCPOutputDisplay output={tableOutput} />
    </main>
  );
  expect(screen.getByText('Pods in default namespace')).toBeTruthy();
  expect(screen.getByText('Warnings:')).toBeTruthy();
  expect(screen.getByText('Key Insights:')).toBeTruthy();
  expect(screen.getByText('Recommended Actions:')).toBeTruthy();
  expect(screen.getByText('Tool: kubernetes_get_pods')).toBeTruthy();
  const rows = screen.getAllByRole('row');
  expect(within(rows[1]).getByText('nginx')).toBeTruthy();
  fireEvent.click(screen.getByRole('columnheader', { name: 'Name' }));
  const nameHeader = screen.getByRole('columnheader', { name: 'Name' });
  expect(nameHeader.getAttribute('aria-sort')).toBe('ascending');
  fireEvent.keyDown(nameHeader, { key: 'Enter' });
  expect(nameHeader.getAttribute('aria-sort')).toBe('descending');
  expect(within(screen.getAllByRole('row')[1]).getByText('redis')).toBeTruthy();
  const highlightedRow = screen.getByText('frontend').closest('tr');
  expect(highlightedRow?.className).toContain('MuiTableRow-root');
  await expect(runAxe()).resolves.toEqual([]);
});

it('toggles raw data and calls every export format', () => {
  const onExport = vi.fn();
  render(<MCPOutputDisplay output={tableOutput} onExport={onExport} />);
  fireEvent.click(screen.getByRole('button', { name: 'Show raw data' }));
  expect(screen.getByText('Raw Data:')).toBeTruthy();
  for (const format of ['JSON', 'CSV', 'Text']) {
    fireEvent.click(screen.getByRole('button', { name: 'Export data' }));
    fireEvent.click(screen.getByRole('menuitem', { name: format }));
  }
  expect(onExport.mock.calls).toEqual([['json'], ['csv'], ['txt']]);
});

it('renders metrics, lists, graph, raw, and malformed extensions safely', () => {
  const { rerender } = render(<MCPOutputDisplay output={metricsOutput} />);
  expect(screen.getByText('45%')).toBeTruthy();
  expect(screen.getByText('Trends:')).toBeTruthy();
  rerender(<MCPOutputDisplay output={listOutput} />);
  expect(screen.getByText('system namespace')).toBeTruthy();

  const graph: FormattedMCPOutput = {
    type: 'graph',
    title: 'Traffic graph',
    summary: 'Traffic over time',
    data: { description: 'Traffic chart', chartType: 'line', datasets: [{ points: [] }] },
  };
  rerender(<MCPOutputDisplay output={graph} />);
  expect(screen.getByText('Traffic chart')).toBeTruthy();
  expect(screen.getByText('Chart Type: line • 1 datasets')).toBeTruthy();

  const raw: FormattedMCPOutput = {
    type: 'raw',
    title: 'Raw output',
    summary: 'Unformatted output',
    data: { nested: { ok: true } },
  };
  rerender(<MCPOutputDisplay output={raw} />);
  expect(screen.getAllByText(/"nested"/).length).toBeGreaterThan(0);

  rerender(
    <MCPOutputDisplay
      output={{
        ...metricsOutput,
        data: { primary: [null, { label: 3, value: {} }], trends: 'bad' },
      }}
    />
  );
  expect(screen.queryByText('Trends:')).toBeNull();
});

it('expands and collapses truncated markdown content', () => {
  render(<MCPOutputDisplay output={markdownOutput} />);
  expect(screen.getByText(/Content has been truncated/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Show Full Content' }));
  expect(screen.getByText('Scheduler: Healthy')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Collapse to Summary' }));
  expect(screen.queryByText('Scheduler: Healthy')).toBeNull();
});

it('sanitizes markdown links and ignores natural ellipses without full content', () => {
  const output: FormattedMCPOutput = {
    ...markdownOutput,
    data: {
      language: 'markdown',
      content: '## Waiting...\n\n- [Unsafe](javascript:alert(1))',
    },
  };
  render(<MCPOutputDisplay output={output} />);
  expect(screen.getByRole('link', { name: 'Unsafe' }).getAttribute('href')).toBe('#');
  expect(screen.queryByText(/Content has been truncated/)).toBeNull();
});

it('renders code-oriented text and empty text data safely', () => {
  const code: FormattedMCPOutput = {
    type: 'text',
    title: 'Script',
    summary: 'Generated command',
    data: { content: 'echo ready', language: 'bash', highlights: ['safe'] },
  };
  const { rerender } = render(<MCPOutputDisplay output={code} />);
  expect(screen.getByText('echo ready')).toBeTruthy();
  expect(screen.getByText('safe')).toBeTruthy();
  rerender(<MCPOutputDisplay output={{ ...code, data: { highlights: [42] } }} />);
  expect(screen.getByText('Script')).toBeTruthy();
});

it('renders errors with retry and fallback messages', () => {
  const onRetry = vi.fn();
  const { rerender } = render(<MCPOutputDisplay output={errorOutput} onRetry={onRetry} />);
  fireEvent.click(screen.getByRole('button', { name: 'Retry Tool' }));
  expect(onRetry).toHaveBeenCalledTimes(1);
  rerender(<MCPOutputDisplay output={{ ...errorOutput, data: {} }} />);
  expect(screen.getByText('Tool Execution Error')).toBeTruthy();
});

it('starts compact, expands, and collapses through labeled controls', () => {
  const { container } = render(<MCPOutputDisplay output={listOutput} compact />);
  const contentCollapse = container.querySelector('.MuiCollapse-hidden');
  expect(contentCollapse).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Expand output' }));
  expect(screen.getByText('default')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Collapse output' }));
  expect(screen.getByRole('button', { name: 'Expand output' })).toBeTruthy();
});

it('measures prompt width and falls back to viewport resize', () => {
  const prompt = document.createElement('div');
  prompt.id = 'prompt-container';
  prompt.style.width = '900px';
  document.body.append(prompt);
  const { container, unmount } = render(<MCPOutputDisplay output={listOutput} />);
  expect(getComputedStyle(container.firstElementChild ?? container).width).toBe('870px');
  unmount();
  prompt.remove();

  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 640 });
  const second = render(<MCPOutputDisplay output={listOutput} />);
  expect(getComputedStyle(second.container.firstElementChild ?? second.container).width).toBe(
    '610px'
  );
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
  fireEvent(window, new Event('resize'));
  expect(getComputedStyle(second.container.firstElementChild ?? second.container).width).toBe(
    '470px'
  );
});

it('stringifies circular raw and table data without crashing', () => {
  const circular: Record<string, unknown> = {};
  circular.self = circular;
  expect(safeStringify(circular)).toContain('[Circular]');
  const raw: FormattedMCPOutput = {
    type: 'raw',
    title: 'Circular output',
    summary: 'Circular formatter data',
    data: { circular },
  };
  const { rerender } = render(<MCPOutputDisplay output={raw} />);
  expect(screen.getAllByText(/\[Circular\]/).length).toBeGreaterThan(0);
  rerender(
    <MCPOutputDisplay
      output={{
        ...tableOutput,
        data: { headers: ['Object'], rows: [[circular]] },
      }}
    />
  );
  expect(screen.getAllByText(/\[Circular\]/).length).toBeGreaterThan(0);
});

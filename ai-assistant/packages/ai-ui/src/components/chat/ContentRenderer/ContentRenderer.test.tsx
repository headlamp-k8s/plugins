import { createTheme, ThemeProvider } from '@mui/material/styles';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import { formattedTableContent } from '../MCPFormattedMessage/MCPFormattedMessage.stories';
import ContentRenderer, {
  type ContentRendererProps,
  parseJsonContent,
  parseLogsButtonData,
} from './ContentRenderer';
import { markdownContentArgs, plainTextArgs, yamlContentArgs } from './ContentRenderer.stories';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) =>
      key.replace(/{{(\w+)}}/g, (_, name: string) => String(values?.[name] ?? '')),
  }),
}));
vi.mock('../../common/YamlDisplay/YamlDisplay', () => ({
  default: ({ yaml, title }: { yaml: string; title: string }) => (
    <section aria-label={`YAML ${title}`}>
      <pre>{yaml}</pre>
    </section>
  ),
}));
vi.mock('../../common/LogsButton/LogsButton', () => ({
  default: ({ logs, resourceName }: { logs: string; resourceName?: string }) => (
    <button>{resourceName ? `${resourceName}: ${logs}` : logs}</button>
  ),
}));
vi.mock('../../chat/MCPFormattedMessage/MCPFormattedMessage', async () => {
  const actual = await vi.importActual<
    typeof import('../../chat/MCPFormattedMessage/MCPFormattedMessage')
  >('../../chat/MCPFormattedMessage/MCPFormattedMessage');
  return {
    ...actual,
    default: ({ content }: { content: string }) => (
      <section aria-label="MCP output">{content}</section>
    ),
  };
});

afterEach(cleanup);

function renderContent(overrides: Partial<ContentRendererProps> = {}): void {
  render(<ContentRenderer {...plainTextArgs} {...overrides} />);
}

it('parses JSON and validates complete LOGS_BUTTON data', () => {
  expect(parseJsonContent('{"ok":true}')).toEqual({ success: true, data: { ok: true } });
  expect(parseJsonContent('{invalid').success).toBe(false);
  expect(
    parseLogsButtonData(
      'prefix LOGS_BUTTON:{"data":{"logs":"ready","resourceName":"api"}} suffix',
      'prefix '.length
    )
  ).toEqual({
    success: true,
    data: {
      data: { logs: 'ready', resourceName: 'api' },
      endIndex: 'prefix LOGS_BUTTON:{"data":{"logs":"ready","resourceName":"api"}}'.length,
    },
  });
  expect(parseLogsButtonData('LOGS_BUTTON:no object', 0).success).toBe(false);
  expect(parseLogsButtonData('LOGS_BUTTON:{"data":{}}', 0).success).toBe(false);
  expect(parseLogsButtonData('LOGS_BUTTON:{"data":{"logs":"object } still open"}}', 0)).toEqual({
    success: true,
    data: {
      data: { logs: 'object } still open' },
      endIndex: 'LOGS_BUTTON:{"data":{"logs":"object } still open"}}'.length,
    },
  });
  expect(parseLogsButtonData('LOGS_BUTTON:{bad}', 0).success).toBe(false);
});

it('renders Storybook markdown, safe links, a collapsible table, and passes axe', async () => {
  render(
    <main>
      <ContentRenderer
        {...markdownContentArgs}
        content={`${markdownContentArgs.content}\n| a | 1 |\n| b | 2 |\n| c | 3 |\n| d | 4 |\n| e | 5 |\n| f | 6 |\n\n[Unsafe](javascript:alert(1))`}
      />
    </main>
  );
  expect(screen.getByRole('heading', { name: 'Cluster summary' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Cluster summary', level: 1 })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'deployment guide' })).toHaveProperty('target', '_blank');
  expect(screen.getByRole('link', { name: 'Unsafe' }).getAttribute('href')).toBe('#');
  fireEvent.click(screen.getByRole('button', { name: 'Show More (8 total rows)' }));
  expect(screen.getByRole('button', { name: 'Show Less (5 rows)' })).toBeTruthy();
  await expect(runAxe()).resolves.toEqual([]);
});

it.each([
  ['error', '{"error":true,"content":"request failed"}', 'request failed'],
  ['success', '{"success":true,"content":"request complete"}', 'request complete'],
])('renders %s JSON status envelopes', (_, content, message) => {
  renderContent({ content });
  expect(screen.getByText(message)).toBeTruthy();
});

it('renders generic JSON and ignores non-string status content', () => {
  const { rerender } = render(<ContentRenderer content='{"items":[1,2]}' />);
  expect(screen.getByText(/"items"/)).toBeTruthy();
  rerender(<ContentRenderer content='{"error":true,"content":{"nested":true}}' />);
  expect(screen.getByText(/"nested"/)).toBeTruthy();
});

it('renders short tables without expansion controls and internal links in place', () => {
  renderContent({
    content:
      '| Name | Value |\n| --- | --- |\n| one | 1 |\n\n[Section](#details) [CDN](//cdn.example.com/file)',
  });
  expect(screen.queryByRole('button', { name: /Show More/ })).toBeNull();
  expect(screen.getByRole('link', { name: 'Section' }).getAttribute('target')).toBeNull();
  expect(screen.getByRole('link', { name: 'CDN' })).toHaveProperty(
    'href',
    'https://cdn.example.com/file'
  );
});

it('uses full width by default and rejects non-navigation URL schemes', () => {
  const { container } = render(<ContentRenderer content="[Payload](data:text/html,bad)" />);
  const root = container.firstElementChild;
  if (!root) throw new Error('ContentRenderer root was not rendered');
  expect(getComputedStyle(root).width).toBe('100%');
  expect(screen.getByRole('link', { name: 'Payload' }).getAttribute('href')).toBe('#');
});

it('dispatches formatted MCP and logs payloads to their specialized children', () => {
  const { rerender } = render(<ContentRenderer content={formattedTableContent} />);
  expect(screen.getByRole('region', { name: 'MCP output' })).toBeTruthy();
  rerender(
    <ContentRenderer content='Pod failed. LOGS_BUTTON:{"data":{"logs":"line one","resourceName":"api"}} Logs were collected.' />
  );
  expect(screen.getByText('Pod failed.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'api: line one' })).toBeTruthy();
  expect(screen.getByText('Logs were collected.')).toBeTruthy();
  rerender(<ContentRenderer content='{"formatted":true,"mcpOutput":"invalid"}' />);
  expect(screen.getByText(/"formatted"/)).toBeTruthy();
  rerender(<ContentRenderer content='{"formatted":true,"mcpOutput":{"tool":"pods"}}' />);
  expect(screen.getByText(/"mcpOutput"/)).toBeTruthy();
  rerender(<ContentRenderer content='LOGS_BUTTON:{"data":{"logs":"plain logs"}}' />);
  expect(screen.getByRole('button', { name: 'plain logs' })).toBeTruthy();
  rerender(<ContentRenderer content="before LOGS_BUTTON:{bad}" />);
  expect(screen.getByText(/LOGS_BUTTON/)).toBeTruthy();
});

it('finds LOGS_BUTTON JSON after whitespace without repeating JSON in the suffix', () => {
  const content = 'Before LOGS_BUTTON:  {"data":{"logs":"ready"}}\n\nAfter';
  const result = parseLogsButtonData(content, 'Before '.length);
  expect(result.success).toBe(true);
  if (!result.success) return;
  expect(content.slice(result.data.endIndex).trim()).toBe('After');
  renderContent({ content });
  expect(screen.getByText('Before')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'ready' })).toBeTruthy();
  expect(screen.getByText('After')).toBeTruthy();
  expect(screen.queryByText(/data.*logs/)).toBeNull();
});

it('renders Storybook YAML and JSON Kubernetes resources through YamlDisplay', () => {
  const { rerender } = render(<ContentRenderer {...yamlContentArgs} />);
  expect(screen.getByRole('region', { name: /YAML Deployment/ })).toBeTruthy();
  rerender(
    <ContentRenderer content='{"apiVersion":"v1","kind":"Service","metadata":{"name":"api"}}' />
  );
  expect(screen.getByRole('region', { name: /YAML Service - api/ })).toBeTruthy();
  rerender(
    <ContentRenderer
      content={'```yaml\napiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: cfg\n```'}
      onYamlDetected={vi.fn()}
    />
  );
  expect(screen.getByRole('region', { name: 'YAML ConfigMap' })).toBeTruthy();
  rerender(
    <ContentRenderer
      content={'```json\n{"apiVersion":"v1","kind":"Secret","metadata":{"name":"key"}}\n```'}
      onYamlDetected={vi.fn()}
    />
  );
  expect(screen.getByRole('region', { name: 'YAML Secret - key' })).toBeTruthy();
  rerender(
    <ContentRenderer
      content={'```yaml\napiVersion: v1\nkind: Namespace\nmetadata:\n  name: demo\n```'}
    />
  );
  expect(screen.getByRole('region', { name: 'YAML Namespace' })).toBeTruthy();
});

it('renders mixed multi-document YAML and prose sections', () => {
  renderContent({
    content:
      'Introduction\n---\napiVersion: v1\nkind: Service\nmetadata:\n  name: api\n---\n{"apiVersion":"v1","kind":"ConfigMap","metadata":{"name":"cfg"}}',
  });
  expect(screen.getByText('Introduction')).toBeTruthy();
  expect(screen.getByRole('region', { name: 'YAML Service - api' })).toBeTruthy();
  expect(screen.getByRole('region', { name: 'YAML ConfigMap - cfg' })).toBeTruthy();
});

it('does not treat prose mentioning JSON field names as a Kubernetes resource', () => {
  renderContent({
    content:
      'The `"apiVersion":`, `"kind":`, and `"metadata":` fields are required.\n\n> Keep them together.',
  });
  expect(screen.getByText(/fields are required/)).toBeTruthy();
  expect(screen.getByText('Keep them together.')).toBeTruthy();
  expect(screen.queryByRole('region', { name: /YAML/ })).toBeNull();
});

it('applies prompt width and updates when it changes', () => {
  const { container, rerender } = render(<ContentRenderer content="Sized" promptWidth="32rem" />);
  const root = container.firstElementChild;
  if (!root) throw new Error('ContentRenderer root was not rendered');
  expect(getComputedStyle(root).width).toBe('32rem');
  rerender(<ContentRenderer content="Sized" promptWidth="40rem" />);
  expect(getComputedStyle(root).width).toBe('40rem');
});

it('renders fenced code, inline code, malformed YAML, and empty content safely', () => {
  const { container, rerender } = render(
    <ContentRenderer content={'Run `kubectl get pods`.\n\n```bash\necho ready\necho done\n```'} />
  );
  expect(screen.getByText('kubectl get pods')).toBeTruthy();
  expect(screen.getByText(/echo ready/)).toBeTruthy();
  rerender(<ContentRenderer content={'apiVersion: v1\nkind: Pod\nmetadata:\n  bad: ['} />);
  expect(screen.getByText(/apiVersion: v1/)).toBeTruthy();
  rerender(<ContentRenderer content="" />);
  expect(container.textContent).toBe('');
});

it('uses dark-theme colors for inline and block code', () => {
  const darkTheme = createTheme({ palette: { mode: 'dark' } });
  const { container } = render(
    <ThemeProvider theme={darkTheme}>
      <ContentRenderer content={'Run `status`.\n\n```bash\necho ready\necho done\n```'} />
    </ThemeProvider>
  );
  const codeElements = container.querySelectorAll('code');
  const colorProbe = document.createElement('span');
  colorProbe.style.backgroundColor = darkTheme.palette.grey[800];
  document.body.append(colorProbe);
  const expectedBackground = getComputedStyle(colorProbe).backgroundColor;
  colorProbe.remove();
  expect(codeElements).toHaveLength(2);
  expect(getComputedStyle(codeElements[0]).backgroundColor).toBe(expectedBackground);
  expect(getComputedStyle(codeElements[1].parentElement ?? codeElements[1]).backgroundColor).toBe(
    expectedBackground
  );
});

it('honors a custom link slot and memoizes unchanged content', () => {
  const LinkSlot = ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a data-custom href={href}>
      {children}
    </a>
  );
  const { rerender } = render(
    <ContentRenderer content="[Docs](https://example.com)" LinkRendererSlot={LinkSlot} />
  );
  const link = screen.getByRole('link', { name: 'Docs' });
  expect(link.hasAttribute('data-custom')).toBe(true);
  rerender(<ContentRenderer content="[Docs](https://example.com)" LinkRendererSlot={LinkSlot} />);
  expect(screen.getByRole('link', { name: 'Docs' })).toBe(link);
  const OtherLinkSlot = ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a data-other href={href}>
      {children}
    </a>
  );
  rerender(
    <ContentRenderer content="[Docs](https://example.com)" LinkRendererSlot={OtherLinkSlot} />
  );
  expect(screen.getByRole('link', { name: 'Docs' }).hasAttribute('data-other')).toBe(true);
});

it('escapes raw HTML in markdown instead of executing it (XSS regression)', () => {
  const { container } = render(
    <main>
      <ContentRenderer content={'<img src=x onerror="alert(1)"> <script>alert(2)</script> hello'} />
    </main>
  );
  // Raw HTML must not be materialized into live DOM nodes.
  expect(container.querySelector('img')).toBeNull();
  expect(container.querySelector('script')).toBeNull();
  // The dangerous markup should survive as inert, escaped text instead.
  expect(container.textContent).toContain('onerror');
  expect(container.textContent).toContain('alert(2)');
  expect(screen.getByText(/hello/)).toBeTruthy();
});

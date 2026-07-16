import type { ProcessedArguments } from '@headlamp-k8s/ai-common/mcp/tools/types';
import type { ToolCall } from '@headlamp-k8s/ai-common/tools/types';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import InlineToolConfirmation, { type InlineToolConfirmationProps } from './InlineToolConfirmation';
import {
  loadingStateArgs,
  mcpOnlyToolsArgs,
  multipleMixedToolsArgs,
  singleKubernetesToolArgs,
  withUserContextArgs,
} from './InlineToolConfirmation.stories';

const processorMocks = vi.hoisted(() => ({
  cleanupArguments: vi.fn(),
  processArguments: vi.fn(),
}));

vi.mock('@headlamp-k8s/ai-common/mcp/tools/ArgumentProcessor', () => ({
  MCPArgumentProcessor: processorMocks,
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
  Icon: ({ icon }: { icon: string }) => <span aria-hidden="true" data-icon={icon} />,
}));

const emptyProcessed: ProcessedArguments = {
  original: {},
  processed: {},
  schema: null,
  suggestions: {},
  errors: [],
  intelligentFills: {},
};

function renderConfirmation(
  args: InlineToolConfirmationProps,
  overrides: Partial<InlineToolConfirmationProps> = {}
) {
  return render(
    <main>
      <InlineToolConfirmation {...args} {...overrides} />
    </main>
  );
}

async function waitForEnabledButton(name: string): Promise<HTMLButtonElement> {
  const button = screen.getByRole<HTMLButtonElement>('button', { name });
  await waitFor(() => expect(button.disabled).toBe(false));
  return button;
}

function deferred(): {
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: Error) => void;
} {
  let resolvePromise: () => void = () => undefined;
  let rejectPromise: (error: Error) => void = () => undefined;
  const promise = new Promise<void>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return { promise, resolve: resolvePromise, reject: rejectPromise };
}

beforeEach(() => {
  vi.clearAllMocks();
  processorMocks.processArguments.mockResolvedValue(emptyProcessed);
  processorMocks.cleanupArguments.mockImplementation(arguments_ => arguments_);
});

afterEach(cleanup);

describe('InlineToolConfirmation rendering and actions', () => {
  it('renders and expands the single regular-tool story by keyboard without axe violations', async () => {
    renderConfirmation(singleKubernetesToolArgs);

    expect(screen.getByText('1 tool')).toBeTruthy();
    const toggle = screen.getByRole('button', {
      name: 'Toggle details for kubernetes_api_request',
    });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.keyDown(toggle, { key: 'Enter' });
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('/api/v1/namespaces/default/pods')).toBeTruthy();
    await expect(runAxe()).resolves.toEqual([]);
  });

  it('renders mixed tools and approves all IDs', async () => {
    const onApprove = vi.fn();
    renderConfirmation(multipleMixedToolsArgs, { onApprove });

    expect(screen.getByText('2 tools')).toBeTruthy();
    expect(screen.getByText('MCP')).toBeTruthy();
    fireEvent.click(await waitForEnabledButton('Execute 2 Tools'));

    await waitFor(() => expect(onApprove).toHaveBeenCalledWith(['call_1', 'call_2']));
  });

  it('denies execution', async () => {
    const onDeny = vi.fn();
    renderConfirmation(singleKubernetesToolArgs, { onDeny });

    fireEvent.click(screen.getByRole('button', { name: 'Deny' }));

    await waitFor(() => expect(onDeny).toHaveBeenCalledOnce());
  });

  it('renders the loading story with a named progressbar and passes axe', async () => {
    renderConfirmation(loadingStateArgs);

    expect(screen.getByText('Executing approved tools...')).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'Executing tools' })).toBeTruthy();
    await expect(runAxe()).resolves.toEqual([]);
  });

  it('shows and clears approving progress around an asynchronous callback', async () => {
    const pending = deferred();
    renderConfirmation(singleKubernetesToolArgs, { onApprove: () => pending.promise });
    fireEvent.click(screen.getByRole('button', { name: 'Execute 1 Tool' }));

    expect(await screen.findByText('Approving and executing tools...')).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'Executing tools' })).toBeTruthy();
    pending.resolve();
    await waitFor(() => expect(screen.getByText('Tool Execution Required')).toBeTruthy());
  });

  it('shows and clears denying progress around an asynchronous callback', async () => {
    const pending = deferred();
    renderConfirmation(singleKubernetesToolArgs, { onDeny: () => pending.promise });
    fireEvent.click(screen.getByRole('button', { name: 'Deny' }));

    expect(await screen.findByText('Denying tool execution...')).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'Denying tools' })).toBeTruthy();
    pending.resolve();
    await waitFor(() => expect(screen.getByText('Tool Execution Required')).toBeTruthy());
  });

  it.each(['approve', 'deny'] as const)('recovers when %s rejects', async action => {
    const error = new Error(`${action} failed`);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const props =
      action === 'approve'
        ? { onApprove: vi.fn(async () => Promise.reject(error)) }
        : { onDeny: vi.fn(async () => Promise.reject(error)) };
    renderConfirmation(singleKubernetesToolArgs, props);

    fireEvent.click(
      screen.getByRole('button', { name: action === 'approve' ? 'Execute 1 Tool' : 'Deny' })
    );

    await waitFor(() => expect(screen.getByText('Tool Execution Required')).toBeTruthy());
    expect(console.error).toHaveBeenCalled();
  });
});

describe('InlineToolConfirmation MCP argument editing', () => {
  const processed: ProcessedArguments = {
    original: {},
    processed: {
      enabled: true,
      mode: 'safe',
      replicas: 2,
      ratio: 0.5,
      metadata: { namespace: 'default' },
      targets: ['api'],
      note: 'verify this value',
    },
    schema: {
      name: 'test_tool',
      inputSchema: {
        type: 'object',
        required: ['enabled', 'replicas'],
        properties: {
          enabled: { type: 'boolean', description: 'Enable execution' },
          mode: { type: 'string', enum: ['safe', 'fast'], description: 'Execution mode' },
          replicas: { type: 'integer', minimum: 0, description: 'Replica count' },
          ratio: { type: 'number', minimum: 0 },
          metadata: { type: 'object', description: 'Object metadata' },
          targets: { type: 'array' },
          note: { type: 'string', description: 'A long note' },
        },
      },
    },
    suggestions: {},
    errors: ['replicas must be positive'],
    intelligentFills: {
      note: { value: 'verify this value', reason: 'From user context', confidence: 0.7 },
    },
  };

  function mcpArgs(): InlineToolConfirmationProps {
    return {
      ...mcpOnlyToolsArgs,
      toolCalls: [
        {
          id: 'mcp-1',
          name: 'test_tool',
          description: 'Tests every schema field',
          arguments: {},
          type: 'mcp',
        },
      ],
    };
  }

  it('processes user context and renders schema fields, fills, errors, and axe-clean details', async () => {
    processorMocks.processArguments.mockResolvedValue(processed);
    renderConfirmation(mcpArgs(), { userContext: withUserContextArgs.userContext });

    await waitForEnabledButton('Execute 1 Tool');
    expect(processorMocks.processArguments).toHaveBeenCalledWith(
      'test_tool',
      {},
      withUserContextArgs.userContext
    );
    fireEvent.click(screen.getByRole('button', { name: 'Toggle details for test_tool' }));

    expect(screen.getByText('AI-filled')).toBeTruthy();
    expect(screen.getByText('Validation Issues:')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'About note' })).toBeTruthy();
    expect(screen.getAllByText('Required')).toHaveLength(2);
    await expect(runAxe()).resolves.toEqual([]);
  });

  it('edits every schema field and cleans arguments before approval', async () => {
    processorMocks.processArguments.mockResolvedValue(processed);
    processorMocks.cleanupArguments.mockImplementation(arguments_ => arguments_);
    const args = mcpArgs();
    const onApprove = vi.fn();
    renderConfirmation(args, { onApprove });
    await waitForEnabledButton('Execute 1 Tool');
    fireEvent.click(screen.getByRole('button', { name: 'Toggle details for test_tool' }));

    fireEvent.click(screen.getByRole('checkbox', { name: 'enabled' }));
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'mode' }));
    fireEvent.click(await screen.findByRole('option', { name: 'fast' }));
    const numbers = screen.getAllByRole('spinbutton');
    fireEvent.change(numbers[0], { target: { value: '4' } });
    fireEvent.change(numbers[1], { target: { value: '' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'metadata' }), {
      target: { value: '{"namespace":"prod"}' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'targets' }), {
      target: { value: '["web"]' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'note' }), {
      target: { value: 'updated' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Execute 1 Tool' }));

    await waitFor(() => expect(onApprove).toHaveBeenCalledWith(['mcp-1']));
    expect(processorMocks.cleanupArguments).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
        mode: 'fast',
        replicas: 4,
        ratio: '',
        metadata: { namespace: 'prod' },
        targets: ['web'],
        note: 'updated',
      }),
      processed.schema
    );
  });

  it('blocks wrong-shape or invalid structured input until corrected', async () => {
    processorMocks.processArguments.mockResolvedValue(processed);
    renderConfirmation(mcpArgs());
    await waitForEnabledButton('Execute 1 Tool');
    fireEvent.click(screen.getByRole('button', { name: 'Toggle details for test_tool' }));

    fireEvent.change(screen.getByRole('textbox', { name: 'metadata' }), {
      target: { value: '["wrong-shape"]' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'targets' }), {
      target: { value: '{invalid' },
    });

    expect(screen.getByText('Enter a valid JSON object.')).toBeTruthy();
    expect(screen.getByText('Enter valid JSON.')).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Execute 1 Tool' }).disabled).toBe(
      true
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'metadata' }), {
      target: { value: '{"namespace":"prod"}' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'targets' }), {
      target: { value: '["web"]' },
    });

    expect(await waitForEnabledButton('Execute 1 Tool')).toBeTruthy();
  });

  it('falls back to original MCP arguments when processing rejects', async () => {
    processorMocks.processArguments.mockRejectedValue(new Error('schema unavailable'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const args = mcpArgs();
    args.toolCalls[0].arguments = { namespace: 'default' };
    const onApprove = vi.fn();
    renderConfirmation(args, { onApprove });

    await waitForEnabledButton('Execute 1 Tool');
    fireEvent.click(screen.getByRole('button', { name: 'Execute 1 Tool' }));

    await waitFor(() => expect(onApprove).toHaveBeenCalledWith(['mcp-1']));
    expect(args.toolCalls[0].arguments).toEqual({ namespace: 'default' });
  });

  it('reinitializes when tool calls change and ignores stale processing', async () => {
    const first = deferred();
    processorMocks.processArguments
      .mockReturnValueOnce(first.promise.then(() => processed))
      .mockResolvedValueOnce({ ...processed, processed: { note: 'second' } });
    const firstArgs = mcpArgs();
    const { rerender } = renderConfirmation(firstArgs);
    const secondTool: ToolCall = {
      id: 'mcp-2',
      name: 'second_tool',
      arguments: {},
      type: 'mcp',
    };

    rerender(
      <main>
        <InlineToolConfirmation {...firstArgs} toolCalls={[secondTool]} />
      </main>
    );
    first.resolve();

    await waitForEnabledButton('Execute 1 Tool');
    expect(processorMocks.processArguments).toHaveBeenCalledWith('second_tool', {}, undefined);
  });
});

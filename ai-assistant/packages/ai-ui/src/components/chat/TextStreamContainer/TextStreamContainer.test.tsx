import type { ConversationMessage } from '@headlamp-k8s/ai-common/conversation/types';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import TextStreamContainer, {
  type ContentRendererSlotProps,
  type EditorDialogSlotProps,
  type TextStreamContainerProps,
} from './TextStreamContainer';
import { basicHistory, liveThinkingSteps } from './TextStreamContainer.stories';

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
vi.mock('../../agent/AgentThinkingSteps/AgentThinkingSteps', () => ({
  default: ({ steps }: { steps: unknown[] }) => <div>Live steps: {steps.length}</div>,
}));
vi.mock('../../assistant/AgentThinkingBlock/AgentThinkingBlock', () => ({
  default: ({ steps, isActive }: { steps: unknown[]; isActive: boolean }) => (
    <div>{`Thinking block: ${steps.length}, active: ${isActive}`}</div>
  ),
}));
vi.mock('../../common/InlineToolConfirmation/InlineToolConfirmation', () => ({
  default: ({ toolCalls }: { toolCalls: unknown[] }) => (
    <div>Confirm tools: {toolCalls.length}</div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function Renderer({ content, onYamlDetected, promptWidth }: ContentRendererSlotProps) {
  return (
    <div data-width={promptWidth}>
      {content}
      <button onClick={() => onYamlDetected?.('kind: Pod', 'Pod')}>Open YAML</button>
    </div>
  );
}

function Editor({
  open,
  onClose,
  yamlContent,
  title,
  onSuccess,
  onFailure,
}: EditorDialogSlotProps) {
  return open ? (
    <div role="dialog" aria-label="YAML editor">
      <span>{title}</span>
      <pre>{yamlContent}</pre>
      <button onClick={() => onSuccess?.({ applied: true })}>Succeed</button>
      <button onClick={() => onFailure?.(new Error('failed'), 'apply', { kind: 'Pod' })}>
        Fail
      </button>
      <button onClick={onClose}>Close editor</button>
    </div>
  ) : null;
}

function renderStream(overrides: Partial<TextStreamContainerProps> = {}): TextStreamContainerProps {
  const props: TextStreamContainerProps = {
    history: basicHistory,
    isLoading: false,
    apiError: null,
    ContentRendererSlot: Renderer,
    EditorDialogSlot: Editor,
    ...overrides,
  };
  render(<TextStreamContainer {...props} />);
  return props;
}

it('renders Storybook conversation semantics and passes axe', async () => {
  render(
    <main>
      <TextStreamContainer
        history={basicHistory}
        isLoading={false}
        apiError={null}
        ContentRendererSlot={Renderer}
        EditorDialogSlot={Editor}
      />
    </main>
  );
  expect(screen.getByRole('log', { name: 'Conversation messages' })).toBeTruthy();
  expect(screen.getByText('You')).toBeTruthy();
  expect(screen.getByText('AI Assistant')).toBeTruthy();
  expect(screen.getByText('How do I list pods?')).toBeTruthy();
  await expect(runAxe()).resolves.toEqual([]);
});

it('filters hidden messages and extracts validated tool follow-up text', () => {
  const history: ConversationMessage[] = [
    { role: 'system', content: 'hidden system' },
    { role: 'tool', content: 'hidden tool', toolCallId: 'call-1' },
    {
      role: 'tool',
      content: '{"shouldProcessFollowUp":true,"message":"follow-up ready"}',
    },
    { role: 'tool', content: '{"shouldProcessFollowUp":true,"message":{"bad":true}}' },
    { role: 'tool', content: 'LOGS_BUTTON:{"data":{"logs":"visible"}}', toolCallId: 'logs' },
    { role: 'user', content: '' },
    { role: 'assistant', content: '' },
  ];
  renderStream({ history });
  expect(screen.queryByText('hidden system')).toBeNull();
  expect(screen.queryByText('hidden tool')).toBeNull();
  expect(screen.getByText('follow-up ready')).toBeTruthy();
  expect(screen.getByText(/shouldProcessFollowUp/)).toBeTruthy();
  expect(screen.getByText(/LOGS_BUTTON/)).toBeTruthy();
});

it('shows and clears content-filter guidance as history changes', () => {
  const filtered: ConversationMessage[] = [
    { role: 'assistant', content: 'blocked', contentFilterError: true },
  ];
  const { rerender } = render(
    <TextStreamContainer
      history={filtered}
      isLoading={false}
      apiError={null}
      ContentRendererSlot={Renderer}
      EditorDialogSlot={Editor}
    />
  );
  expect(screen.getByText(/Some requests have been blocked/)).toBeTruthy();
  expect(screen.getByText(/Tip: Focus your question/)).toBeTruthy();
  rerender(
    <TextStreamContainer
      history={basicHistory}
      isLoading={false}
      apiError={null}
      ContentRendererSlot={Renderer}
      EditorDialogSlot={Editor}
    />
  );
  expect(screen.queryByText(/Some requests have been blocked/)).toBeNull();
});

it('opens the editor or delegates YAML actions and forwards operation callbacks', () => {
  const onSuccess = vi.fn();
  const onFailure = vi.fn();
  const { rerender } = render(
    <TextStreamContainer
      history={basicHistory}
      isLoading={false}
      apiError={null}
      ContentRendererSlot={Renderer}
      EditorDialogSlot={Editor}
      onOperationSuccess={onSuccess}
      onOperationFailure={onFailure}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Open YAML' }));
  expect(screen.getByRole('dialog', { name: 'YAML editor' })).toBeTruthy();
  expect(screen.getByText('Apply Pod')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Succeed' }));
  fireEvent.click(screen.getByRole('button', { name: 'Fail' }));
  expect(onSuccess).toHaveBeenCalledWith({ applied: true });
  expect(onFailure).toHaveBeenCalledWith(expect.any(Error), 'apply', { kind: 'Pod' });
  fireEvent.click(screen.getByRole('button', { name: 'Close editor' }));

  const onYamlAction = vi.fn();
  rerender(
    <TextStreamContainer
      history={basicHistory}
      isLoading={false}
      apiError={null}
      ContentRendererSlot={Renderer}
      EditorDialogSlot={Editor}
      onYamlAction={onYamlAction}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Open YAML' }));
  expect(onYamlAction).toHaveBeenCalledWith('kind: Pod', 'Apply Pod', 'Pod', false);
  expect(screen.queryByRole('dialog', { name: 'YAML editor' })).toBeNull();
});

it('renders loading, API errors, live steps, and suppresses duplicate progress', () => {
  const { rerender } = render(<TextStreamContainer history={[]} isLoading apiError={null} />);
  expect(screen.getByRole('status').textContent).toContain('Processing your request...');
  rerender(<TextStreamContainer history={[]} isLoading={false} apiError="provider unavailable" />);
  expect(screen.getByRole('alert').textContent).toContain('provider unavailable');
  rerender(
    <TextStreamContainer
      history={basicHistory}
      isLoading
      apiError="hidden while history exists"
      agentThinkingSteps={liveThinkingSteps}
    />
  );
  expect(screen.queryByText('Processing your request...')).toBeNull();
  expect(screen.getByText('Live steps: 1')).toBeTruthy();
  expect(screen.queryByText('hidden while history exists')).toBeNull();
});

it('renders message thinking blocks and waits for the final answer', () => {
  const history: ConversationMessage[] = [
    {
      role: 'assistant',
      content: 'intermediate answer',
      agentThinkingSteps: [{ id: 'a', content: 'Calling tool', type: 'tool-start', timestamp: 1 }],
      agentThinkingDone: false,
    },
  ];
  const { rerender } = render(
    <TextStreamContainer
      history={history}
      isLoading
      apiError={null}
      ContentRendererSlot={Renderer}
    />
  );
  expect(screen.getByText('Thinking block: 1, active: true')).toBeTruthy();
  expect(screen.queryByText('intermediate answer')).toBeNull();
  rerender(
    <TextStreamContainer
      history={[{ ...history[0], agentThinkingDone: true }]}
      isLoading={false}
      apiError={null}
      ContentRendererSlot={Renderer}
    />
  );
  expect(screen.getByText('intermediate answer')).toBeTruthy();
});

it('renders content normally when history steps contain only intermediate text', () => {
  renderStream({
    history: [
      {
        role: 'assistant',
        content: 'visible answer',
        agentThinkingSteps: [
          { id: 'text', content: 'draft', type: 'intermediate-text', timestamp: 1 },
        ],
      },
    ],
  });
  expect(screen.getByText('visible answer')).toBeTruthy();
  expect(screen.queryByText(/Thinking block/)).toBeNull();
});

it('renders tool confirmations and successful assistant content', () => {
  const history: ConversationMessage[] = [
    {
      role: 'assistant',
      content: '',
      toolConfirmation: {
        tools: [],
        onApprove: vi.fn(),
        onDeny: vi.fn(),
      },
    },
    { role: 'assistant', content: 'completed', success: true },
  ];
  renderStream({ history });
  expect(screen.getByText('Confirm tools: 0')).toBeTruthy();
  expect(screen.getByText('completed')).toBeTruthy();
  expect(screen.getByText('Success')).toBeTruthy();
});

it('positions a single response around the latest user message', () => {
  vi.useFakeTimers();
  const scrollTo = vi.fn();
  const { container, rerender } = render(
    <TextStreamContainer
      history={[{ role: 'user', content: 'question', requestId: 'q' }]}
      isLoading={false}
      apiError={null}
      ContentRendererSlot={Renderer}
    />
  );
  const log = screen.getByRole('log', { name: 'Conversation messages' });
  Object.defineProperties(log, {
    scrollHeight: { configurable: true, value: 1000 },
    clientHeight: { configurable: true, value: 200 },
    scrollTop: { configurable: true, writable: true, value: 700 },
    scrollTo: { configurable: true, value: scrollTo },
  });
  const userMessage = container.querySelector('[data-message-index="0"]');
  if (!(userMessage instanceof HTMLElement)) throw new Error('User message was not rendered');
  userMessage.getBoundingClientRect = () => ({
    x: 0,
    y: 20,
    width: 100,
    height: 100,
    top: 20,
    right: 100,
    bottom: 120,
    left: 0,
    toJSON: () => ({}),
  });
  log.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    top: 0,
    right: 300,
    bottom: 200,
    left: 0,
    toJSON: () => ({}),
  });
  rerender(
    <TextStreamContainer
      history={[
        { role: 'user', content: 'question', requestId: 'q' },
        { role: 'assistant', content: 'answer', requestId: 'a' },
      ]}
      isLoading={false}
      apiError={null}
      ContentRendererSlot={Renderer}
    />
  );
  vi.runOnlyPendingTimers();
  expect(scrollTo).toHaveBeenCalledWith({ top: 720, behavior: 'smooth' });

  userMessage.getBoundingClientRect = () => ({
    x: 0,
    y: 20,
    width: 100,
    height: 400,
    top: 20,
    right: 100,
    bottom: 420,
    left: 0,
    toJSON: () => ({}),
  });
  rerender(
    <TextStreamContainer
      history={[
        { role: 'user', content: 'question', requestId: 'q' },
        { role: 'assistant', content: 'updated answer', requestId: 'a2' },
      ]}
      isLoading
      apiError={null}
      ContentRendererSlot={Renderer}
    />
  );
  vi.runOnlyPendingTimers();
  expect(scrollTo).toHaveBeenCalledWith({ top: 920, behavior: 'smooth' });
});

it('positions multiple responses at the latest message and falls back without users', () => {
  vi.useFakeTimers();
  const scrollTo = vi.fn();
  const history: ConversationMessage[] = [
    { role: 'user', content: 'question', requestId: 'q' },
    { role: 'assistant', content: 'first', requestId: 'a1' },
    { role: 'assistant', content: 'second', requestId: 'a2' },
  ];
  const { container, rerender } = render(
    <TextStreamContainer
      history={history}
      isLoading={false}
      apiError={null}
      ContentRendererSlot={Renderer}
    />
  );
  const log = screen.getByRole('log', { name: 'Conversation messages' });
  Object.defineProperties(log, {
    scrollHeight: { configurable: true, value: 900 },
    clientHeight: { configurable: true, value: 200 },
    scrollTop: { configurable: true, writable: true, value: 650 },
    scrollTo: { configurable: true, value: scrollTo },
  });
  log.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    top: 0,
    right: 300,
    bottom: 200,
    left: 0,
    toJSON: () => ({}),
  });
  const last = container.querySelector('[data-message-index="2"]');
  if (!(last instanceof HTMLElement)) throw new Error('Last message was not rendered');
  last.getBoundingClientRect = () => ({
    x: 0,
    y: 50,
    width: 100,
    height: 100,
    top: 50,
    right: 100,
    bottom: 150,
    left: 0,
    toJSON: () => ({}),
  });
  rerender(
    <TextStreamContainer
      history={[...history]}
      isLoading
      apiError={null}
      ContentRendererSlot={Renderer}
    />
  );
  vi.runOnlyPendingTimers();
  expect(scrollTo).toHaveBeenCalledWith({ top: 700, behavior: 'smooth' });

  rerender(
    <TextStreamContainer
      history={[{ role: 'assistant', content: 'only assistant' }]}
      isLoading
      apiError={null}
      ContentRendererSlot={Renderer}
    />
  );
  vi.runOnlyPendingTimers();
  expect(log.scrollTop).toBe(900);
});

it('forwards prompt width to content renderers', () => {
  renderStream({ promptWidth: '36rem' });
  const rendered = screen.getByText(/You can list pods/).closest('[data-width]');
  expect(rendered?.getAttribute('data-width')).toBe('36rem');
});

it('shows and operates the scroll-to-bottom control when the user scrolls away', async () => {
  vi.useFakeTimers();
  renderStream();
  const log = screen.getByRole('log', { name: 'Conversation messages' });
  Object.defineProperties(log, {
    scrollHeight: { configurable: true, value: 1000 },
    clientHeight: { configurable: true, value: 200 },
    scrollTop: { configurable: true, writable: true, value: 0 },
  });
  fireEvent.scroll(log);
  const button = screen.getByRole('button', { name: 'scroll to bottom' });
  fireEvent.click(button);
  expect(screen.queryByRole('button', { name: 'scroll to bottom' })).toBeNull();
  vi.runOnlyPendingTimers();
});

it('does not reposition users who scrolled away when history updates', () => {
  vi.useFakeTimers();
  const scrollTo = vi.fn();
  const props = {
    isLoading: false,
    apiError: null,
    ContentRendererSlot: Renderer,
  };
  const { rerender } = render(<TextStreamContainer {...props} history={basicHistory} />);
  const log = screen.getByRole('log', { name: 'Conversation messages' });
  Object.defineProperties(log, {
    scrollHeight: { configurable: true, value: 1200 },
    clientHeight: { configurable: true, value: 200 },
    scrollTop: { configurable: true, writable: true, value: 100 },
    scrollTo: { configurable: true, value: scrollTo },
  });
  fireEvent.scroll(log);
  rerender(
    <TextStreamContainer
      {...props}
      history={[
        ...basicHistory,
        { role: 'assistant', content: 'new streamed content', requestId: 'streamed' },
      ]}
    />
  );
  vi.runOnlyPendingTimers();
  expect(scrollTo).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'scroll to bottom' })).toBeTruthy();
});

it('keeps following a tall append when the user was previously at the bottom', () => {
  vi.useFakeTimers();
  const scrollTo = vi.fn();
  const props = {
    isLoading: false,
    apiError: null,
    ContentRendererSlot: Renderer,
  };
  const { container, rerender } = render(<TextStreamContainer {...props} history={basicHistory} />);
  const log = screen.getByRole('log', { name: 'Conversation messages' });
  Object.defineProperties(log, {
    scrollHeight: { configurable: true, value: 400 },
    clientHeight: { configurable: true, value: 200 },
    scrollTop: { configurable: true, writable: true, value: 200 },
    scrollTo: { configurable: true, value: scrollTo },
  });
  fireEvent.scroll(log);
  Object.defineProperty(log, 'scrollHeight', { configurable: true, value: 1000 });
  rerender(
    <TextStreamContainer
      {...props}
      history={[
        ...basicHistory,
        { role: 'assistant', content: 'large streamed response', requestId: 'large' },
      ]}
    />
  );
  log.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    top: 0,
    right: 300,
    bottom: 200,
    left: 0,
    toJSON: () => ({}),
  });
  const last = container.querySelector('[data-message-index="2"]');
  if (!(last instanceof HTMLElement)) throw new Error('Appended message was not rendered');
  last.getBoundingClientRect = () => ({
    x: 0,
    y: 700,
    width: 300,
    height: 300,
    top: 700,
    right: 300,
    bottom: 1000,
    left: 0,
    toJSON: () => ({}),
  });
  vi.runOnlyPendingTimers();
  expect(scrollTo).toHaveBeenCalledWith({ top: 900, behavior: 'smooth' });
});

it('recognizes a new user message when conversations have equal user counts', () => {
  vi.useFakeTimers();
  const scrollIntoView = vi.fn();
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: scrollIntoView,
  });
  const props = {
    isLoading: false,
    apiError: null,
    ContentRendererSlot: Renderer,
  };
  const { rerender } = render(
    <TextStreamContainer
      {...props}
      history={[{ role: 'user', content: 'first conversation', requestId: 'first' }]}
    />
  );
  vi.runOnlyPendingTimers();
  scrollIntoView.mockClear();
  rerender(
    <TextStreamContainer
      {...props}
      history={[{ role: 'user', content: 'second conversation', requestId: 'second' }]}
    />
  );
  vi.runOnlyPendingTimers();
  expect(scrollIntoView).toHaveBeenCalled();
});

it('ignores programmatic scroll events while following streamed appends', () => {
  vi.useFakeTimers();
  const scrollTo = vi.fn();
  const props = {
    isLoading: false,
    apiError: null,
    ContentRendererSlot: Renderer,
  };
  const { container, rerender } = render(<TextStreamContainer {...props} history={basicHistory} />);
  const log = screen.getByRole('log', { name: 'Conversation messages' });
  Object.defineProperties(log, {
    scrollHeight: { configurable: true, value: 600 },
    clientHeight: { configurable: true, value: 200 },
    scrollTop: { configurable: true, writable: true, value: 400 },
    scrollTo: { configurable: true, value: scrollTo },
  });
  const firstAppend = [...basicHistory, { role: 'assistant', content: 'first append' }];
  rerender(<TextStreamContainer {...props} history={firstAppend} />);
  vi.runOnlyPendingTimers();
  fireEvent.scroll(log);
  scrollTo.mockClear();
  Object.defineProperty(log, 'scrollHeight', { configurable: true, value: 1000 });
  rerender(
    <TextStreamContainer
      {...props}
      history={[...firstAppend, { role: 'assistant', content: 'second append' }]}
    />
  );
  const last = container.querySelector('[data-message-index="3"]');
  if (!(last instanceof HTMLElement)) throw new Error('Second append was not rendered');
  last.getBoundingClientRect = () => ({
    x: 0,
    y: 700,
    width: 300,
    height: 200,
    top: 700,
    right: 300,
    bottom: 900,
    left: 0,
    toJSON: () => ({}),
  });
  log.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    top: 0,
    right: 300,
    bottom: 200,
    left: 0,
    toJSON: () => ({}),
  });
  vi.runOnlyPendingTimers();
  expect(scrollTo).toHaveBeenCalledWith({ top: 1100, behavior: 'smooth' });
});

it('schedules one reposition when history appends while loading remains active', () => {
  vi.useFakeTimers();
  const scrollTo = vi.fn();
  const props = {
    isLoading: true,
    apiError: null,
    ContentRendererSlot: Renderer,
  };
  const { container, rerender } = render(<TextStreamContainer {...props} history={basicHistory} />);
  const log = screen.getByRole('log', { name: 'Conversation messages' });
  Object.defineProperties(log, {
    scrollHeight: { configurable: true, value: 800 },
    clientHeight: { configurable: true, value: 200 },
    scrollTop: { configurable: true, writable: true, value: 600 },
    scrollTo: { configurable: true, value: scrollTo },
  });
  log.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    top: 0,
    right: 300,
    bottom: 200,
    left: 0,
    toJSON: () => ({}),
  });
  vi.runOnlyPendingTimers();
  scrollTo.mockClear();
  rerender(
    <TextStreamContainer
      {...props}
      history={[...basicHistory, { role: 'assistant', content: 'streamed append' }]}
    />
  );
  const last = container.querySelector('[data-message-index="2"]');
  if (!(last instanceof HTMLElement)) throw new Error('Streamed append was not rendered');
  last.getBoundingClientRect = () => ({
    x: 0,
    y: 400,
    width: 300,
    height: 100,
    top: 400,
    right: 300,
    bottom: 500,
    left: 0,
    toJSON: () => ({}),
  });
  vi.runOnlyPendingTimers();
  expect(scrollTo).toHaveBeenCalledTimes(1);
});

it('default editor reports edited content as a successful save', async () => {
  const onSuccess = vi.fn();
  render(
    <TextStreamContainer
      history={basicHistory}
      isLoading={false}
      apiError={null}
      ContentRendererSlot={Renderer}
      onOperationSuccess={onSuccess}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Open YAML' }));
  const editor = screen.getByRole('textbox', { name: 'Content to edit' });
  fireEvent.change(editor, { target: { value: 'kind: Service' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(onSuccess).toHaveBeenCalledWith({ content: 'kind: Service' });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

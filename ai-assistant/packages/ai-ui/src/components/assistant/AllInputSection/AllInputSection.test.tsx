import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import {
  type ActionButtonSlotProps,
  AIInputSection,
  type ToolsDialogSlotProps,
} from './AllInputSection';
import { baseInputArgs, openAIConfig } from './AllInputSection.stories';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@iconify/react', () => ({
  Icon: ({ icon, ...props }: { icon: string; 'aria-hidden'?: boolean | 'true' | 'false' }) => (
    <span data-icon={icon} {...props} />
  ),
}));
vi.mock('../TestModeInput/TestModeInput', () => ({
  default: ({ isTestMode }: { isTestMode: boolean }) =>
    isTestMode ? <div>Test controls</div> : null,
}));

afterEach(cleanup);

function ActionButton({ description, onClick, iconButtonProps }: ActionButtonSlotProps) {
  return (
    <button onClick={onClick} disabled={iconButtonProps?.disabled}>
      {description}
    </button>
  );
}

function ToolsDialog({ open, onClose, enabledTools, onToolsChange }: ToolsDialogSlotProps) {
  return open ? (
    <div role="dialog" aria-label="Tools">
      <span>{enabledTools.join(',')}</span>
      <button onClick={() => onToolsChange(['new-tool'])}>Change tools</button>
      <button onClick={onClose}>Close tools</button>
    </div>
  ) : null;
}

function renderInput(overrides: Partial<React.ComponentProps<typeof AIInputSection>> = {}) {
  const props = {
    ...baseInputArgs,
    setPromptVal: vi.fn(),
    onSend: vi.fn(),
    onStop: vi.fn(),
    onClearHistory: vi.fn(),
    onConfigChange: vi.fn(),
    onToggleAgentMode: vi.fn(),
    onToolsChange: vi.fn(),
    ToolsDialogSlot: ToolsDialog,
    ActionButtonSlot: ActionButton,
    ...overrides,
  };
  render(<AIInputSection {...props} />);
  return props;
}

it('renders named input controls and passes axe', async () => {
  render(
    <main>
      <AIInputSection
        {...baseInputArgs}
        ActionButtonSlot={ActionButton}
        ToolsDialogSlot={ToolsDialog}
      />
    </main>
  );
  expect(screen.getByRole('textbox', { name: 'Ask AI' })).toBeTruthy();
  expect(screen.getByRole('combobox', { name: 'Assistant mode' })).toBeTruthy();
  expect(screen.getByRole('combobox', { name: 'Provider and model' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Send' })).toBeTruthy();
  await expect(runAxe()).resolves.toEqual([]);
});

it('sends trimmed prompts by Enter and button, then clears input', () => {
  const props = renderInput({ promptVal: '  hello  ' });
  const input = screen.getByRole('textbox');
  fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
  expect(props.onSend).toHaveBeenCalledWith('hello');
  expect(props.setPromptVal).toHaveBeenCalledWith('');

  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  expect(props.onSend).toHaveBeenCalledTimes(2);
});

it('does not send blank, shift-enter, composing, loading, or diagnosis-blocked prompts', () => {
  const blank = renderInput({ promptVal: '   ' });
  expect(screen.getByRole('button', { name: 'Send' })).toHaveProperty('disabled', true);
  cleanup();

  const props = renderInput({ promptVal: 'hello' });
  const input = screen.getByRole('textbox');
  fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
  fireEvent.keyDown(input, { key: 'Enter', isComposing: true, keyCode: 229 });
  expect(props.onSend).not.toHaveBeenCalled();
  cleanup();

  const loading = renderInput({ promptVal: 'hello', loading: true });
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  expect(loading.onSend).not.toHaveBeenCalled();
  cleanup();

  const diagnosis = renderInput({ promptVal: 'hello', isDiagnosisRunning: true });
  expect(screen.getByRole('textbox')).toHaveProperty('disabled', true);
  expect(screen.getByRole('progressbar', { name: 'Proactive diagnosis progress' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Clear History' })).toHaveProperty('disabled', true);
  expect(diagnosis.onSend).not.toHaveBeenCalled();
  expect(blank.onSend).not.toHaveBeenCalled();
});

it('stops loading requests and clears history while idle', () => {
  const loading = renderInput({ loading: true });
  fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
  expect(loading.onStop).toHaveBeenCalledOnce();
  cleanup();
  const idle = renderInput();
  fireEvent.click(screen.getByRole('button', { name: 'Clear History' }));
  expect(idle.onClearHistory).toHaveBeenCalledOnce();
});

it('changes assistant mode and handles checking state', () => {
  const props = renderInput();
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Assistant mode' }));
  fireEvent.click(screen.getByRole('option', { name: 'Holmes Agent' }));
  expect(props.onToggleAgentMode).toHaveBeenCalledWith(true);
  cleanup();
  renderInput({ agentModeStatus: 'checking' });
  expect(
    screen.getByRole('combobox', { name: 'Assistant mode' }).getAttribute('aria-disabled')
  ).toBe('true');
});

it('round-trips hyphenated provider and model identifiers', () => {
  const props = renderInput({
    activeConfig: baseInputArgs.availableConfigs[1],
    selectedModel: 'llama-3.1',
  });
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Provider and model' }));
  fireEvent.click(screen.getByRole('option', { name: /gpt-4o-mini/ }));
  expect(props.onConfigChange).toHaveBeenCalledWith(openAIConfig, 'gpt-4o-mini');
});

it('selects the correct saved configuration when provider and model identifiers repeat', () => {
  const secondOpenAIConfig = {
    ...openAIConfig,
    displayName: 'Second OpenAI Account',
    config: { ...openAIConfig.config },
  };
  const props = renderInput({
    activeConfig: openAIConfig,
    availableConfigs: [openAIConfig, secondOpenAIConfig],
    selectedModel: 'gpt-4o-mini',
  });
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Provider and model' }));
  fireEvent.click(screen.getAllByRole('option', { name: /gpt-4o-mini/ })[1]);
  expect(props.onConfigChange).toHaveBeenCalledWith(secondOpenAIConfig, 'gpt-4o-mini');
});

it('supports the deprecated chat mode callback when the modern mode API is omitted', () => {
  const onChatModeChange = vi.fn();
  renderInput({
    isAgentMode: undefined,
    onToggleAgentMode: undefined,
    chatMode: 'chat',
    onChatModeChange,
  });
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Assistant mode' }));
  fireEvent.click(screen.getByRole('option', { name: 'Holmes Agent' }));
  expect(onChatModeChange).toHaveBeenCalledWith('agent');
});

it('opens, updates, and closes the injected tools dialog', () => {
  const props = renderInput();
  fireEvent.click(screen.getByRole('button', { name: 'Manage Tools' }));
  expect(screen.getByRole('dialog', { name: 'Tools' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Change tools' }));
  expect(props.onToolsChange).toHaveBeenCalledWith(['new-tool']);
  fireEvent.click(screen.getByRole('button', { name: 'Close tools' }));
  expect(screen.queryByRole('dialog', { name: 'Tools' })).toBeNull();
});

it('forwards asynchronous tool-change callbacks through the dialog slot', async () => {
  const onToolsChange = vi.fn(async () => undefined);
  renderInput({ onToolsChange });
  fireEvent.click(screen.getByRole('button', { name: 'Manage Tools' }));
  fireEvent.click(screen.getByRole('button', { name: 'Change tools' }));
  expect(onToolsChange).toHaveBeenCalledWith(['new-tool']);
  await expect(onToolsChange.mock.results[0].value).resolves.toBeUndefined();
});

it('renders test and agent modes without irrelevant controls', () => {
  renderInput({ isTestMode: true });
  expect(screen.getByText('Test controls')).toBeTruthy();
  expect(screen.getByRole('textbox', { name: 'Type user message (Test Mode)' })).toBeTruthy();
  expect(screen.queryByRole('combobox')).toBeNull();
  cleanup();
  renderInput({ isAgentMode: true });
  expect(screen.getByRole('textbox', { name: 'Ask Holmes (Agent Mode)' })).toBeTruthy();
  expect(screen.queryByRole('combobox', { name: 'Provider and model' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Manage Tools' })).toBeNull();
});

it('renders without configs, optional mode callback, or tools slot', () => {
  renderInput({
    activeConfig: null,
    availableConfigs: [],
    onToggleAgentMode: undefined,
    ToolsDialogSlot: undefined,
  });
  expect(screen.queryByRole('combobox')).toBeNull();
  expect(screen.getByRole('button', { name: 'Manage Tools' })).toBeTruthy();
});

import type { SavedConfigurations } from '@headlamp-k8s/ai-common/providers/savedConfigs';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import type { DeveloperSettingsProps } from '../DeveloperSettings/DeveloperSettings';
import type { ModelSelectorProps } from '../ModelSelector/ModelSelector';
import { SettingsPage, type SettingsPageProps } from './SettingsPage';
import {
  createMockStore,
  emptySettingsArgs,
  fullSettingsArgs,
  withProviderArgs,
} from './SettingsPage.stories';

const autoDetectMocks = vi.hoisted(() => ({
  useAutoDetect: vi.fn(),
}));
const skillSettingsMock = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../AutoDetectProvider/AutoDetectProvider', () => ({
  useAutoDetect: autoDetectMocks.useAutoDetect,
  AutoDetectProvider: () => <section aria-label="Auto Detect Results" />,
}));

vi.mock('../ModelSelector/ModelSelector', () => ({
  default: (props: ModelSelectorProps) => (
    <section aria-label="Model Selector">
      <span data-testid="active-provider">{props.selectedProvider}</span>
      <span data-testid="active-config-id">{props.selectedConfigId}</span>
      <span data-testid="active-name">{props.configName}</span>
      <span data-testid="saved-count">{props.savedConfigs.providers?.length ?? 0}</span>
      <span data-testid="auto-detect-enabled">{String(Boolean(props.onAutoDetect))}</span>
      <span data-testid="command-runner-enabled">{String(Boolean(props.commandRunner))}</span>
      <button
        type="button"
        onClick={() =>
          props.onChange?.({
            providerId: 'anthropic',
            config: { apiKey: 'new-key', model: 'claude' },
            displayName: 'Anthropic',
          })
        }
      >
        Change Active
      </button>
      <button
        type="button"
        onClick={() =>
          props.onChange?.({
            configId: 'copilot-1',
            providerId: 'copilot',
            config: { apiKey: 'token' },
            displayName: 'Copilot',
            savedConfigs: {
              providers: [
                { id: 'openai-1', providerId: 'openai', config: { apiKey: 'openai' } },
                { id: 'copilot-1', providerId: 'copilot', config: { apiKey: 'token' } },
              ],
              defaultProviderIndex: 0,
            },
          })
        }
      >
        Save Provider
      </button>
      <button
        type="button"
        onClick={() =>
          props.onChange?.({
            configId: 'legacy-copilot-1',
            providerId: 'copilot',
            config: { apiKey: 'copilot-key' },
            displayName: 'Copilot',
          })
        }
      >
        Select Legacy Copilot
      </button>
      <button
        type="button"
        onClick={() => props.onTermsAccept?.({ providers: [], termsAccepted: true })}
      >
        Accept Terms
      </button>
    </section>
  ),
}));

vi.mock('../AIToolsSettings/AIToolsSettings', () => ({
  AIToolsSettings: ({ onToolToggle }: { onToolToggle: (id: string) => void }) => (
    <section aria-label="AI Tools">
      <button type="button" onClick={() => onToolToggle('web-search')}>
        Toggle Tool
      </button>
    </section>
  ),
}));

vi.mock('../MCPSettings/MCPSettings', () => ({
  MCPSettings: () => <section aria-label="MCP Settings" />,
}));

vi.mock('../SkillSettings/SkillSettings', () => ({
  SkillSettings: (props: { filesystemSkillsEnabled?: boolean }) => {
    skillSettingsMock(props);
    return <section aria-label="Skill Settings" />;
  },
}));

vi.mock('../HolmesAgentSettings/HolmesAgentSettings', () => ({
  HolmesAgentSettings: ({
    onConfigChange,
  }: {
    onConfigChange: (patch: Record<string, unknown>) => void;
  }) => (
    <section aria-label="Holmes Settings">
      <button type="button" onClick={() => onConfigChange({ holmesPort: 8080 })}>
        Change Holmes
      </button>
    </section>
  ),
}));

vi.mock('../DeveloperSettings/DeveloperSettings', () => ({
  DeveloperSettings: (props: DeveloperSettingsProps) => (
    <section aria-label="Developer Settings">
      <span data-testid="developer-provider-id">{props.savedConfigs?.providers?.[0]?.id}</span>
      <button
        type="button"
        onClick={() => props.onDevOptionsChange({ ...props.devOptions, enableMockAgent: true })}
      >
        Change Developer Options
      </button>
      <button
        type="button"
        onClick={() => props.onConfigsChange?.({ providers: [], termsAccepted: false })}
      >
        Change Developer Configs
      </button>
    </section>
  ),
}));

function renderSettings(args: SettingsPageProps, overrides: Partial<SettingsPageProps> = {}) {
  return render(
    <main>
      <SettingsPage {...args} {...overrides} />
    </main>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  autoDetectMocks.useAutoDetect.mockReturnValue({
    autoDetecting: false,
    handleAutoDetect: vi.fn(async () => undefined),
    detectedProviders: [],
    showDetectedDialog: false,
    setShowDetectedDialog: vi.fn(),
    handleAddDetectedProviders: vi.fn(),
    handleDismissDetectedProviders: vi.fn(),
  });
});

afterEach(cleanup);

describe('SettingsPage provider orchestration', () => {
  it('renders OpenAI defaults for the empty story without debug text and passes axe', async () => {
    renderSettings(emptySettingsArgs);

    expect(screen.getByTestId('active-provider').textContent).toBe('openai');
    expect(screen.queryByText('meow')).toBeNull();
    expect(screen.getByRole('region', { name: 'MCP Settings' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Skill Settings' })).toBeTruthy();
    await expect(runAxe()).resolves.toEqual([]);
  });

  it('initializes from the active saved provider', () => {
    renderSettings(withProviderArgs);

    expect(screen.getByTestId('active-provider').textContent).toBe('openai');
    expect(screen.getByTestId('active-name').textContent).toBe('OpenAI');
    expect(screen.getByTestId('saved-count').textContent).toBe('1');
  });

  it('synchronizes active state when the host replaces saved configs', async () => {
    const { rerender } = renderSettings(withProviderArgs);
    const copilotConfigs: SavedConfigurations = {
      providers: [
        {
          providerId: 'copilot',
          displayName: 'GitHub Copilot',
          config: { apiKey: 'token', model: 'gpt-4o' },
        },
      ],
      defaultProviderIndex: 0,
    };

    rerender(
      <main>
        <SettingsPage {...withProviderArgs} savedConfigs={copilotConfigs} />
      </main>
    );

    await waitFor(() => expect(screen.getByTestId('active-provider').textContent).toBe('copilot'));
    expect(screen.getByTestId('active-name').textContent).toBe('GitHub Copilot');
  });

  it('preserves the legacy default provider across an equivalent cloned collection', async () => {
    const legacyConfigs: SavedConfigurations = {
      providers: [
        { providerId: 'openai', config: { apiKey: 'openai-key' } },
        { providerId: 'copilot', config: { apiKey: 'copilot-key' } },
      ],
      defaultProviderIndex: 1,
    };
    const props = { ...emptySettingsArgs, savedConfigs: legacyConfigs };
    const { rerender } = render(<SettingsPage {...props} />);
    expect(screen.getByTestId('active-provider').textContent).toBe('copilot');
    rerender(<SettingsPage {...props} savedConfigs={structuredClone(legacyConfigs)} />);
    await waitFor(() =>
      expect(screen.getByTestId('active-config-id').textContent).toBe('legacy-copilot-1')
    );
  });

  it('preserves a selected non-default legacy ID across an equivalent cloned collection', async () => {
    const legacyConfigs: SavedConfigurations = {
      providers: [
        { providerId: 'openai', config: { apiKey: 'openai-key' } },
        { providerId: 'copilot', config: { apiKey: 'copilot-key' } },
      ],
      defaultProviderIndex: 0,
    };
    const props = { ...emptySettingsArgs, savedConfigs: legacyConfigs };
    const { rerender } = render(<SettingsPage {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Select Legacy Copilot' }));
    rerender(<SettingsPage {...props} savedConfigs={structuredClone(legacyConfigs)} />);
    await waitFor(() => {
      expect(screen.getByTestId('active-config-id').textContent).toBe('legacy-copilot-1');
      expect(screen.getByTestId('active-provider').textContent).toBe('copilot');
    });
  });

  it('updates local active state without persisting when no collection is supplied', () => {
    const onConfigsChange = vi.fn();
    renderSettings(emptySettingsArgs, { onConfigsChange });

    fireEvent.click(screen.getByRole('button', { name: 'Change Active' }));

    expect(screen.getByTestId('active-provider').textContent).toBe('anthropic');
    expect(onConfigsChange).not.toHaveBeenCalled();
  });

  it('persists a saved collection supplied by the model selector', () => {
    const onConfigsChange = vi.fn();
    renderSettings(emptySettingsArgs, { onConfigsChange });

    fireEvent.click(screen.getByRole('button', { name: 'Save Provider' }));

    expect(onConfigsChange).toHaveBeenCalledWith({
      providers: [
        { id: 'openai-1', providerId: 'openai', config: { apiKey: 'openai' } },
        { id: 'copilot-1', providerId: 'copilot', config: { apiKey: 'token' } },
      ],
      defaultProviderIndex: 0,
    });
    expect(screen.getByTestId('active-provider').textContent).toBe('copilot');
  });

  it('preserves a non-default active ID when the parent returns the saved collection', () => {
    const onConfigsChange = vi.fn();
    const props = { ...emptySettingsArgs, onConfigsChange };
    const { rerender } = render(<SettingsPage {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save Provider' }));
    const returnedConfigs = onConfigsChange.mock.calls[0][0];
    rerender(<SettingsPage {...props} savedConfigs={structuredClone(returnedConfigs)} />);
    expect(screen.getByTestId('active-config-id').textContent).toBe('copilot-1');
  });

  it('does not let a pending local echo suppress an intervening external default', async () => {
    const onConfigsChange = vi.fn();
    const props = { ...emptySettingsArgs, onConfigsChange };
    const { rerender } = render(<SettingsPage {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save Provider' }));
    const emittedConfigs = onConfigsChange.mock.calls[0][0] as SavedConfigurations;
    rerender(
      <SettingsPage {...props} savedConfigs={{ ...emittedConfigs, defaultProviderIndex: 1 }} />
    );
    await waitFor(() =>
      expect(screen.getByTestId('active-config-id').textContent).toBe('copilot-1')
    );
    rerender(
      <SettingsPage {...props} savedConfigs={{ ...emittedConfigs, defaultProviderIndex: 0 }} />
    );
    await waitFor(() =>
      expect(screen.getByTestId('active-config-id').textContent).toBe('openai-1')
    );
  });

  it('follows an external default-provider change', async () => {
    const providers = [
      { id: 'openai-1', providerId: 'openai', config: { apiKey: 'openai' } },
      { id: 'copilot-1', providerId: 'copilot', config: { apiKey: 'copilot' } },
    ];
    const props = {
      ...emptySettingsArgs,
      savedConfigs: { providers, defaultProviderIndex: 0 },
    };
    const { rerender } = render(<SettingsPage {...props} />);
    rerender(<SettingsPage {...props} savedConfigs={{ providers, defaultProviderIndex: 1 }} />);
    await waitFor(() =>
      expect(screen.getByTestId('active-config-id').textContent).toBe('copilot-1')
    );
  });

  it('forwards terms acceptance to the host callback or persistence fallback', () => {
    const onTermsAccept = vi.fn();
    const onConfigsChange = vi.fn();
    const { rerender } = renderSettings(emptySettingsArgs, { onTermsAccept, onConfigsChange });
    fireEvent.click(screen.getByRole('button', { name: 'Accept Terms' }));
    expect(onTermsAccept).toHaveBeenCalledWith({ providers: [], termsAccepted: true });
    expect(onConfigsChange).not.toHaveBeenCalled();

    rerender(
      <main>
        <SettingsPage
          {...emptySettingsArgs}
          onConfigsChange={onConfigsChange}
          onTermsAccept={undefined}
        />
      </main>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Accept Terms' }));
    expect(onConfigsChange).toHaveBeenCalledWith({ providers: [], termsAccepted: true });
  });
});

describe('SettingsPage optional sections', () => {
  it('renders and wires the preview toggle', () => {
    const onPreviewChange = vi.fn();
    renderSettings(emptySettingsArgs, { onPreviewChange, previewEnabled: false });

    fireEvent.click(screen.getByRole('checkbox', { name: /Preview Features/ }));

    expect(onPreviewChange).toHaveBeenCalledWith(true);
  });

  it('defaults the preview toggle to enabled', () => {
    renderSettings(emptySettingsArgs, { onPreviewChange: vi.fn(), previewEnabled: undefined });
    expect(
      screen.getByRole<HTMLInputElement>('checkbox', { name: /Preview Features/ }).checked
    ).toBe(true);
  });

  it('defaults proactive diagnosis to disabled and reports changes', () => {
    const onProactiveDiagnosisChange = vi.fn();
    renderSettings(emptySettingsArgs, { onProactiveDiagnosisChange });
    const toggle = screen.getByRole<HTMLInputElement>('checkbox', {
      name: /Proactive Diagnosis \(preview\)/,
    });

    expect(toggle.checked).toBe(false);
    fireEvent.click(toggle);
    expect(onProactiveDiagnosisChange).toHaveBeenCalledWith(true);
  });

  it('renders proactive diagnosis as enabled when persisted', () => {
    renderSettings(emptySettingsArgs, {
      proactiveDiagnosisEnabled: true,
      onProactiveDiagnosisChange: vi.fn(),
    });
    expect(
      screen.getByRole<HTMLInputElement>('checkbox', {
        name: /Proactive Diagnosis \(preview\)/,
      }).checked
    ).toBe(true);
  });

  it('renders test mode, toggles it, and resets a shown popover', () => {
    const onTestModeChange = vi.fn();
    const onResetPopover = vi.fn();
    renderSettings(emptySettingsArgs, {
      isTestMode: true,
      onTestModeChange,
      hasShownConfigPopover: true,
      onResetPopover,
    });

    fireEvent.click(screen.getByRole('checkbox', { name: /Test Mode/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(onTestModeChange).toHaveBeenCalledWith(false);
    expect(onResetPopover).toHaveBeenCalledOnce();
    expect(screen.getByText(/has been shown and dismissed/)).toBeTruthy();
  });

  it('treats an omitted test-mode value as controlled and disabled', () => {
    renderSettings(emptySettingsArgs, { onTestModeChange: vi.fn(), isTestMode: undefined });
    expect(screen.getByRole<HTMLInputElement>('checkbox', { name: /Test Mode/ }).checked).toBe(
      false
    );
  });

  it('disables reset before the popover has been shown', () => {
    renderSettings(emptySettingsArgs, {
      isTestMode: true,
      onTestModeChange: vi.fn(),
      hasShownConfigPopover: false,
      onResetPopover: vi.fn(),
    });

    expect(screen.getByText(/will show when no AI providers/)).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Reset' }).disabled).toBe(true);
  });

  it('renders tools only when all tool callbacks are present', () => {
    const onToolToggle = vi.fn();
    const { rerender } = renderSettings(emptySettingsArgs, { onToolToggle });
    fireEvent.click(screen.getByRole('button', { name: 'Toggle Tool' }));
    expect(onToolToggle).toHaveBeenCalledWith('web-search');

    rerender(
      <main>
        <SettingsPage {...emptySettingsArgs} onToolToggle={undefined} />
      </main>
    );
    expect(screen.queryByRole('region', { name: 'AI Tools' })).toBeNull();
  });

  it('renders the Holmes section and forwards Holmes changes', () => {
    const onHolmesConfigChange = vi.fn();
    renderSettings(withProviderArgs, { onHolmesConfigChange });

    fireEvent.click(screen.getByRole('button', { name: 'Change Holmes' }));

    expect(onHolmesConfigChange).toHaveBeenCalledWith({ holmesPort: 8080 });
  });

  it('renders developer settings and forwards both callbacks', () => {
    const onDevOptionsChange = vi.fn();
    const onConfigsChange = vi.fn();
    renderSettings(emptySettingsArgs, {
      devOptions: {},
      onDevOptionsChange,
      onConfigsChange,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Change Developer Options' }));
    fireEvent.click(screen.getByRole('button', { name: 'Change Developer Configs' }));

    expect(onDevOptionsChange).toHaveBeenCalledWith({ enableMockAgent: true });
    expect(onConfigsChange).toHaveBeenCalledWith({ providers: [], termsAccepted: false });
  });

  it('passes normalized legacy provider IDs to developer settings', () => {
    renderSettings(emptySettingsArgs, {
      devOptions: {},
      onDevOptionsChange: vi.fn(),
      savedConfigs: { providers: [{ providerId: 'openai', config: {} }] },
    });
    expect(screen.getByTestId('developer-provider-id').textContent).toBe('legacy-openai-0');
  });

  it('renders the full story without axe violations', async () => {
    renderSettings(fullSettingsArgs, {
      devOptions: { enableMockModel: true },
      onDevOptionsChange: vi.fn(),
    });

    await expect(runAxe()).resolves.toEqual([]);
  });
});

describe('SettingsPage auto-detect wiring', () => {
  it('passes host auto-detect dependencies to the hook', () => {
    const onDismissProviders = vi.fn();
    const configStore = createMockStore();
    renderSettings(emptySettingsArgs, {
      configStore,
      dismissedProviders: ['copilot'],
      onDismissProviders,
      commandRunner: null,
    });

    expect(autoDetectMocks.useAutoDetect).toHaveBeenCalledWith(
      expect.objectContaining({
        savedConfigs: emptySettingsArgs.savedConfigs,
        dismissedProviders: ['copilot'],
        onDismissProviders,
        commandRunner: null,
      })
    );
  });

  it('accepts an active configuration update from auto-detect', () => {
    renderSettings(emptySettingsArgs);
    const hookArgs = autoDetectMocks.useAutoDetect.mock.calls[0][0] as {
      onActiveConfigChange: (active: {
        providerId: string;
        config: Record<string, unknown>;
        displayName: string;
      }) => void;
    };

    act(() =>
      hookArgs.onActiveConfigChange({
        providerId: 'local',
        config: { model: 'llama3' },
        displayName: 'Ollama',
      })
    );

    expect(screen.getByTestId('active-provider').textContent).toBe('local');
  });

  it('enables CLI auto-detect only when the desktop command runner is ready', () => {
    const commandRunner = vi.fn(async () => ({ stdout: '', exitCode: 0 }));
    const { rerender } = renderSettings(emptySettingsArgs, {
      isRunningAsApp: false,
      commandRunner,
    });
    expect(screen.queryByRole('region', { name: 'Auto Detect Results' })).toBeNull();
    expect(screen.getByTestId('auto-detect-enabled').textContent).toBe('false');
    expect(screen.getByTestId('command-runner-enabled').textContent).toBe('false');

    rerender(
      <main>
        <SettingsPage {...emptySettingsArgs} isRunningAsApp commandRunner={null} />
      </main>
    );
    expect(screen.queryByRole('region', { name: 'Auto Detect Results' })).toBeNull();
    expect(screen.getByTestId('auto-detect-enabled').textContent).toBe('false');

    rerender(
      <main>
        <SettingsPage {...emptySettingsArgs} isRunningAsApp commandRunner={commandRunner} />
      </main>
    );
    expect(screen.getByRole('region', { name: 'Auto Detect Results' })).toBeTruthy();
    expect(screen.getByTestId('auto-detect-enabled').textContent).toBe('true');
    expect(screen.getByTestId('command-runner-enabled').textContent).toBe('true');
  });
});

describe('SettingsPage skill filesystem wiring', () => {
  it('keeps filesystem skills disabled until the host provides a real filesystem adapter', () => {
    const checkPathExists = vi.fn().mockResolvedValue(true);
    renderSettings(emptySettingsArgs, { isRunningAsApp: true, checkPathExists });
    expect(skillSettingsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ filesystemSkillsEnabled: false })
    );
    cleanup();
    renderSettings(emptySettingsArgs, { isRunningAsApp: true, checkPathExists: undefined });
    expect(skillSettingsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ filesystemSkillsEnabled: false })
    );
  });
});

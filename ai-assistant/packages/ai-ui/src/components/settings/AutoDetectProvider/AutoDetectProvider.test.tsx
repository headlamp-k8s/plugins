import type {
  AzureAccessCheckResult,
  CommandRunner,
  DetectedProvider,
} from '@headlamp-k8s/ai-common/providers/detectProvider';
import type { SavedConfigurations } from '@headlamp-k8s/ai-common/providers/savedConfigs';
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import { AutoDetectProvider, useAutoDetect } from './AutoDetectProvider';
import {
  hiddenArgs,
  sampleDetectedProviders,
  singleProviderArgs,
  withDetectedProvidersArgs,
} from './AutoDetectProvider.stories';

const detectionMocks = vi.hoisted(() => ({
  detectProviders: vi.fn(),
  verifyAzureOpenAIAccess: vi.fn(),
}));

vi.mock('@headlamp-k8s/ai-common/providers/detectProvider', async importOriginal => ({
  ...(await importOriginal<typeof import('@headlamp-k8s/ai-common/providers/detectProvider')>()),
  detectProviders: detectionMocks.detectProviders,
  verifyAzureOpenAIAccess: detectionMocks.verifyAzureOpenAIAccess,
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

const commandRunner: CommandRunner = vi.fn(async () => ({ stdout: '', exitCode: 0 }));

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolvePromise: (value: T) => void = () => undefined;
  const promise = new Promise<T>(resolve => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
}

function hookProps(overrides: Partial<Parameters<typeof useAutoDetect>[0]> = {}) {
  return {
    savedConfigs: { providers: [] } as SavedConfigurations,
    onConfigsChange: vi.fn(),
    commandRunner,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  detectionMocks.detectProviders.mockResolvedValue([]);
  detectionMocks.verifyAzureOpenAIAccess.mockResolvedValue({ ok: true });
});

afterEach(cleanup);

describe('useAutoDetect', () => {
  it('opens the dialog with detected providers and ignores dismissals on an explicit run', async () => {
    detectionMocks.detectProviders.mockResolvedValue(sampleDetectedProviders);
    const props = hookProps({ dismissedProviders: ['already-dismissed'] });
    const { result } = renderHook(() => useAutoDetect(props));

    await act(async () => result.current.handleAutoDetect());

    expect(detectionMocks.detectProviders).toHaveBeenCalledWith(
      [],
      [],
      commandRunner,
      expect.any(AbortSignal)
    );
    expect(result.current.autoDetecting).toBe(false);
    expect(result.current.detectedProviders).toEqual(sampleDetectedProviders);
    expect(result.current.showDetectedDialog).toBe(true);
  });

  it('opens an empty result dialog when a later run finds nothing', async () => {
    detectionMocks.detectProviders
      .mockResolvedValueOnce(sampleDetectedProviders)
      .mockResolvedValueOnce([]);
    const { result } = renderHook(() => useAutoDetect(hookProps()));
    await act(async () => result.current.handleAutoDetect());
    expect(result.current.showDetectedDialog).toBe(true);

    await act(async () => result.current.handleAutoDetect());

    expect(result.current.detectedProviders).toEqual([]);
    expect(result.current.showDetectedDialog).toBe(true);
  });

  it('ignores an older detection result that finishes last', async () => {
    const first = deferred<DetectedProvider[]>();
    const second = deferred<DetectedProvider[]>();
    detectionMocks.detectProviders
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useAutoDetect(hookProps()));

    let firstRun: Promise<void> = Promise.resolve();
    let secondRun: Promise<void> = Promise.resolve();
    act(() => {
      firstRun = result.current.handleAutoDetect();
      secondRun = result.current.handleAutoDetect();
    });
    const firstSignal = detectionMocks.detectProviders.mock.calls[0][3] as AbortSignal;
    const secondSignal = detectionMocks.detectProviders.mock.calls[1][3] as AbortSignal;
    expect(firstSignal.aborted).toBe(true);
    expect(secondSignal.aborted).toBe(false);
    await act(async () => {
      second.resolve([sampleDetectedProviders[1]]);
      await secondRun;
    });
    await act(async () => {
      first.resolve([sampleDetectedProviders[0]]);
      await firstRun;
    });

    expect(result.current.detectedProviders).toEqual([sampleDetectedProviders[1]]);
    expect(result.current.autoDetecting).toBe(false);
  });

  it('aborts detection on unmount and tolerates a late result', async () => {
    const detection = deferred<DetectedProvider[]>();
    detectionMocks.detectProviders.mockReturnValueOnce(detection.promise);
    const { result, unmount } = renderHook(() => useAutoDetect(hookProps()));

    let detectionRun: Promise<void> = Promise.resolve();
    act(() => {
      detectionRun = result.current.handleAutoDetect();
    });
    const signal = detectionMocks.detectProviders.mock.calls[0][3] as AbortSignal;

    unmount();
    expect(signal.aborted).toBe(true);
    detection.resolve(sampleDetectedProviders);
    await detectionRun;
  });

  it('recovers from detection failure without opening stale results', async () => {
    detectionMocks.detectProviders.mockRejectedValue(new Error('offline'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderHook(() => useAutoDetect(hookProps()));

    await act(async () => result.current.handleAutoDetect());

    expect(result.current.autoDetecting).toBe(false);
    expect(result.current.detectedProviders).toEqual([]);
    expect(result.current.showDetectedDialog).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it('uses null when no command runner is available', async () => {
    const { result } = renderHook(() => useAutoDetect(hookProps({ commandRunner: null })));

    await act(async () => result.current.handleAutoDetect());

    expect(detectionMocks.detectProviders).toHaveBeenCalledWith(
      [],
      [],
      null,
      expect.any(AbortSignal)
    );
  });

  it('adds multiple providers, makes only the first default, and activates it', () => {
    const onConfigsChange = vi.fn();
    const onActiveConfigChange = vi.fn();
    const { result } = renderHook(() =>
      useAutoDetect(hookProps({ onConfigsChange, onActiveConfigChange }))
    );

    act(() => result.current.handleAddDetectedProviders(sampleDetectedProviders.slice(0, 2)));

    const configs = onConfigsChange.mock.calls[0][0] as SavedConfigurations;
    expect(configs.providers).toHaveLength(2);
    expect(configs.defaultProviderIndex).toBe(0);
    expect(onActiveConfigChange).toHaveBeenCalledWith({
      providerId: 'copilot',
      config: sampleDetectedProviders[0].config,
      displayName: 'GitHub Copilot',
    });
    expect(result.current.detectedProviders).toEqual([]);
    expect(result.current.showDetectedDialog).toBe(false);
  });

  it('preserves an existing default and does not replace the active config', () => {
    const savedConfigs: SavedConfigurations = {
      providers: [{ providerId: 'openai', config: { apiKey: 'key' } }],
      defaultProviderIndex: 0,
    };
    const onConfigsChange = vi.fn();
    const onActiveConfigChange = vi.fn();
    const { result } = renderHook(() =>
      useAutoDetect(hookProps({ savedConfigs, onConfigsChange, onActiveConfigChange }))
    );

    act(() => result.current.handleAddDetectedProviders([sampleDetectedProviders[0]]));

    expect(onConfigsChange.mock.calls[0][0].defaultProviderIndex).toBe(0);
    expect(onActiveConfigChange).not.toHaveBeenCalled();
  });

  it('handles an empty add selection without changing the active config', () => {
    const onConfigsChange = vi.fn();
    const onActiveConfigChange = vi.fn();
    const { result } = renderHook(() =>
      useAutoDetect(hookProps({ onConfigsChange, onActiveConfigChange }))
    );

    act(() => result.current.handleAddDetectedProviders([]));

    expect(onConfigsChange).toHaveBeenCalledWith({ providers: [] });
    expect(onActiveConfigChange).not.toHaveBeenCalled();
  });

  it('does not save an Azure provider that fails verification and reports why', async () => {
    detectionMocks.verifyAzureOpenAIAccess.mockResolvedValue({
      ok: false,
      reason: 'You are not allowed to read its keys.',
    });
    const onConfigsChange = vi.fn();
    const { result } = renderHook(() => useAutoDetect(hookProps({ onConfigsChange })));

    await act(async () => {
      result.current.handleAddDetectedProviders([sampleDetectedProviders[2]]);
    });

    expect(onConfigsChange).toHaveBeenCalledWith({ providers: [] });
    expect(result.current.addError).toContain('not allowed to read its keys');
    expect(result.current.addingProviders).toBe(false);
  });

  it('saves the usable providers and keeps only the rejected ones listed', async () => {
    detectionMocks.verifyAzureOpenAIAccess.mockResolvedValue({
      ok: false,
      reason: 'You are not allowed to read its keys.',
    });
    const onConfigsChange = vi.fn();
    const { result } = renderHook(() => useAutoDetect(hookProps({ onConfigsChange })));

    await act(async () => {
      result.current.handleAddDetectedProviders([
        sampleDetectedProviders[0],
        sampleDetectedProviders[2],
      ]);
    });

    const saved = onConfigsChange.mock.calls[0][0] as { providers: { providerId: string }[] };
    expect(saved.providers.map(provider => provider.providerId)).toEqual([
      sampleDetectedProviders[0].providerId,
    ]);
    expect(result.current.detectedProviders).toEqual([sampleDetectedProviders[2]]);
    expect(result.current.showDetectedDialog).toBe(false);
    expect(result.current.addError).toContain('not allowed to read its keys');
  });

  it('aborts verification on close and ignores a late result', async () => {
    const verification = deferred<AzureAccessCheckResult>();
    detectionMocks.verifyAzureOpenAIAccess.mockReturnValue(verification.promise);
    const onConfigsChange = vi.fn();
    const props = hookProps({ onConfigsChange });
    const { result } = renderHook(() => useAutoDetect(props));

    act(() => result.current.handleAddDetectedProviders([sampleDetectedProviders[2]]));
    const signal = detectionMocks.verifyAzureOpenAIAccess.mock.calls[0][2] as AbortSignal;
    expect(signal.aborted).toBe(false);

    act(() => result.current.setShowDetectedDialog(false));
    expect(signal.aborted).toBe(true);
    await act(async () => verification.resolve({ ok: true }));

    expect(onConfigsChange).not.toHaveBeenCalled();
    expect(result.current.addingProviders).toBe(false);
  });

  it('aborts verification when a new detection starts', async () => {
    const verification = deferred<AzureAccessCheckResult>();
    detectionMocks.verifyAzureOpenAIAccess.mockReturnValue(verification.promise);
    const onConfigsChange = vi.fn();
    const props = hookProps({ onConfigsChange });
    const { result } = renderHook(() => useAutoDetect(props));

    act(() => result.current.handleAddDetectedProviders([sampleDetectedProviders[2]]));
    const signal = detectionMocks.verifyAzureOpenAIAccess.mock.calls[0][2] as AbortSignal;
    await act(async () => result.current.handleAutoDetect());

    expect(signal.aborted).toBe(true);
    await act(async () => verification.resolve({ ok: true }));
    expect(onConfigsChange).not.toHaveBeenCalled();
  });

  it('aborts verification when saved configs change', async () => {
    const verification = deferred<AzureAccessCheckResult>();
    detectionMocks.verifyAzureOpenAIAccess.mockReturnValue(verification.promise);
    const onConfigsChange = vi.fn();
    const initialProps = hookProps({ onConfigsChange });
    const { result, rerender } = renderHook(({ props }) => useAutoDetect(props), {
      initialProps: { props: initialProps },
    });

    act(() => result.current.handleAddDetectedProviders([sampleDetectedProviders[2]]));
    const signal = detectionMocks.verifyAzureOpenAIAccess.mock.calls[0][2] as AbortSignal;
    rerender({
      props: {
        ...initialProps,
        savedConfigs: {
          providers: [{ providerId: 'openai', config: { apiKey: 'new-key' } }],
        },
      },
    });

    expect(signal.aborted).toBe(true);
    await act(async () => verification.resolve({ ok: true }));
    expect(onConfigsChange).not.toHaveBeenCalled();
  });

  it('aborts verification on unmount', () => {
    const verification = deferred<AzureAccessCheckResult>();
    detectionMocks.verifyAzureOpenAIAccess.mockReturnValue(verification.promise);
    const props = hookProps();
    const { result, unmount } = renderHook(() => useAutoDetect(props));

    act(() => result.current.handleAddDetectedProviders([sampleDetectedProviders[2]]));
    const signal = detectionMocks.verifyAzureOpenAIAccess.mock.calls[0][2] as AbortSignal;
    unmount();

    expect(signal.aborted).toBe(true);
  });

  it('deduplicates dismissals and works without a persistence callback', () => {
    const onDismissProviders = vi.fn();
    const { result, rerender } = renderHook(
      ({ callback }) =>
        useAutoDetect(
          hookProps({ dismissedProviders: ['copilot:GitHub CLI'], onDismissProviders: callback })
        ),
      { initialProps: { callback: onDismissProviders as ((keys: string[]) => void) | undefined } }
    );

    act(() => result.current.handleDismissDetectedProviders([sampleDetectedProviders[0]]));
    expect(new Set(onDismissProviders.mock.calls[0][0]).size).toBe(
      onDismissProviders.mock.calls[0][0].length
    );

    rerender({ callback: undefined });
    act(() => result.current.handleDismissDetectedProviders([sampleDetectedProviders[1]]));
    expect(result.current.showDetectedDialog).toBe(false);
  });
});

describe('AutoDetectProvider dialog adapter', () => {
  it('renders the multi-provider story, adds selected providers, and passes axe', async () => {
    const handleAddDetectedProviders = vi.fn();
    render(
      <main>
        <AutoDetectProvider
          {...withDetectedProvidersArgs}
          handleAddDetectedProviders={handleAddDetectedProviders}
        />
      </main>
    );

    expect(screen.getByRole('heading', { name: 'Detected AI Providers' })).toBeTruthy();
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    await expect(runAxe()).resolves.toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: 'Add Selected (3)' }));
    expect(handleAddDetectedProviders).toHaveBeenCalledWith(sampleDetectedProviders);
  });

  it('lets the user change selection before adding', () => {
    const handleAddDetectedProviders = vi.fn();
    render(
      <AutoDetectProvider
        {...withDetectedProvidersArgs}
        handleAddDetectedProviders={handleAddDetectedProviders}
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: /Ollama/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Selected (2)' }));

    expect(handleAddDetectedProviders).toHaveBeenCalledWith([
      sampleDetectedProviders[0],
      sampleDetectedProviders[2],
    ]);
  });

  it('dismisses all providers and closes the dialog', () => {
    const handleDismissDetectedProviders = vi.fn();
    const setShowDetectedDialog = vi.fn();
    render(
      <AutoDetectProvider
        {...singleProviderArgs}
        handleDismissDetectedProviders={handleDismissDetectedProviders}
        setShowDetectedDialog={setShowDetectedDialog}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Not Now' }));

    expect(handleDismissDetectedProviders).toHaveBeenCalledWith([sampleDetectedProviders[0]]);
    expect(setShowDetectedDialog).toHaveBeenCalledWith(false);
  });

  it('forwards dialog close and renders the hidden story without content', async () => {
    const setShowDetectedDialog = vi.fn();
    const { rerender } = render(
      <AutoDetectProvider {...singleProviderArgs} setShowDetectedDialog={setShowDetectedDialog} />
    );
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await waitFor(() => expect(setShowDetectedDialog).toHaveBeenCalledWith(false));

    rerender(<AutoDetectProvider {...hiddenArgs} />);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

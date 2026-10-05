/**
 * Auto-detect provider orchestration component.
 *
 * Manages the auto-detect flow: runs provider detection, shows the
 * {@link DetectedProvidersDialog}, and handles add/dismiss callbacks.
 *
 * Framework-agnostic: uses only MUI and accepts platform-specific
 * dependencies (CommandRunner, config store) via props.
 */

import {
  type AzureAccessCheckResult,
  type CommandRunner,
  type DetectedProvider,
  detectProviders,
  dismissalKey,
  verifyAzureOpenAIAccess,
} from '@headlamp-k8s/ai-common/providers/detectProvider';
import {
  type ProviderSettings,
  type SavedConfigurations,
  saveProviderConfig,
} from '@headlamp-k8s/ai-common/providers/savedConfigs';
import React from 'react';
import DetectedProvidersDialog from '../DetectedProvidersDialog/DetectedProvidersDialog';

/** Props for the {@link AutoDetectProvider} component. */
export interface AutoDetectProviderProps {
  /** Current saved configurations (providers list). */
  savedConfigs: SavedConfigurations | null | undefined;
  /**
   * Callback invoked when configs change (e.g. after adding detected providers).
   * Receives the full updated configurations object.
   */
  onConfigsChange: (configs: SavedConfigurations) => void;
  /**
   * Callback invoked when active configuration should change
   * (e.g. when a provider is added and becomes the default).
   */
  onActiveConfigChange?: (active: {
    providerId: string;
    config: ProviderSettings;
    displayName: string;
  }) => void;
  /** Platform-specific command runner for CLI-based detection (gh, az). */
  commandRunner?: CommandRunner | null;
  /** Previously dismissed provider keys (persisted by the host). */
  dismissedProviders?: string[];
  /** Callback to persist newly dismissed provider keys. */
  onDismissProviders?: (dismissedKeys: string[]) => void;
  /** Component used to render the dialog shell. */
  DialogSlot?: React.ElementType;
}

/** State returned by {@link useAutoDetect} for rendering auto-detect UI. */
export interface AutoDetectState {
  /** Whether detection is currently in progress. */
  autoDetecting: boolean;
  /** Triggers the auto-detect flow. */
  handleAutoDetect: () => Promise<void>;
}

/** Props for the detected-provider dialog adapter. */
export interface AutoDetectDialogProps {
  /** Providers returned by the latest detection run. */
  detectedProviders: DetectedProvider[];
  /** Whether the detected-provider dialog is visible. */
  showDetectedDialog: boolean;
  /** Updates dialog visibility. */
  setShowDetectedDialog: (show: boolean) => void;
  /** Saves selected detected providers. */
  handleAddDetectedProviders: (providers: DetectedProvider[]) => void;
  /** Persists dismissal of selected detected providers. */
  handleDismissDetectedProviders: (providers: DetectedProvider[]) => void;
  /** Whether selected providers are being verified before being saved. */
  addingProviders?: boolean;
  /** Why the selected providers could not be added. */
  addError?: string | null;
  /** Optional component used to render the dialog shell. */
  DialogSlot?: React.ElementType;
}

/**
 * Hook that manages auto-detect state and exposes it for use with
 * ModelSelector's `onAutoDetect` / `autoDetecting` props.
 *
 * @example
 * ```tsx
 * const { autoDetecting, handleAutoDetect } = useAutoDetect({ ... });
 * <ModelSelector onAutoDetect={handleAutoDetect} autoDetecting={autoDetecting} />
 * ```
 *
 * @param props - Auto-detection dependencies and persistence callbacks.
 * @returns Detection state, dialog state, and add/dismiss handlers.
 */
export function useAutoDetect({
  savedConfigs,
  onConfigsChange,
  onActiveConfigChange,
  commandRunner,
  dismissedProviders = [],
  onDismissProviders,
}: Omit<AutoDetectProviderProps, 'DialogSlot'>): AutoDetectState & {
  detectedProviders: DetectedProvider[];
  showDetectedDialog: boolean;
  setShowDetectedDialog: (show: boolean) => void;
  handleAddDetectedProviders: (providers: DetectedProvider[]) => void;
  handleDismissDetectedProviders: (providers: DetectedProvider[]) => void;
  addingProviders: boolean;
  addError: string | null;
} {
  const [autoDetecting, setAutoDetecting] = React.useState(false);
  const [detectedProviders, setDetectedProviders] = React.useState<DetectedProvider[]>([]);
  const [showDetectedDialog, setDialogVisible] = React.useState(false);
  const [addingProviders, setAddingProviders] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);
  const detectionRun = React.useRef(0);
  const detectionController = React.useRef<AbortController | null>(null);
  const verificationRun = React.useRef(0);
  const verificationController = React.useRef<AbortController | null>(null);

  const cancelVerification = React.useCallback((): void => {
    verificationRun.current += 1;
    verificationController.current?.abort();
    verificationController.current = null;
    setAddingProviders(false);
  }, []);

  React.useEffect(
    () => () => {
      detectionRun.current += 1;
      detectionController.current?.abort();
      verificationRun.current += 1;
      verificationController.current?.abort();
    },
    []
  );

  React.useEffect(() => cancelVerification(), [savedConfigs, cancelVerification]);

  const setShowDetectedDialog = React.useCallback(
    (show: boolean): void => {
      if (!show) cancelVerification();
      setDialogVisible(show);
    },
    [cancelVerification]
  );

  const handleAutoDetect = React.useCallback(async (): Promise<void> => {
    cancelVerification();
    detectionController.current?.abort();
    const controller = new AbortController();
    detectionController.current = controller;
    const run = ++detectionRun.current;
    setAutoDetecting(true);
    setDetectedProviders([]);
    setShowDetectedDialog(false);
    setAddError(null);
    try {
      const existing = savedConfigs?.providers || [];
      // Dismissals suppress the automatic prompt only; an explicit run must show everything.
      const detected = await detectProviders(
        existing,
        [],
        commandRunner ?? null,
        controller.signal
      );
      if (run === detectionRun.current) {
        setDetectedProviders(detected);
        setShowDetectedDialog(true);
      }
    } catch (e) {
      console.error('[AutoDetectProvider] auto-detect failed:', e);
    } finally {
      if (run === detectionRun.current) setAutoDetecting(false);
    }
  }, [savedConfigs, commandRunner, cancelVerification, setShowDetectedDialog]);

  const handleAddDetectedProviders = React.useCallback(
    (providers: DetectedProvider[]): void => {
      cancelVerification();
      setAddError(null);

      /** Persists the providers that may be used. @param usable - Providers to save. */
      const commit = (usable: DetectedProvider[]): void => {
        const hadProviders = Boolean(savedConfigs?.providers?.length);
        let configs: SavedConfigurations = savedConfigs ?? {};
        for (const provider of usable) {
          configs = saveProviderConfig(
            configs,
            provider.providerId,
            provider.config,
            !configs?.providers?.length, // make default if no providers exist
            provider.displayName
          );
        }
        onConfigsChange(configs);

        // Update active configuration to first added provider if none exists
        if (!hadProviders && usable.length > 0 && onActiveConfigChange) {
          onActiveConfigChange({
            providerId: usable[0].providerId,
            config: { ...usable[0].config },
            displayName: usable[0].displayName,
          });
        }
      };

      // Only Azure needs a permission check, so everything else saves synchronously.
      if (!providers.some(provider => provider.providerId === 'azure')) {
        commit(providers);
        setShowDetectedDialog(false);
        setDetectedProviders([]);
        return;
      }

      const controller = new AbortController();
      verificationController.current = controller;
      const run = ++verificationRun.current;
      setAddingProviders(true);
      void (async () => {
        try {
          // Detection only proves the account is visible, so confirm it is usable before saving.
          const checks = await Promise.all(
            providers.map(
              (provider): Promise<AzureAccessCheckResult> =>
                provider.providerId === 'azure'
                  ? verifyAzureOpenAIAccess(
                      provider.config,
                      commandRunner ?? null,
                      controller.signal
                    )
                  : Promise.resolve({ ok: true })
            )
          );
          if (run !== verificationRun.current || controller.signal.aborted) return;
          const rejected = providers.filter((_, index) => !checks[index].ok);
          const failures = providers.flatMap((provider, index) =>
            checks[index].ok ? [] : [`${provider.displayName} — ${checks[index].reason}`]
          );

          commit(providers.filter((_, index) => checks[index].ok));

          if (failures.length > 0) {
            // Only the rejected providers stay listed so the error matches what is left.
            setAddError(failures.join('\n'));
            setDetectedProviders(rejected);
            return;
          }
          setShowDetectedDialog(false);
          setDetectedProviders([]);
        } catch (error) {
          if (run === verificationRun.current && !controller.signal.aborted) {
            console.error('[AutoDetectProvider] provider verification failed:', error);
          }
        } finally {
          if (run === verificationRun.current) {
            verificationController.current = null;
            setAddingProviders(false);
          }
        }
      })();
    },
    [
      savedConfigs,
      onConfigsChange,
      onActiveConfigChange,
      commandRunner,
      cancelVerification,
      setShowDetectedDialog,
    ]
  );

  const handleDismissDetectedProviders = React.useCallback(
    (providers: DetectedProvider[]): void => {
      const newDismissals = providers.map(p => dismissalKey(p));
      const merged = [...new Set([...dismissedProviders, ...newDismissals])];
      onDismissProviders?.(merged);
      setShowDetectedDialog(false);
      setDetectedProviders([]);
    },
    [dismissedProviders, onDismissProviders]
  );

  return {
    autoDetecting,
    handleAutoDetect,
    detectedProviders,
    showDetectedDialog,
    setShowDetectedDialog,
    handleAddDetectedProviders,
    handleDismissDetectedProviders,
    addingProviders,
    addError,
  };
}

/**
 * Renders the auto-detect detected providers dialog.
 *
 * This component is typically used alongside {@link useAutoDetect}
 * and the `ModelSelector` component.
 *
 * @example
 * ```tsx
 * const autoDetect = useAutoDetect({ savedConfigs, ... });
 * <ModelSelector onAutoDetect={autoDetect.handleAutoDetect} autoDetecting={autoDetect.autoDetecting} />
 * <AutoDetectProvider {...autoDetect} />
 * ```
 *
 * @param props - Detected-provider dialog state and handlers.
 * @returns Detected-provider dialog UI.
 */
export function AutoDetectProvider({
  detectedProviders,
  showDetectedDialog,
  setShowDetectedDialog,
  handleAddDetectedProviders,
  handleDismissDetectedProviders,
  addingProviders,
  addError,
  DialogSlot,
}: AutoDetectDialogProps): React.ReactElement {
  return (
    <DetectedProvidersDialog
      open={showDetectedDialog}
      onClose={() => setShowDetectedDialog(false)}
      detectedProviders={detectedProviders}
      onAddProviders={handleAddDetectedProviders}
      onDismiss={handleDismissDetectedProviders}
      adding={addingProviders}
      errorMessage={addError}
      DialogSlot={DialogSlot}
    />
  );
}

export default AutoDetectProvider;

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
  type CommandRunner,
  type DetectedProvider,
  detectProviders,
  dismissalKey,
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
} {
  const [autoDetecting, setAutoDetecting] = React.useState(false);
  const [detectedProviders, setDetectedProviders] = React.useState<DetectedProvider[]>([]);
  const [showDetectedDialog, setShowDetectedDialog] = React.useState(false);
  const detectionRun = React.useRef(0);

  const handleAutoDetect = React.useCallback(async (): Promise<void> => {
    const run = ++detectionRun.current;
    setAutoDetecting(true);
    setDetectedProviders([]);
    setShowDetectedDialog(false);
    try {
      const existing = savedConfigs?.providers || [];
      const detected = await detectProviders(existing, dismissedProviders, commandRunner ?? null);
      if (run === detectionRun.current && detected.length > 0) {
        setDetectedProviders(detected);
        setShowDetectedDialog(true);
      }
    } catch (e) {
      console.error('[AutoDetectProvider] auto-detect failed:', e);
    } finally {
      if (run === detectionRun.current) setAutoDetecting(false);
    }
  }, [savedConfigs, dismissedProviders, commandRunner]);

  const handleAddDetectedProviders = React.useCallback(
    (providers: DetectedProvider[]): void => {
      let configs: SavedConfigurations = savedConfigs ?? {};
      for (const provider of providers) {
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
      if (!savedConfigs?.providers?.length && providers.length > 0 && onActiveConfigChange) {
        onActiveConfigChange({
          providerId: providers[0].providerId,
          config: { ...providers[0].config },
          displayName: providers[0].displayName,
        });
      }
      setShowDetectedDialog(false);
      setDetectedProviders([]);
    },
    [savedConfigs, onConfigsChange, onActiveConfigChange]
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
  DialogSlot,
}: AutoDetectDialogProps): React.ReactElement {
  return (
    <DetectedProvidersDialog
      open={showDetectedDialog}
      onClose={() => setShowDetectedDialog(false)}
      detectedProviders={detectedProviders}
      onAddProviders={handleAddDetectedProviders}
      onDismiss={handleDismissDetectedProviders}
      DialogSlot={DialogSlot}
    />
  );
}

export default AutoDetectProvider;

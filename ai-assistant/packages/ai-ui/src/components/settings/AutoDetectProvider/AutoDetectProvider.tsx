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
  type SavedConfigurations,
  saveProviderConfig,
} from '@headlamp-k8s/ai-common/managers/ProviderConfigManager';
import {
  type CommandRunner,
  type DetectedProvider,
  detectProviders,
  dismissalKey,
} from '@headlamp-k8s/ai-common/providers/providerAutoDetect';
import React from 'react';
import { useTranslation } from 'react-i18next';
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
    config: Record<string, any>;
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

/**
 * Hook that manages auto-detect state and exposes it for use with
 * ModelSelector's `onAutoDetect` / `autoDetecting` props.
 *
 * @example
 * ```tsx
 * const { autoDetecting, handleAutoDetect } = useAutoDetect({ ... });
 * <ModelSelector onAutoDetect={handleAutoDetect} autoDetecting={autoDetecting} />
 * ```
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

  const handleAutoDetect = React.useCallback(async () => {
    setAutoDetecting(true);
    try {
      const existing = savedConfigs?.providers || [];
      const detected = await detectProviders(existing, dismissedProviders, commandRunner ?? null);
      if (detected.length > 0) {
        setDetectedProviders(detected);
        setShowDetectedDialog(true);
      }
    } catch (e) {
      console.error('[AutoDetectProvider] auto-detect failed:', e);
    } finally {
      setAutoDetecting(false);
    }
  }, [savedConfigs, dismissedProviders, commandRunner]);

  const handleAddDetectedProviders = React.useCallback(
    (providers: DetectedProvider[]) => {
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
    (providers: DetectedProvider[]) => {
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
 */
export function AutoDetectProvider({
  detectedProviders,
  showDetectedDialog,
  setShowDetectedDialog,
  handleAddDetectedProviders,
  handleDismissDetectedProviders,
  DialogSlot,
}: {
  detectedProviders: DetectedProvider[];
  showDetectedDialog: boolean;
  setShowDetectedDialog: (show: boolean) => void;
  handleAddDetectedProviders: (providers: DetectedProvider[]) => void;
  handleDismissDetectedProviders: (providers: DetectedProvider[]) => void;
  DialogSlot?: React.ElementType;
}) {
  const { t } = useTranslation();
  void t;
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

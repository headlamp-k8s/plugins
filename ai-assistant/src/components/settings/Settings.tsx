/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { CommandRunner } from '@headlamp-k8s/ai-common/providers/detectProvider';
import {
  createFetchHttpClient,
  createNoopFileSystem,
} from '@headlamp-k8s/ai-common/skills/adapters/browser';
import { getSkillsConfig, getSkillSourceIdentity } from '@headlamp-k8s/ai-common/skills/config';
import { SkillManager } from '@headlamp-k8s/ai-common/skills/SkillManager';
import type { DeveloperOptionsConfig } from '@headlamp-k8s/ai-ui/components/settings/DeveloperSettings';
import { SettingsPage } from '@headlamp-k8s/ai-ui/components/settings/SettingsPage';
import { isTestModeCheck } from '@headlamp-k8s/ai-ui/testing/testMode';
import { Headlamp, runCommand, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { useSnackbar } from 'notistack';
import React from 'react';

// pluginRunCommand is injected as a scope variable by Headlamp's plugin runner.
// Using declare const lets TypeScript reference it without an explicit definition.
declare const pluginRunCommand: typeof runCommand;
import {
  HOLMES_SERVICE_NAME,
  HOLMES_SERVICE_NAMESPACE,
  HOLMES_SERVICE_PORT,
} from '../../holmesClient';
import {
  getAllAvailableTools,
  isToolEnabled,
  pluginStore,
  toggleTool,
  usePluginConfig,
} from '../../pluginState';

/** Skill display info shape (mirrors SkillsViewerDialog.SkillDisplayInfo). */
interface SkillDisplayInfo {
  name: string;
  description: string;
  source: string;
  content: string;
  contentSizeBytes: number;
  version?: string;
  author?: string;
  tags?: string[];
}

/**
 * Plugin settings page for the AI Assistant.
 *
 * Thin wrapper around the framework-agnostic {@link SettingsPage} component
 * from `@headlamp-k8s/ai-ui`. Injects headlamp-plugin-specific dependencies
 * (plugin store, command runner, Holmes constants).
 *
 * Registered with `registerPluginSettings` so it appears on the Headlamp
 * settings route.
 */
export default function Settings() {
  const savedConfigs = usePluginConfig();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  // Persistent SkillManager for the viewer (reuses cache across opens)
  const skillManagerRef = React.useRef<SkillManager | null>(null);

  const loadSkills = React.useCallback(
    async (
      onProgress?: (progress: any) => void,
      sourceIdentity?: string
    ): Promise<SkillDisplayInfo[]> => {
      if (!skillManagerRef.current) {
        skillManagerRef.current = new SkillManager(createNoopFileSystem(), createFetchHttpClient());
      }
      // Invalidate cache to force fresh load
      skillManagerRef.current.invalidateCache();
      const config = getSkillsConfig(pluginStore.get());

      // When a source identity is given, load only that exact URL/path source.
      // the progress bar between sources when showing a per-repo download)
      const filteredConfig = sourceIdentity
        ? {
            ...config,
            sources: config.sources.filter(
              source => getSkillSourceIdentity(source) === sourceIdentity
            ),
          }
        : config;

      const enabledCount = filteredConfig.sources.filter(s => s.enabled).length;
      if (enabledCount === 0) {
        return [];
      }

      const { skills, errors } = await skillManagerRef.current.loadAllSkillsWithErrors(
        filteredConfig,
        onProgress ? (_url, p) => onProgress(p) : undefined
      );

      // Surface per-source errors so the user knows what failed
      for (const err of errors) {
        enqueueSnackbar(
          t('Skill source "{{sourceUrl}}" failed: {{error}}', {
            sourceUrl: err.sourceUrl,
            error: err.error,
          }),
          {
            variant: 'error',
            autoHideDuration: 8000,
          }
        );
      }

      return skills.map(s => ({
        name: s.metadata.name,
        description: s.metadata.description,
        source: s.source,
        content: s.content,
        contentSizeBytes: s.contentSizeBytes,
        version: s.metadata.version,
        author: s.metadata.author,
        tags: s.metadata.tags,
      }));
    },
    [enqueueSnackbar, t]
  );

  const handleSkillsLoadComplete = React.useCallback(
    (result: { count: number; error?: string }) => {
      if (result.error) {
        enqueueSnackbar(t('Failed to load skills: {{error}}', { error: result.error }), {
          variant: 'error',
        });
      } else {
        enqueueSnackbar(
          result.count === 1
            ? t('Loaded 1 skill from configured sources.')
            : t('Loaded {{count}} skills from configured sources.', { count: result.count }),
          { variant: result.count > 0 ? 'success' : 'info' }
        );
      }
    },
    [enqueueSnackbar, t]
  );

  // Command runner for CLI-based provider detection
  const [commandRunner, setCommandRunner] = React.useState<CommandRunner | null>(null);
  React.useEffect(() => {
    if (typeof pluginRunCommand !== 'undefined') {
      setCommandRunner(() => async (command: string, args: string[]) => {
        // pluginRunCommand returns an EventEmitter-like object; convert to
        // the { stdout, exitCode } shape that CommandRunner expects.
        return new Promise<{ stdout: string; exitCode: number }>(resolve => {
          // @ts-ignore — 'gh' and 'az' are narrower than the declared type
          const proc = pluginRunCommand(command as any, args, {});
          let out = '';
          proc.stdout.on('data', (d: any) => (out += String(d)));
          proc.on('exit', (code: number | null) => resolve({ stdout: out, exitCode: code ?? -1 }));
        });
      });
    }
  }, []);

  const pluginSettings = savedConfigs;
  const isTestMode = isTestModeCheck() || savedConfigs?.testMode === true;

  return (
    <SettingsPage
      savedConfigs={savedConfigs}
      onConfigsChange={configs => pluginStore.update(configs as any)}
      onTermsAccept={configs => pluginStore.update(configs as any)}
      commandRunner={commandRunner}
      dismissedProviders={(pluginStore.get() as any)?.autoDetectDismissedProviders || []}
      onDismissProviders={keys => {
        const current = pluginStore.get() || {};
        pluginStore.update({ ...current, autoDetectDismissedProviders: keys } as any);
      }}
      tools={getAllAvailableTools()}
      isToolEnabled={toolId => isToolEnabled(pluginSettings, toolId)}
      onToolToggle={toolId => {
        const updatedSettings = toggleTool(pluginSettings, toolId);
        pluginStore.update(updatedSettings);
      }}
      isRunningAsApp={Headlamp.isRunningAsApp()}
      configStore={pluginStore}
      loadSkills={loadSkills}
      onSkillsLoadComplete={handleSkillsLoadComplete}
      onHolmesConfigChange={(patch: Record<string, any>) => {
        const current = pluginStore.get() || {};
        pluginStore.update({ ...current, ...patch });
      }}
      defaultHolmesNamespace={HOLMES_SERVICE_NAMESPACE}
      defaultHolmesServiceName={HOLMES_SERVICE_NAME}
      defaultHolmesPort={HOLMES_SERVICE_PORT}
      previewEnabled={savedConfigs?.previewEnabled ?? true}
      onPreviewChange={enabled => {
        const current = pluginStore.get() || {};
        pluginStore.update({ ...current, previewEnabled: enabled });
      }}
      proactiveDiagnosisEnabled={savedConfigs?.proactiveDiagnosisEnabled ?? false}
      onProactiveDiagnosisChange={enabled => {
        const current = pluginStore.get() || {};
        pluginStore.update({ ...current, proactiveDiagnosisEnabled: enabled });
      }}
      isTestMode={isTestMode}
      onTestModeChange={enabled => {
        const current = pluginStore.get() || {};
        pluginStore.update({ ...current, testMode: enabled });
      }}
      hasShownConfigPopover={savedConfigs?.configPopoverShown || false}
      onResetPopover={() => {
        const current = pluginStore.get() || {};
        pluginStore.update({ ...current, configPopoverShown: false });
      }}
      devOptions={savedConfigs?.devOptions ?? {}}
      onDevOptionsChange={(options: DeveloperOptionsConfig) => {
        const current = pluginStore.get() || {};
        pluginStore.update({ ...current, devOptions: options });
      }}
    />
  );
}

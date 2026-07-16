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

// Initialize the bundled react-i18next instance so that i18n interpolation
// works in ai-ui components before plugin-specific translations are loaded.
// The vite bundle ships its own react-i18next (not externalized) which is
// separate from Headlamp's I18nextProvider; without init, t() returns keys
// verbatim (e.g. "Configure {{provider}}") with no interpolation applied.
import { initAiUiI18n } from '@headlamp-k8s/ai-ui/i18n';
import {
  registerAppBarAction,
  registerPluginSettings,
  registerResourceTableColumnsProcessor,
  registerUIPanel,
} from '@kinvolk/headlamp-plugin/lib';
import { ActionButton, ResourceTableColumn } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Event from '@kinvolk/headlamp-plugin/lib/K8s/event';
import React from 'react';

void initAiUiI18n();
// Register provider icons for offline use
import '@headlamp-k8s/ai-ui/icons/iconBundles';
import { proactiveDiagnosisManager } from '@headlamp-k8s/ai-ui/diagnosis/ProactiveDiagnosisManager';
import HeadlampAIPrompt from './components/appbar/HeadlampAIPrompt';
import HeadlampEventHandler from './components/appbar/HeadlampEventHandler';
import AIPanelComponent from './components/panel/AIPanelComponent';
import Settings from './components/settings/Settings';
import type { RawK8sEvent } from './kubernetes/EventFetcher';
import { PLUGIN_NAME, useGlobalState, usePluginConfig } from './pluginState';

// Register UI Panel component that uses the shared state to show/hide
registerUIPanel({
  id: 'headlamp-ai',
  side: 'right',
  component: () => <AIPanelComponent />,
});

registerAppBarAction(HeadlampAIPrompt);

registerAppBarAction(HeadlampEventHandler);

registerPluginSettings(PLUGIN_NAME, Settings);

function AIDiagnosisButton({ event }: { event: Event }) {
  const pluginState = useGlobalState();
  const pluginConfig = usePluginConfig();

  if (pluginConfig?.proactiveDiagnosisEnabled !== true) return null;

  const handleDiagnose = () => {
    const data = (event.jsonData || {}) as Partial<RawK8sEvent>;
    const eventUid = data?.metadata?.uid || `${data?.metadata?.name}-${data?.metadata?.namespace}`;
    const involvedObject = data?.involvedObject ?? { kind: '', name: '', namespace: '' };

    const eventDigest = {
      uid: eventUid,
      name: data?.metadata?.name || 'unknown',
      type: data?.type || 'Warning',
      reason: data?.reason || '',
      message: data?.message || '',
      objectKind: involvedObject?.kind || '',
      objectName: involvedObject?.name || '',
      objectNamespace: involvedObject?.namespace || '',
      lastTimestamp: data?.lastTimestamp || data?.metadata?.creationTimestamp || '',
      rawEvent: data,
    };

    if (!proactiveDiagnosisManager.hasDiagnosis(eventUid)) {
      proactiveDiagnosisManager.diagnoseSingleEvent(eventDigest).catch(err => {
        console.error('[AIDiagnosisButton] Failed to diagnose event:', err);
      });
    }

    proactiveDiagnosisManager.setScrollToEventUid(eventUid);
    pluginState.setIsUIPanelOpen(true);
  };

  return (
    <ActionButton
      description="Diagnose with AI"
      icon="mdi:robot-outline"
      onClick={handleDiagnose}
    />
  );
}

registerResourceTableColumnsProcessor(function addAIDiagnosisToEvents({ id, columns }) {
  if (id === 'headlamp-cluster.overview.events') {
    const eventColumns = columns as ResourceTableColumn<Event>[];
    eventColumns.push({
      label: 'AI Diagnosis',
      getValue: (event: Event) => {
        const eventType = event.jsonData?.type || '';
        return eventType === 'Warning' || eventType === 'Error' ? eventType : '';
      },
      render: (event: Event) => {
        const eventType = event.jsonData?.type || '';
        if (eventType === 'Warning' || eventType === 'Error') {
          return <AIDiagnosisButton event={event} />;
        }
        return null;
      },
    });
  }

  return columns;
});

// Export the cluster change notifier for external use
export { useClusterChangeNotifier, ClusterChangeNotifier } from './hooks/useClusterChangeNotifier';

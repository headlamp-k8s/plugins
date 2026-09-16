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

import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ActionButton } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { type HeadlampEventPayload, useGlobalState, usePluginConfig } from '../../pluginState';

export interface ResourceAIActionProps {
  /** The Kubernetes resource whose details view is currently open. */
  item?: any;
}

/**
 * Details view header action button that directly opens the AI Assistant
 * drawer with the active resource bound into context and an initial prompt pre-populated.
 *
 * @param props - Component props containing the active resource item.
 * @returns An ActionButton or null if disabled/unavailable.
 */
export function ResourceAIAction({ item }: ResourceAIActionProps): React.ReactElement | null {
  const pluginState = useGlobalState();
  const pluginConfig = usePluginConfig();
  const { t } = useTranslation();

  const previewEnabled = pluginConfig?.previewEnabled ?? true;
  if (!previewEnabled || !item) {
    return null;
  }

  const handleAskAI = () => {
    const resourceKind = item.kind || item.jsonData?.kind || '';
    const resourceName = item.metadata?.name || item.jsonData?.metadata?.name || item.name || '';

    const title =
      resourceKind && resourceName
        ? `${resourceKind}: ${resourceName}`
        : resourceKind || resourceName || 'Resource';

    pluginState.setEvent({
      ...pluginState.event,
      type: 'headlamp.details-view',
      title,
      resource: item,
      resourceKind,
    } as HeadlampEventPayload);

    const prompt =
      resourceKind && resourceName
        ? `Diagnose status of ${resourceKind} ${resourceName}`
        : resourceKind
        ? `Diagnose status of this ${resourceKind}`
        : 'Diagnose status of this resource';

    pluginState.setInitialPrompt?.(prompt);
    pluginState.setIsUIPanelOpen(true);
  };

  const askAiLabel = t('Ask AI');

  return <ActionButton description={askAiLabel} icon="mdi:robot-outline" onClick={handleAskAI} />;
}

export default ResourceAIAction;

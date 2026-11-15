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

import { render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  checkHolmesAgentHealth: vi.fn(),
  getCluster: vi.fn(() => 'test-cluster'),
}));

vi.mock('@headlamp-k8s/ai-common/providers/savedConfigs', () => ({
  getSavedConfigurations: () => ({ providers: [] }),
}));

vi.mock('@headlamp-k8s/ai-ui/AiUiI18nProvider', () => ({
  AiUiI18nProvider: ({ children }: React.PropsWithChildren) => children,
}));

vi.mock('@headlamp-k8s/ai-ui/components/appbar/AIAssistantToggle', () => ({
  default: () => React.createElement('button'),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: {} }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/Utils', () => ({
  getCluster: mocks.getCluster,
}));

vi.mock('react-router-dom', () => ({
  useHistory: () => ({ push: vi.fn() }),
}));

vi.mock('../../holmesClient', () => ({
  checkHolmesAgentHealth: mocks.checkHolmesAgentHealth,
}));

vi.mock('../../pluginState', () => ({
  getSettingsURL: () => '/settings',
  pluginStore: { get: () => ({}), update: vi.fn() },
  useGlobalState: () => ({ isUIPanelOpen: false, setIsUIPanelOpen: vi.fn() }),
  usePluginConfig: () => ({ configPopoverShown: true, previewEnabled: true }),
}));

import HeadlampAIPrompt from './HeadlampAIPrompt';

describe('HeadlampAIPrompt', () => {
  afterEach(() => {
    delete window.desktopApi;
    vi.clearAllMocks();
  });

  it('does not probe Holmes on AKS Desktop', () => {
    window.desktopApi = {
      registerAKSCluster: () => undefined,
    } as unknown as typeof window.desktopApi;

    render(React.createElement(HeadlampAIPrompt));

    expect(mocks.getCluster).not.toHaveBeenCalled();
    expect(mocks.checkHolmesAgentHealth).not.toHaveBeenCalled();
  });
});

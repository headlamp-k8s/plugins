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

import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// Capture the props passed to SettingsPage so we can assert on them.
const capturedProps: Record<string, unknown>[] = [];
vi.mock('@headlamp-k8s/ai-ui/components/settings/SettingsPage', () => ({
  SettingsPage: (props: Record<string, unknown>) => {
    capturedProps.push(props);
    return React.createElement('div', { 'data-testid': 'settings-page' });
  },
}));

vi.mock('@headlamp-k8s/ai-ui/testing/testMode', () => ({
  isTestModeCheck: () => false,
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  Headlamp: { isRunningAsApp: () => false },
}));

vi.mock('../../pluginState', () => ({
  AKS_AGENT_INSTALL_DOC_URL: 'https://example.com/docs',
  getAllAvailableTools: () => [],
  isToolEnabled: () => false,
  pluginStore: { get: () => ({}), update: vi.fn() },
  toggleTool: (settings: unknown) => settings,
  usePluginConfig: () => ({}),
}));

import { render } from '@testing-library/react';
import Settings from './Settings';

describe('Settings', () => {
  it('renders without crashing (guards against missing Holmes constant imports)', () => {
    capturedProps.length = 0;
    expect(() => render(React.createElement(Settings))).not.toThrow();
  });

  it('passes defined Holmes constants to SettingsPage', () => {
    capturedProps.length = 0;
    render(React.createElement(Settings));

    expect(capturedProps.length).toBeGreaterThan(0);
    const props = capturedProps[0];

    // These were previously undefined due to a missing import, causing a
    // ReferenceError at runtime that crashed the settings page.
    expect(props.defaultHolmesNamespace).toBeDefined();
    expect(typeof props.defaultHolmesNamespace).toBe('string');
    expect((props.defaultHolmesNamespace as string).length).toBeGreaterThan(0);

    expect(props.defaultHolmesServiceName).toBeDefined();
    expect(typeof props.defaultHolmesServiceName).toBe('string');

    expect(props.defaultHolmesPort).toBeDefined();
    expect(typeof props.defaultHolmesPort).toBe('number');
  });
});

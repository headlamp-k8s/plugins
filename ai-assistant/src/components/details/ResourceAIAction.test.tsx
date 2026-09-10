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

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResourceAIAction } from './ResourceAIAction';

const mockSetEvent = vi.fn();
const mockSetIsUIPanelOpen = vi.fn();
const mockSetInitialPrompt = vi.fn();
let mockPluginConfig: { previewEnabled?: boolean } = { previewEnabled: true };

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../pluginState', () => ({
  useGlobalState: () => ({
    event: null,
    setEvent: mockSetEvent,
    isUIPanelOpen: false,
    setIsUIPanelOpen: mockSetIsUIPanelOpen,
    initialPrompt: '',
    setInitialPrompt: mockSetInitialPrompt,
  }),
  usePluginConfig: () => mockPluginConfig,
}));

describe('ResourceAIAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPluginConfig = { previewEnabled: true };
  });

  it('renders the Ask AI button when item is provided and preview is enabled', () => {
    const item = { kind: 'Pod', metadata: { name: 'test-pod' } };
    render(<ResourceAIAction item={item} />);

    const button = screen.getByRole('button', { name: 'Ask AI' });
    expect(button).toBeDefined();
  });

  it('populates event, initialPrompt, and opens panel on click', () => {
    const item = {
      kind: 'Deployment',
      metadata: { name: 'nginx-deployment', namespace: 'default' },
    };
    render(<ResourceAIAction item={item} />);

    const button = screen.getByRole('button', { name: 'Ask AI' });
    fireEvent.click(button);

    expect(mockSetEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'headlamp.details-view',
        title: 'Deployment: nginx-deployment',
        resource: item,
        resourceKind: 'Deployment',
      })
    );
    expect(mockSetInitialPrompt).toHaveBeenCalledWith(
      'Diagnose status of Deployment nginx-deployment'
    );
    expect(mockSetIsUIPanelOpen).toHaveBeenCalledWith(true);
  });

  it('falls back gracefully when item has no kind or name', () => {
    const item = {};
    render(<ResourceAIAction item={item} />);

    const button = screen.getByRole('button', { name: 'Ask AI' });
    fireEvent.click(button);

    expect(mockSetEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'headlamp.details-view',
        title: 'Resource',
        resource: item,
        resourceKind: '',
      })
    );
    expect(mockSetInitialPrompt).toHaveBeenCalledWith('Diagnose status of this resource');
    expect(mockSetIsUIPanelOpen).toHaveBeenCalledWith(true);
  });

  it('returns null when item is undefined', () => {
    const { container } = render(<ResourceAIAction />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when previewEnabled is false', () => {
    mockPluginConfig = { previewEnabled: false };
    const item = { kind: 'Pod', metadata: { name: 'test-pod' } };
    const { container } = render(<ResourceAIAction item={item} />);
    expect(container.firstChild).toBeNull();
  });
});

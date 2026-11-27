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

import * as headlampUtils from '@kinvolk/headlamp-plugin/lib/Utils';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotConfigured } from '../components/NotConfigured';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      key.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options?.[name] ?? '')),
  }),
}));

// The cluster name comes from Headlamp at runtime. Pin it so the expected URL
// is the same for everyone running these tests.
vi.mock('@kinvolk/headlamp-plugin/lib/Utils', async importOriginal => {
  const original = await importOriginal<typeof import('@kinvolk/headlamp-plugin/lib/Utils')>();
  return { ...original, getCluster: vi.fn(() => 'test-cluster') };
});

afterEach(() => {
  cleanup();
  vi.mocked(headlampUtils.getCluster).mockReturnValue('test-cluster');
});

function renderNotConfigured(): void {
  render(
    <MemoryRouter>
      <NotConfigured />
    </MemoryRouter>
  );
}

describe('NotConfigured', () => {
  it('says the plugin is not configured', () => {
    renderNotConfigured();

    expect(screen.getByText('PipeCD Not Configured')).toBeTruthy();
  });

  it('explains what is needed', () => {
    renderNotConfigured();

    expect(screen.getByText(/server URL and API key/i)).toBeTruthy();
  });

  // Plugin routes are cluster-scoped. A bare /pipecd/settings link lands on
  // Headlamp's not-found page instead of the settings form.
  it('points Configure PipeCD at the cluster-scoped settings route', () => {
    renderNotConfigured();

    const link = screen.getByRole('link', { name: 'Configure PipeCD' });

    expect(link.getAttribute('href')).toBe('/c/test-cluster/pipecd/settings');
  });

  it('falls back to an unprefixed route when no cluster is selected', () => {
    vi.mocked(headlampUtils.getCluster).mockReturnValue(null);

    renderNotConfigured();

    expect(screen.getByRole('link', { name: 'Configure PipeCD' }).getAttribute('href')).toBe(
      '/pipecd/settings'
    );
  });

  it('links to the PipeCD API key docs in a new tab', () => {
    renderNotConfigured();

    const link = screen.getByRole('link', { name: 'Get API Key' });

    expect(link.getAttribute('href')).toBe('https://pipecd.dev/docs/user-guide/command-line-tool/');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('mentions the minimum API key role', () => {
    renderNotConfigured();

    expect(screen.getByText(/at minimum the READ_ONLY role/)).toBeTruthy();
  });
});

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

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockConfigMapUseGet } = vi.hoisted(() => ({
  mockConfigMapUseGet: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: {
    ResourceClasses: {
      ConfigMap: {
        useGet: mockConfigMapUseGet,
      },
    },
  },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  ActionButton: (props: {
    description: string;
    longDescription?: string;
    icon: string;
    onClick: () => void;
  }) => (
    <button
      aria-label={props.description}
      data-icon={props.icon}
      data-long-description={props.longDescription}
      onClick={props.onClick}
    />
  ),
}));

import type { ArgoApplication } from '../../resources/application';
import {
  buildArgoApplicationUrl,
  getArgoConfigNamespace,
  OpenInArgoCDAction,
} from './openInArgoCD';

function hookResponse(options: { url?: string; error?: unknown; isLoading?: boolean }) {
  return Object.assign(
    [options.url === undefined ? null : { data: { url: options.url } }, options.error ?? null],
    { isLoading: options.isLoading ?? false }
  );
}

function application(options?: {
  controllerNamespace?: string;
  namespace?: string;
  name?: string;
  cluster?: string;
}) {
  return {
    cluster: options?.cluster ?? 'kind-test',
    controllerNamespace: options?.controllerNamespace,
    metadata: {
      namespace: options?.namespace ?? 'applications',
      name: options?.name ?? 'guestbook',
    },
  } as ArgoApplication;
}

afterEach(cleanup);

beforeEach(() => {
  mockConfigMapUseGet.mockReset();
  vi.restoreAllMocks();
});

describe('buildArgoApplicationUrl', () => {
  it.each([
    ['http://argo.example.com', 'http://argo.example.com/applications/argocd/guestbook'],
    ['https://argo.example.com/', 'https://argo.example.com/applications/argocd/guestbook'],
    [
      '  https://argo.example.com/argo-cd///  ',
      'https://argo.example.com/argo-cd/applications/argocd/guestbook',
    ],
    [
      'https://argo.example.com/argo-cd?old=value#section',
      'https://argo.example.com/argo-cd/applications/argocd/guestbook',
    ],
  ])('builds a safe Application URL from %s', (configuredUrl, expected) => {
    expect(buildArgoApplicationUrl(configuredUrl, 'argocd', 'guestbook')).toBe(expected);
  });

  it('encodes the Application namespace and name as path segments', () => {
    expect(buildArgoApplicationUrl('https://argo.example.com', 'team one', 'guest/book')).toBe(
      'https://argo.example.com/applications/team%20one/guest%2Fbook'
    );
  });

  it.each([
    undefined,
    '',
    'not a URL',
    '/relative/path',
    'javascript:alert(1)',
    'data:text/plain,hello',
    'ftp://argo.example.com',
    'https://user:password@argo.example.com',
  ])('rejects an unsafe or incomplete configured URL: %s', configuredUrl => {
    expect(buildArgoApplicationUrl(configuredUrl, 'argocd', 'guestbook')).toBeNull();
  });

  it('rejects missing Application identity fields', () => {
    expect(buildArgoApplicationUrl('https://argo.example.com', undefined, 'guestbook')).toBeNull();
    expect(buildArgoApplicationUrl('https://argo.example.com', 'argocd', undefined)).toBeNull();
  });
});

describe('getArgoConfigNamespace', () => {
  it('prefers the namespace reported by the Argo CD controller', () => {
    expect(getArgoConfigNamespace(application({ controllerNamespace: 'argocd' }))).toBe('argocd');
  });

  it('falls back to the Application namespace', () => {
    expect(getArgoConfigNamespace(application({ namespace: 'applications' }))).toBe('applications');
  });
});

describe('OpenInArgoCDAction', () => {
  it('renders the offline Argo action and opens the exact Application URL', () => {
    mockConfigMapUseGet.mockReturnValue(hookResponse({ url: 'https://argo.example.com/argo-cd' }));
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<OpenInArgoCDAction application={application({ controllerNamespace: 'argocd' })} />);

    const button = screen.getByRole('button', { name: 'Open in Argo CD' });
    expect(button.getAttribute('data-icon')).toBe('simple-icons:argo');
    expect(button.getAttribute('data-long-description')).toBe(
      'Open this Application in the configured Argo CD UI in a new tab.'
    );
    expect(mockConfigMapUseGet).toHaveBeenCalledWith('argocd-cm', 'argocd', {
      cluster: 'kind-test',
    });

    fireEvent.click(button);
    expect(open).toHaveBeenCalledWith(
      'https://argo.example.com/argo-cd/applications/applications/guestbook',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('uses the Application namespace fallback for the ConfigMap lookup', () => {
    mockConfigMapUseGet.mockReturnValue(hookResponse({ url: 'https://argo.example.com' }));
    render(<OpenInArgoCDAction application={application({ namespace: 'applications' })} />);

    expect(mockConfigMapUseGet).toHaveBeenCalledWith('argocd-cm', 'applications', {
      cluster: 'kind-test',
    });
  });

  it.each([
    ['loading', hookResponse({ isLoading: true })],
    ['not found', hookResponse({ error: { status: 404 } })],
    ['forbidden', hookResponse({ error: { status: 403 } })],
    ['missing URL', hookResponse({})],
    ['invalid URL', hookResponse({ url: 'javascript:alert(1)' })],
  ])('hides the action when configuration is %s', (_case, response) => {
    mockConfigMapUseGet.mockReturnValue(response);
    render(<OpenInArgoCDAction application={application()} />);

    expect(screen.queryByRole('button', { name: 'Open in Argo CD' })).toBeNull();
  });

  it('does not query ConfigMaps when the Application has no namespace', () => {
    render(<OpenInArgoCDAction application={application({ namespace: '' })} />);

    expect(mockConfigMapUseGet).not.toHaveBeenCalled();
  });
});

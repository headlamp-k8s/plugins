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

import { isValidElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

const { LinkedResource } = vi.hoisted(() => ({
  LinkedResource: class LinkedResource {
    jsonData: unknown;

    constructor(jsonData: unknown) {
      this.jsonData = jsonData;
    }

    getDetailsLink() {
      return '/details';
    }
  },
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: {
    ResourceClasses: {
      Deployment: LinkedResource,
      Pod: LinkedResource,
      Service: LinkedResource,
    },
  },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

import { getManagedResourceLink } from './managedResourceLinks';

describe('getManagedResourceLink', () => {
  it.each([
    ['Deployment', 'apps', 'v1'],
    ['Service', '', 'v1'],
    ['Pod', '', 'v1'],
  ])('creates a Headlamp link for a %s', (kind, group, version) => {
    const result = getManagedResourceLink({
      kind,
      group,
      version,
      namespace: 'default',
      name: 'guestbook-ui',
    });

    expect(isValidElement(result)).toBe(true);
    expect((result as React.ReactElement).props.kubeObject.jsonData).toEqual({
      apiVersion: group ? `${group}/${version}` : version,
      kind,
      metadata: { name: 'guestbook-ui', namespace: 'default' },
    });
  });

  it('keeps an unknown resource kind as plain text', () => {
    expect(
      getManagedResourceLink({
        kind: 'Rollout',
        group: 'argoproj.io',
        version: 'v1alpha1',
        namespace: 'default',
        name: 'guestbook-ui',
      })
    ).toBe('guestbook-ui');
  });

  it('keeps a resource without a namespace as plain text', () => {
    expect(
      getManagedResourceLink({
        kind: 'Deployment',
        group: 'apps',
        version: 'v1',
        name: 'guestbook-ui',
      })
    ).toBe('guestbook-ui');
  });
});

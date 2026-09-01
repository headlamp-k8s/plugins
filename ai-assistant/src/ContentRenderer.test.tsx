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

const mocks = vi.hoisted(() => ({
  createRouteURL: vi.fn(() => '/c/test-cluster/pods/default/test-pod'),
  push: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: {
    ResourceClasses: {
      Pod: class Pod {
        static apiName = 'pods';
        static detailsRoute = 'Pod';
        static isNamespaced = true;

        constructor() {
          throw new Error('KubeObject routing dependencies are unavailable');
        }
      },
    },
  },
  Router: { createRouteURL: mocks.createRouteURL },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', () => ({
  Link: React.forwardRef<
    HTMLAnchorElement,
    React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }
  >(({ children, onClick, to, ...props }, ref) => (
    <a
      ref={ref}
      href={to}
      onClick={event => {
        event.preventDefault();
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </a>
  )),
  useHistory: () => ({ push: mocks.push }),
}));

import ContentRenderer from './ContentRenderer';

describe('ContentRenderer resource links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates to a resource within Headlamp without constructing a KubeObject', () => {
    render(
      <ContentRenderer content="[test-pod](https://headlamp/resource-details?cluster=test-cluster&kind=Pod&resource=test-pod&ns=default)" />
    );

    const link = screen.getByRole('link', { name: 'test-pod' });
    expect(link.getAttribute('target')).toBeNull();

    fireEvent.click(link);

    expect(mocks.createRouteURL).toHaveBeenCalledWith('Pod', {
      cluster: 'test-cluster',
      name: 'test-pod',
      namespace: 'default',
    });
    expect(mocks.push).toHaveBeenCalledWith('/c/test-cluster/pods/default/test-pod');
  });
});

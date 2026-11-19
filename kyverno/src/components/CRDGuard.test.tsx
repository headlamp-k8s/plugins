/*
 * Copyright 2026 The Kubernetes Authors
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

import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KyvernoCRDStatus, useKyvernoCRDs } from '../hooks/useKyvernoCRDs';
import { CRDGuard } from './CRDGuard';

// Fills in {{placeholders}} like i18next does, so the interpolated messages can be checked.
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) =>
      key.replace(/{{(\w+)}}/g, (_, name: string) => options?.[name] ?? ''),
  }),
}));

// The banner's "Learn more" line uses Trans, which has no i18next instance to work with here.
vi.mock('react-i18next', () => ({
  Trans: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock('../hooks/useKyvernoCRDs', () => ({ useKyvernoCRDs: vi.fn() }));

/** Discovery result for a cluster without any Kyverno CRDs, unless overridden. */
function mockCRDs(overrides: Partial<KyvernoCRDStatus> = {}) {
  vi.mocked(useKyvernoCRDs).mockReturnValue({
    legacy: false,
    cel: false,
    cleanup: false,
    reports: false,
    exceptions: false,
    ephemeralReports: false,
    celResources: new Set(),
    loading: false,
    ...overrides,
  });
}

describe('CRDGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the group's own message when its single required group is missing", () => {
    mockCRDs();

    render(
      <CRDGuard requires="legacy">
        <p>page</p>
      </CRDGuard>
    );

    expect(
      screen.getByText('Kyverno (kyverno.io/v1) was not detected on this cluster.')
    ).toBeTruthy();
    expect(screen.queryByText('page')).toBeNull();
  });

  it('names every acceptable API group when none of several groups is present', () => {
    mockCRDs();

    render(
      <CRDGuard requires={['legacy', 'cel']}>
        <p>page</p>
      </CRDGuard>
    );

    expect(
      screen.getByText(
        'None of the Kyverno APIs this page works with (kyverno.io/v1, policies.kyverno.io/v1) were detected on this cluster.'
      )
    ).toBeTruthy();
    expect(screen.queryByText('page')).toBeNull();
  });

  it('renders the page when any one of several groups is present', () => {
    mockCRDs({ cel: true });

    render(
      <CRDGuard requires={['legacy', 'cel']}>
        <p>page</p>
      </CRDGuard>
    );

    expect(screen.getByText('page')).toBeTruthy();
  });

  it('lists an API group that several groups share only once', () => {
    mockCRDs();

    render(
      <CRDGuard requires={['cleanup', 'exceptions', 'cel']}>
        <p>page</p>
      </CRDGuard>
    );

    expect(
      screen.getByText(
        'None of the Kyverno APIs this page works with (kyverno.io/v2, policies.kyverno.io/v1) were detected on this cluster.'
      )
    ).toBeTruthy();
  });

  it("keeps the first group's own message when all groups share one API group", () => {
    mockCRDs();

    render(
      <CRDGuard requires={['cleanup', 'exceptions']}>
        <p>page</p>
      </CRDGuard>
    );

    expect(
      screen.getByText(
        'Kyverno cleanup policies (kyverno.io/v2) were not detected on this cluster.'
      )
    ).toBeTruthy();
  });
});

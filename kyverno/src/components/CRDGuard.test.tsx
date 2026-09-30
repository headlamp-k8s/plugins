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

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { KyvernoCRDStatus } from '../hooks/useKyvernoCRDs';
import { CRDGuard } from './CRDGuard';

const { useKyvernoCRDs } = vi.hoisted(() => ({ useKyvernoCRDs: vi.fn() }));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (message: string) => message }),
}));

vi.mock('../hooks/useKyvernoCRDs', () => ({ useKyvernoCRDs }));

vi.mock('./common', () => ({
  NotInstalledBanner: ({ loading, message }: { loading?: boolean; message?: string }) => (
    <div>{loading ? 'Loading' : message}</div>
  ),
}));

function status(legacy: boolean | undefined): KyvernoCRDStatus {
  return {
    legacy,
    cel: true,
    cleanup: true,
    reports: true,
    exceptions: true,
    kyvernoV2Reports: true,
    ephemeralReports: true,
    loading: false,
  };
}

describe('CRDGuard', () => {
  beforeEach(() => {
    useKyvernoCRDs.mockReset();
  });

  it('renders children when required CRD availability is unknown', () => {
    useKyvernoCRDs.mockReturnValue(status(undefined));

    render(
      <CRDGuard requires="legacy">
        <div>Protected feature</div>
      </CRDGuard>
    );

    expect(screen.getByText('Protected feature')).toBeTruthy();
  });

  it('shows the not-installed banner when a required CRD is absent', () => {
    useKyvernoCRDs.mockReturnValue(status(false));

    render(
      <CRDGuard requires="legacy">
        <div>Protected feature</div>
      </CRDGuard>
    );

    expect(
      screen.getByText('Kyverno (kyverno.io/v1) was not detected on this cluster.')
    ).toBeTruthy();
    expect(screen.queryByText('Protected feature')).toBeNull();
  });
});

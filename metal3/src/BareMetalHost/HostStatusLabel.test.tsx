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

import { describe, expect, it } from 'vitest';
import { composeStatus } from './HostStatusLabel';

describe('composeStatus', () => {
  it('reads a healthy, available host', () => {
    const result = composeStatus({
      status: { operationalStatus: 'OK', provisioning: { state: 'available' } },
    });
    expect(result.operationalStatus).toBe('OK');
    expect(result.severity).toBe('success');
    expect(result.provisioningState).toBe('available');
    expect(result.errorType).toBe('');
  });

  it('surfaces an operational error and the provisioning state at the same time', () => {
    // The defining case: operationalStatus is "error" while provisioning.state is
    // still "provisioned". The two axes are independent, so both must come through.
    const result = composeStatus({
      status: {
        operationalStatus: 'error',
        provisioning: { state: 'provisioned' },
        errorType: 'provisioned registration error',
        errorMessage: 'Failed to reach BMC: connection timed out',
      },
    });
    expect(result.severity).toBe('error');
    expect(result.provisioningState).toBe('provisioned');
    expect(result.errorType).toBe('provisioned registration error');
    expect(result.errorMessage).toBe('Failed to reach BMC: connection timed out');
  });

  it('maps known operational values to severities', () => {
    expect(composeStatus({ status: { operationalStatus: 'delayed' } }).severity).toBe('warning');
    expect(composeStatus({ status: { operationalStatus: 'detached' } }).severity).toBe('warning');
    expect(composeStatus({ status: { operationalStatus: 'servicing' } }).severity).toBe('warning');
    expect(composeStatus({ status: { operationalStatus: 'discovered' } }).severity).toBe('');
  });

  it('falls through unknown/future operational values to neutral instead of breaking', () => {
    const result = composeStatus({ status: { operationalStatus: 'some-future-state' } });
    expect(result.operationalStatus).toBe('some-future-state');
    expect(result.severity).toBe('');
  });

  it('returns safe defaults when status is absent', () => {
    const result = composeStatus({});
    expect(result.operationalStatus).toBe('');
    expect(result.severity).toBe('');
    expect(result.provisioningState).toBe('');
    expect(result.errorType).toBe('');
    expect(result.errorMessage).toBe('');
  });
});

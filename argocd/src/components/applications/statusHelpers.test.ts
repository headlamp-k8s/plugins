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
import { getGraphStatus } from './statusHelpers';

describe('getGraphStatus', () => {
  it('maps Synced + Healthy to success', () => {
    expect(getGraphStatus('Synced', 'Healthy')).toBe('success');
  });

  it('maps OutOfSync to error even when Healthy', () => {
    expect(getGraphStatus('OutOfSync', 'Healthy')).toBe('error');
  });

  it('maps Degraded or Missing to error', () => {
    expect(getGraphStatus('Synced', 'Degraded')).toBe('error');
    expect(getGraphStatus('Unknown', 'Missing')).toBe('error');
  });

  it('maps Progressing, Suspended, Unknown to warning', () => {
    expect(getGraphStatus('Synced', 'Progressing')).toBe('warning');
    expect(getGraphStatus('Synced', 'Suspended')).toBe('warning');
    expect(getGraphStatus('Unknown', 'Healthy')).toBe('warning');
    expect(getGraphStatus('Unknown', 'Unknown')).toBe('warning');
  });

  it('maps partial successful state to warning until both values are available', () => {
    expect(getGraphStatus('Synced', undefined)).toBe('warning');
    expect(getGraphStatus(undefined, 'Healthy')).toBe('warning');
  });

  it('maps missing sync/health to undefined', () => {
    expect(getGraphStatus(undefined, undefined)).toBeUndefined();
  });
});

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

import { getPhaseSeverity, PHASE_HEALTHY } from './clusterPhase';

describe('getPhaseSeverity', () => {
  it('treats the healthy phase as healthy', () => {
    expect(getPhaseSeverity(PHASE_HEALTHY)).toBe('healthy');
  });

  it('treats an unrecoverable cluster as failed', () => {
    expect(getPhaseSeverity('Cluster is unrecoverable and needs manual intervention')).toBe(
      'failed'
    );
  });

  it('treats an invalid cluster definition as failed', () => {
    expect(getPhaseSeverity('Invalid cluster definition')).toBe('failed');
  });

  it('treats waiting for user action as failed, because it will not self-heal', () => {
    expect(getPhaseSeverity('Waiting for user action')).toBe('failed');
  });

  it('treats a failover as in progress rather than failed', () => {
    expect(getPhaseSeverity('Failing over')).toBe('progressing');
  });

  it('treats a switchover as in progress', () => {
    expect(getPhaseSeverity('Switchover in progress')).toBe('progressing');
  });

  it('treats initial primary setup as in progress', () => {
    expect(getPhaseSeverity('Setting up primary')).toBe('progressing');
  });

  it('reports unknown when no phase has been set', () => {
    expect(getPhaseSeverity(null)).toBe('unknown');
  });

  // A newer operator may introduce phases this build has never seen. Guessing
  // "healthy" would hide real problems, so unrecognised phases are unknown.
  it('reports unknown for a phase this plugin does not recognise', () => {
    expect(getPhaseSeverity('Reticulating splines')).toBe('unknown');
  });
});

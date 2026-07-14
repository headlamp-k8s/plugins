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
import type { AgentProgressCallback, AgentThinkingStep } from './types';

describe('agentTypes', () => {
  it('AgentThinkingStep has expected phases and statuses', () => {
    const step: AgentThinkingStep = {
      id: 1,
      label: 'Loading tools',
      status: 'running',
      timestamp: Date.now(),
      phase: 'init',
    };
    expect(step.phase).toBe('init');
    expect(step.status).toBe('running');
  });

  it('AgentProgressCallback receives an array of thinking steps', () => {
    const steps: AgentThinkingStep[] = [
      { id: 1, label: 'Step one', status: 'completed', timestamp: 1000, phase: 'planning' },
    ];
    const received: AgentThinkingStep[][] = [];
    const cb: AgentProgressCallback = s => received.push(s);
    cb(steps);
    expect(received).toHaveLength(1);
    expect(received[0][0].label).toBe('Step one');
  });
});

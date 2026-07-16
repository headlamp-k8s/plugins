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
import { resourceLinkInstructions } from './resourceLinkInstructions';

describe('resourceLinkInstructions', () => {
  describe('resourceLinkInstructions', () => {
    it('is a non-empty string', () => {
      expect(typeof resourceLinkInstructions).toBe('string');
      expect(resourceLinkInstructions.length).toBeGreaterThan(0);
    });

    it('contains resource linking instructions', () => {
      expect(resourceLinkInstructions).toContain('RESOURCE LINKING');
    });

    it('contains the headlamp resource-details link pattern', () => {
      expect(resourceLinkInstructions).toContain('headlamp/resource-details');
    });

    it('contains the headlamp cluster link pattern', () => {
      expect(resourceLinkInstructions).toContain('headlamp/cluster');
    });

    it('does not require window or browser APIs (is Node-safe)', () => {
      // This test just verifies the import works in a Node context (vitest)
      expect(resourceLinkInstructions).toBeDefined();
    });
  });
});

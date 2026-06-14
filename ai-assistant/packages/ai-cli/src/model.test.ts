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
import { makeNodeCommandRunner } from './model.js';

describe('makeNodeCommandRunner', () => {
  it('returns a function', () => {
    expect(typeof makeNodeCommandRunner()).toBe('function');
  });

  it('executes a command and returns stdout and exitCode 0', async () => {
    const runner = makeNodeCommandRunner();
    const result = await runner('echo', ['hello']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('hello');
  });

  it('returns exitCode 1 and empty stdout for a failing command', async () => {
    const runner = makeNodeCommandRunner();
    const result = await runner('false', []);
    expect(result.exitCode).not.toBe(0);
  });

  it('returns exitCode non-zero for a non-existent command', async () => {
    const runner = makeNodeCommandRunner();
    const result = await runner('this-command-does-not-exist-xyz', []);
    expect(result.exitCode).not.toBe(0);
  });
});

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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debugLog, detailLog, dumpForTestCase, verboseLog, warnLog } from './debugLog';

describe('debugLog', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debugLog is silent in test mode', () => {
    debugLog('tag', 'value');
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('detailLog is silent in test mode', () => {
    detailLog('tag', 'value');
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('verboseLog is silent in test mode', () => {
    verboseLog('tag', 'value');
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('warnLog is silent in test mode', () => {
    warnLog('tag', 'value');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('dumpForTestCase is silent in test mode', () => {
    dumpForTestCase('tag', 'raw', 'parsed');
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});

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

/**
 * Global vitest setup: suppress all console output during tests so that
 * expected debug/info/error messages from error-path tests don't pollute the
 * test output.
 *
 * Individual tests that need to assert on console calls can create their own
 * vi.spyOn(console, '...') — these override the global mock and are restored
 * by vi.restoreAllMocks() in afterEach.
 */

import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.spyOn(console, 'log').mockReturnValue(undefined);
  vi.spyOn(console, 'debug').mockReturnValue(undefined);
  vi.spyOn(console, 'info').mockReturnValue(undefined);
  vi.spyOn(console, 'warn').mockReturnValue(undefined);
  vi.spyOn(console, 'error').mockReturnValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

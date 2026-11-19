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

import { vi } from 'vitest';
import { REQUEST_TIMEOUT_MS, withTimeout } from './request';

/** An error a request fails with, standing in for an API error. */
class RequestError extends Error {
  constructor() {
    super('Forbidden');
    this.name = 'RequestError';
  }
}

/**
 * Builds a request that never answers.
 *
 * @returns A promise that never settles.
 */
function never(): Promise<never> {
  return new Promise(() => {});
}

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('gives the result of a request that answers in time', async () => {
    await expect(withTimeout(Promise.resolve('done'), 'reading')).resolves.toBe('done');
  });

  it('passes on the error of a request that fails in time', async () => {
    const error = new RequestError();

    await expect(withTimeout(Promise.reject(error), 'reading')).rejects.toBe(error);
  });

  it('fails with a timeout once the request has not answered for two minutes', async () => {
    const result = withTimeout(never(), 'reading CRD services.serving.knative.dev');
    const settled = vi.fn();
    result.catch(settled);

    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS - 1);
    expect(settled).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await expect(result).rejects.toThrow('Timed out reading CRD services.serving.knative.dev');
  });
});

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

import { errorDetail, getErrorMessage, isNotFoundError, wasRefused, withDetail } from './error';

describe('getErrorMessage', () => {
  it('returns the message from Error and API-like objects', () => {
    expect(getErrorMessage(new Error('Network error'))).toBe('Network error');
    expect(getErrorMessage({ message: 'Forbidden', status: 403 })).toBe('Forbidden');
  });

  it('uses a stable fallback when no message is available', () => {
    expect(getErrorMessage(undefined)).toBe('Unknown API error');
    expect(getErrorMessage({ message: undefined })).toBe('Unknown API error');
  });
});

describe('isNotFoundError', () => {
  it('recognizes only HTTP 404 errors', () => {
    expect(isNotFoundError({ status: 404 })).toBe(true);
    expect(isNotFoundError({ status: 403 })).toBe(false);
    expect(isNotFoundError(new Error('Network error'))).toBe(false);
  });
});

describe('errorDetail', () => {
  it('returns the trimmed message', () => {
    expect(errorDetail(new Error('  boom  '))).toBe('boom');
  });

  it('returns undefined when there is no usable message', () => {
    expect(errorDetail(undefined)).toBeUndefined();
    expect(errorDetail({})).toBeUndefined();
    expect(errorDetail(new Error('   '))).toBeUndefined();
  });
});

describe('withDetail', () => {
  it('appends the detail to the message', () => {
    expect(withDetail('Restart failed', 'boom')).toBe('Restart failed: boom');
  });

  it('returns the message alone when there is no detail', () => {
    expect(withDetail('Restart failed', undefined)).toBe('Restart failed');
  });
});

describe('wasRefused', () => {
  it('is true for 4xx statuses other than 408', () => {
    expect(wasRefused({ status: 400 })).toBe(true);
    expect(wasRefused({ status: 403 })).toBe(true);
    expect(wasRefused({ status: 409 })).toBe(true);
  });

  it('is false when the request may have been applied', () => {
    expect(wasRefused({ status: 408 })).toBe(false);
    expect(wasRefused({ status: 500 })).toBe(false);
    expect(wasRefused(new Error('Network error'))).toBe(false);
    expect(wasRefused(undefined)).toBe(false);
  });
});

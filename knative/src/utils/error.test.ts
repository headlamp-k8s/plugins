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

import { getErrorMessage, isNotFoundError } from './error';

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

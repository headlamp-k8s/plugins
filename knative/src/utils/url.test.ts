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

import { getSafeUrl } from './url';

describe('getSafeUrl', () => {
  it('should return undefined for falsy inputs', () => {
    expect(getSafeUrl()).toBeUndefined();
    expect(getSafeUrl('')).toBeUndefined();
  });

  it('should allow valid http and https urls', () => {
    expect(getSafeUrl('https://example.com')).toBe('https://example.com');
    expect(getSafeUrl('http://example.com/path?query=1')).toBe('http://example.com/path?query=1');
  });

  it('should reject unsafe protocols', () => {
    expect(getSafeUrl('javascript:alert(1)')).toBeUndefined();
    expect(getSafeUrl('data:text/html,<html>')).toBeUndefined();
    expect(getSafeUrl('file:///etc/passwd')).toBeUndefined();
    expect(getSafeUrl('ftp://example.com')).toBeUndefined();
  });

  it('should reject malformed or invalid urls', () => {
    expect(getSafeUrl('not a url')).toBeUndefined();
    expect(getSafeUrl('://missing-protocol')).toBeUndefined();
  });
});

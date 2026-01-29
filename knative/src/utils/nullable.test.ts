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

import { isNullable } from './nullable';

describe('isNullable', () => {
  it('should return true for null', () => {
    expect(isNullable(null)).toBe(true);
  });

  it('should return true for undefined', () => {
    expect(isNullable(undefined)).toBe(true);
  });

  it('should return false for false boolean', () => {
    expect(isNullable(false)).toBe(false);
  });

  it('should return false for zero number', () => {
    expect(isNullable(0)).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isNullable('')).toBe(false);
  });

  it('should return false for objects', () => {
    expect(isNullable({})).toBe(false);
  });

  it('should return false for arrays', () => {
    expect(isNullable([])).toBe(false);
  });
});

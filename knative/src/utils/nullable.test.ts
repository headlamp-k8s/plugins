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

  it('should return false for true boolean', () => {
    expect(isNullable(true)).toBe(false);
  });

  it('should return false for zero number', () => {
    expect(isNullable(0)).toBe(false);
  });

  it('should return false for positive number', () => {
    expect(isNullable(1)).toBe(false);
  });

  it('should return false for negative number', () => {
    expect(isNullable(-1)).toBe(false);
  });

  it('should return false for NaN', () => {
    expect(isNullable(NaN)).toBe(false);
  });

  it('should return false for Infinity', () => {
    expect(isNullable(Infinity)).toBe(false);
  });

  it('should return false for negative Infinity', () => {
    expect(isNullable(-Infinity)).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isNullable('')).toBe(false);
  });

  it('should return false for non-empty string', () => {
    expect(isNullable('hello')).toBe(false);
  });

  it('should return false for objects', () => {
    expect(isNullable({})).toBe(false);
  });

  it('should return false for non-empty objects', () => {
    expect(isNullable({ key: 'value' })).toBe(false);
  });

  it('should return false for nested objects', () => {
    expect(isNullable({ nested: { key: 'value' } })).toBe(false);
  });

  it('should return false for arrays', () => {
    expect(isNullable([])).toBe(false);
  });

  it('should return false for non-empty arrays', () => {
    expect(isNullable([1, 2, 3])).toBe(false);
  });

  it('should return false for array with null elements', () => {
    expect(isNullable([null, undefined])).toBe(false);
  });

  it('should return false for functions', () => {
    expect(isNullable(() => {})).toBe(false);
  });

  it('should return false for class instances', () => {
    class MyClass {}
    expect(isNullable(new MyClass())).toBe(false);
  });

  it('should return false for Date objects', () => {
    expect(isNullable(new Date())).toBe(false);
  });

  it('should return false for RegExp objects', () => {
    expect(isNullable(/test/)).toBe(false);
  });

  it('should return false for Symbol', () => {
    expect(isNullable(Symbol('test'))).toBe(false);
  });

  const assertNullableTypeGuard = (value: unknown) => {
    if (isNullable(value)) {
      // TypeScript should infer value as null | undefined here
      expect(value === null || value === undefined).toBe(true);
    } else {
      expect(value === null || value === undefined).toBe(false);
    }
  };

  it('should correctly type-guard null', () => {
    const value: unknown = null;
    assertNullableTypeGuard(value);
  });

  it('should correctly type-guard undefined', () => {
    const value: unknown = undefined;
    assertNullableTypeGuard(value);
  });

  it('should handle values with custom toString', () => {
    const obj = {
      toString() {
        return 'custom';
      }
    };
    expect(isNullable(obj)).toBe(false);
  });

  it('should handle values with custom valueOf', () => {
    const obj = {
      valueOf() {
        return 42;
      }
    };
    expect(isNullable(obj)).toBe(false);
  });

  it('should be deterministic', () => {
    expect(isNullable(null)).toBe(isNullable(null));
    expect(isNullable(undefined)).toBe(isNullable(undefined));
    expect(isNullable(0)).toBe(isNullable(0));
    expect(isNullable('')).toBe(isNullable(''));
  });
});

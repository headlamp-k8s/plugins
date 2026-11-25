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

import { describe, expect, test } from 'vitest';
import { effectiveEnforcementAction, isEnforcing } from './failureAction';
import type { KyvernoPolicySpec } from './kyvernoPolicy';

const rule = (failureAction?: string) => ({
  name: 'r',
  validate: failureAction ? { failureAction } : {},
});

describe('effectiveEnforcementAction', () => {
  test('reads a rule-level failureAction when the policy-wide field is unset', () => {
    expect(effectiveEnforcementAction({ rules: [rule('Enforce')] })).toBe('Enforce');
  });

  test('keeps the policy-wide action for rules that set none', () => {
    expect(
      effectiveEnforcementAction({ validationFailureAction: 'Enforce', rules: [rule()] })
    ).toBe('Enforce');
  });

  test('returns Mixed when validation rules disagree', () => {
    expect(effectiveEnforcementAction({ rules: [rule('Enforce'), rule('Audit')] })).toBe('Mixed');
    expect(
      effectiveEnforcementAction({
        validationFailureAction: 'Enforce',
        rules: [rule(), rule('Audit')],
      })
    ).toBe('Mixed');
  });

  test('treats lowercase actions as their capitalized form', () => {
    expect(
      effectiveEnforcementAction({ validationFailureAction: 'enforce', rules: [rule('Enforce')] })
    ).toBe('Enforce');
  });

  test('defaults to Audit with no validation rules', () => {
    expect(effectiveEnforcementAction({ rules: [{ name: 'm', mutate: {} }] })).toBe('Audit');
    expect(effectiveEnforcementAction(undefined)).toBe('Audit');
  });
});

describe('isEnforcing', () => {
  test('counts Enforce and Mixed policies as enforcing, Audit as not', () => {
    const specs: KyvernoPolicySpec[] = [
      { rules: [rule('Enforce')] },
      { validationFailureAction: 'Enforce', rules: [rule()] },
      { rules: [rule('Enforce'), rule('Audit')] },
      { rules: [rule('Audit')] },
    ];
    expect(specs.map(s => isEnforcing(effectiveEnforcementAction(s)))).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });
});

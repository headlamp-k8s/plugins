/*
 * Copyright 2026 The Kubernetes Authors
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
import { countPolicies } from './policyCounts';

describe('countPolicies', () => {
  test('counts a legacy policy by its policy-wide validationFailureAction', () => {
    expect(
      countPolicies({
        legacy: [
          { validationFailureAction: 'Enforce' },
          { validationFailureAction: 'Audit' },
          { validationFailureAction: 'Audit' },
        ],
      })
    ).toEqual({ total: 3, enforce: 1, audit: 2 });
  });

  test('counts the deprecated lowercase enforce as Enforce, as Kyverno does', () => {
    expect(
      countPolicies({
        legacy: [{ validationFailureAction: 'enforce' }, { validationFailureAction: 'audit' }],
      })
    ).toEqual({ total: 2, enforce: 1, audit: 1 });
  });

  test("counts a legacy policy as Enforce when any validate rule's failureAction is Enforce", () => {
    expect(
      countPolicies({
        legacy: [
          {
            rules: [
              { validate: { failureAction: 'Audit' } },
              { validate: { failureAction: 'Enforce' } },
            ],
          },
          { validationFailureAction: 'Audit', rules: [{ validate: { failureAction: 'Enforce' } }] },
          { rules: [{ validate: { failureAction: 'Audit' } }] },
        ],
      })
    ).toEqual({ total: 3, enforce: 2, audit: 1 });
  });

  test('a policy-wide Enforce counts even when the rules set Audit, as in HasValidateEnforce()', () => {
    expect(
      countPolicies({
        legacy: [
          { validationFailureAction: 'Enforce', rules: [{ validate: { failureAction: 'Audit' } }] },
        ],
      })
    ).toEqual({ total: 1, enforce: 1, audit: 0 });
  });

  test('a legacy policy that sets no failure action counts as Audit', () => {
    // Kyverno defaults validationFailureAction to Audit, and a rule without failureAction
    // follows it.
    expect(countPolicies({ legacy: [{}, { rules: [{ validate: {} }, {}] }] })).toEqual({
      total: 2,
      enforce: 0,
      audit: 2,
    });
  });

  test('counts CEL validating policies by their validationActions', () => {
    expect(
      countPolicies({
        validating: [
          { validationActions: ['Deny'] },
          { validationActions: ['Audit'] },
          { validationActions: ['Warn'] },
          { validationActions: ['Audit', 'Warn'] },
        ],
      })
    ).toEqual({ total: 4, enforce: 1, audit: 3 });
  });

  test('Deny wins when a policy also audits or warns', () => {
    expect(
      countPolicies({
        validating: [
          { validationActions: ['Audit', 'Deny'] },
          { validationActions: ['Deny', 'Warn'] },
        ],
      })
    ).toEqual({ total: 2, enforce: 2, audit: 0 });
  });

  test('an empty validationActions counts as Enforce, as Kyverno defaults it to Deny', () => {
    expect(
      countPolicies({
        validating: [{ validationActions: [] }, { validationActions: ['Audit'] }],
      })
    ).toEqual({ total: 2, enforce: 1, audit: 1 });
  });

  test('a missing validationActions counts as Enforce too', () => {
    // A raw spec without the field, unlike the resource getters, which already default it.
    expect(countPolicies({ validating: [{}, { validationActions: ['Warn'] }] })).toEqual({
      total: 2,
      enforce: 1,
      audit: 1,
    });
  });

  test('CEL kinds without a validation action only add to Total', () => {
    expect(countPolicies({ other: [{}, {}, {}] })).toEqual({ total: 3, enforce: 0, audit: 0 });
  });

  test('counts a cluster that only runs CEL policies (#1448)', () => {
    // Two ValidatingPolicies and an ImageValidatingPolicy in Audit, plus three MutatingPolicies.
    expect(
      countPolicies({
        validating: [
          { validationActions: ['Audit'] },
          { validationActions: ['Audit'] },
          { validationActions: ['Audit'] },
        ],
        other: [{}, {}, {}],
      })
    ).toEqual({ total: 6, enforce: 0, audit: 3 });
  });

  test('adds legacy and CEL policies together', () => {
    expect(
      countPolicies({
        legacy: [{ validationFailureAction: 'Enforce' }, { validationFailureAction: 'Audit' }],
        validating: [{ validationActions: ['Deny'] }, { validationActions: ['Audit'] }],
        other: [{}],
      })
    ).toEqual({ total: 5, enforce: 2, audit: 2 });
  });

  test('returns zeros when there are no policies', () => {
    expect(countPolicies({})).toEqual({ total: 0, enforce: 0, audit: 0 });
  });
});

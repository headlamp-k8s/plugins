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

import { describe, expect, it } from 'vitest';
import {
  cooldownPeriodOrDefault,
  jobBackoffLimitOrDefault,
  jobsHistoryLimitOrDefault,
} from './defaults';

describe('ScaledJob defaults', () => {
  it('uses the KEDA and Job defaults when the fields are not set', () => {
    expect(jobBackoffLimitOrDefault(undefined)).toBe(6);
    expect(jobsHistoryLimitOrDefault(undefined)).toBe(100);
  });

  it('keeps an explicit 0 instead of replacing it with the default', () => {
    expect(jobBackoffLimitOrDefault(0)).toBe(0);
    expect(jobsHistoryLimitOrDefault(0)).toBe(0);
  });

  it('keeps any other set value', () => {
    expect(jobBackoffLimitOrDefault(3)).toBe(3);
    expect(jobsHistoryLimitOrDefault(5)).toBe(5);
  });
});

describe('ScaledObject defaults', () => {
  it('uses the KEDA default cooldown period when it is not set', () => {
    expect(cooldownPeriodOrDefault(undefined)).toBe(300);
  });

  it('keeps an explicit cooldown period of 0', () => {
    expect(cooldownPeriodOrDefault(0)).toBe(0);
  });
});

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

import { describe, expect, it, vi } from 'vitest';
import { deliveryFormSection, isIsoDuration } from './deliveryFormSection';

const destinationFields = vi.hoisted(
  () => [] as { key: string; path: string; label: string; cluster: string; required?: boolean }[]
);

vi.mock('./DestinationField', () => ({
  destinationFormField: (options: (typeof destinationFields)[number]) => {
    destinationFields.push(options);
    return { ...options, validate: () => true };
  },
}));

describe('isIsoDuration', () => {
  it('accepts the durations Knative parses', () => {
    for (const text of ['PT0.2S', 'PT1S', 'PT30S', 'PT1M', 'P1D', 'P1DT2H', 'P1W', 'PT1,5S']) {
      expect(isIsoDuration(text)).toBe(true);
    }
    expect(isIsoDuration('P0')).toBe(true);
    expect(isIsoDuration('-PT1S')).toBe(true);
  });

  it('rejects text that is not such a duration', () => {
    for (const text of ['', '1s', 'P', 'PT', 'P1', 'PT1', 'PT1H2D', 'P1S', 'PT1S2M', 'PTS']) {
      expect(isIsoDuration(text)).toBe(false);
    }
  });

  it('rejects a duration of zero only when asked, reading one decimal place', () => {
    expect(isIsoDuration('PT0S')).toBe(true);
    expect(isIsoDuration('PT0S', true)).toBe(false);
    expect(isIsoDuration('P0', true)).toBe(false);
    expect(isIsoDuration('PT0.05S', true)).toBe(false);
    expect(isIsoDuration('PT0.1S', true)).toBe(true);
    expect(isIsoDuration('PT30S', true)).toBe(true);
  });
});

describe('deliveryFormSection', () => {
  const section = deliveryFormSection('cluster-a');
  const field = (key: string) => section.fields.find(candidate => candidate.key === key);

  it('writes every field under spec.delivery', () => {
    expect(section.title).toBe('Delivery');
    expect(section.fields.map(({ key, path }) => [key, path])).toEqual([
      ['deadLetterSink', 'spec.delivery.deadLetterSink'],
      ['retry', 'spec.delivery.retry'],
      ['backoffPolicy', 'spec.delivery.backoffPolicy'],
      ['backoffDelay', 'spec.delivery.backoffDelay'],
      ['timeout', 'spec.delivery.timeout'],
    ]);
  });

  it('makes the dead letter sink an optional destination in the given cluster', () => {
    expect(destinationFields).toContainEqual(
      expect.objectContaining({
        path: 'spec.delivery.deadLetterSink',
        label: 'Dead letter sink',
        cluster: 'cluster-a',
      })
    );
    expect(destinationFields[0].required).toBeUndefined();
  });

  it('takes whole retries from zero, and the two backoff policies or none', () => {
    expect(field('retry')).toMatchObject({ type: 'number', min: 0 });
    expect(field('backoffPolicy')?.options?.map(option => option.value)).toEqual([
      '',
      'linear',
      'exponential',
    ]);
  });

  it('takes no retry count, or a whole number of zero or more', () => {
    const validate = field('retry')?.validate;
    expect(validate?.(undefined, {})).toBe(true);
    expect(validate?.(null, {})).toBe(true);
    expect(validate?.(0, {})).toBe(true);
    expect(validate?.(3, {})).toBe(true);
    expect(validate?.(2147483647, {})).toBe(true);
    expect(validate?.(2147483648, {})).toBe(false);
    expect(validate?.(-1, {})).toBe(false);
    expect(validate?.(1.5, {})).toBe(false);
    expect(validate?.('3', {})).toBe(false);
  });

  it('takes no backoff policy, linear or exponential', () => {
    const validate = field('backoffPolicy')?.validate;
    expect(validate?.(undefined, {})).toBe(true);
    expect(validate?.('linear', {})).toBe(true);
    expect(validate?.('exponential', {})).toBe(true);
    expect(validate?.('Linear', {})).toBe(false);
    expect(validate?.('', {})).toBe(false);
  });

  it('takes no backoff delay or a valid one, but not an empty string, which Knative rejects', () => {
    const validate = field('backoffDelay')?.validate;
    expect(validate?.(undefined, {})).toBe(true);
    expect(validate?.(null, {})).toBe(true);
    expect(validate?.('', {})).toBe(false);
    expect(validate?.('PT0.2S', {})).toBe(true);
    expect(validate?.('PT0S', {})).toBe(true);
    expect(validate?.('200ms', {})).toBe(false);
    expect(validate?.(2, {})).toBe(false);
  });

  it('takes no timeout or one greater than zero', () => {
    const validate = field('timeout')?.validate;
    expect(validate?.(undefined, {})).toBe(true);
    expect(validate?.('', {})).toBe(false);
    expect(validate?.('PT30S', {})).toBe(true);
    expect(validate?.('PT0S', {})).toBe(false);
    expect(validate?.('30s', {})).toBe(false);
  });
});

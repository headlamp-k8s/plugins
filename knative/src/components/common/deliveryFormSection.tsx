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

import type { FormSection } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { isNullable } from '../../utils/nullable';
import { destinationFormField } from './DestinationField';

const NUMBER = String.raw`(\d+(?:[.,]\d+)?)`;

const ISO_DURATION = new RegExp(
  String.raw`^[-+]?P(?=\d|T\d)` +
    `(?:${NUMBER}Y)?(?:${NUMBER}M)?(?:${NUMBER}W)?(?:${NUMBER}D)?` +
    `(?:T(?:${NUMBER}H)?(?:${NUMBER}M)?(?:${NUMBER}S)?)?$`
);

/**
 * Tells whether text is an ISO 8601 duration that Knative's parser accepts, such as `PT0.2S`
 * or `P1DT2H`.
 *
 * @param text - The text.
 * @param nonZero - Whether a duration of zero is rejected, as Knative does for a timeout. Like
 * Knative, it reads one decimal place, so `PT0.05S` is zero.
 * @returns True when the text is such a duration.
 */
export function isIsoDuration(text: string, nonZero = false): boolean {
  if (text === 'P0') {
    return !nonZero;
  }
  const match = ISO_DURATION.exec(text);
  if (!match) {
    return false;
  }
  return (
    !nonZero ||
    match
      .slice(1)
      .some(part => part !== undefined && /[1-9]/.test(part.replace(/[.,](\d).*/, '$1')))
  );
}

/**
 * Builds a check for an optional duration field: a missing value passes, anything else must be a
 * duration.
 *
 * @param nonZero - Whether a duration of zero is rejected.
 * @returns The check, for a form field's `validate`.
 */
function optionalDuration(nonZero: boolean): (value: unknown) => boolean {
  return value => isNullable(value) || (typeof value === 'string' && isIsoDuration(value, nonZero));
}

const MAX_INT32 = 2_147_483_647;

/**
 * Tells whether a retry count is one Knative accepts, which it reads as a 32-bit integer.
 *
 * @param value - The count as the resource holds it.
 * @returns True when it is missing, or a whole number from zero to 2147483647.
 */
export function isValidRetry(value: unknown): boolean {
  return (
    isNullable(value) ||
    (Number.isInteger(value) && Number(value) >= 0 && Number(value) <= MAX_INT32)
  );
}

/**
 * Tells whether a backoff policy is one Knative accepts.
 *
 * @param value - The policy as the resource holds it.
 * @returns True when it is missing, `linear` or `exponential`.
 */
export function isValidBackoffPolicy(value: unknown): boolean {
  return isNullable(value) || value === 'linear' || value === 'exponential';
}

/**
 * Builds the Delivery section of a create form: the dead letter sink, retries and backoff, and the
 * timeout of each attempt, which are the delivery settings `kn` offers and Knative enables by
 * default. Other settings, such as `backoffMax` and `retryAfterMax`, which need features that are
 * off by default, are left to the YAML editor.
 *
 * @param cluster - The cluster whose objects the dead letter sink offers.
 * @returns The section, writing to `spec.delivery`.
 */
export function deliveryFormSection(cluster: string): FormSection {
  return {
    title: 'Delivery',
    fields: [
      destinationFormField({
        key: 'deadLetterSink',
        path: 'spec.delivery.deadLetterSink',
        label: 'Dead letter sink',
        cluster,
        helperText: 'Where events go that could not be delivered after the retries.',
      }),
      {
        key: 'retry',
        path: 'spec.delivery.retry',
        label: 'Retries',
        type: 'number',
        min: 0,
        validate: isValidRetry,
        helperText: 'The minimum number of retries before an event goes to the dead letter sink.',
      },
      {
        key: 'backoffPolicy',
        path: 'spec.delivery.backoffPolicy',
        label: 'Backoff policy',
        type: 'select',
        options: [
          { value: '', label: 'Not set' },
          { value: 'linear', label: 'linear' },
          { value: 'exponential', label: 'exponential' },
        ],
        validate: isValidBackoffPolicy,
        helperText:
          'How the delay grows between retries: linear is the delay times the retry number, ' +
          'exponential is the delay times two to the power of the retry number.',
      },
      {
        key: 'backoffDelay',
        path: 'spec.delivery.backoffDelay',
        label: 'Backoff delay',
        validate: optionalDuration(false),
        helperText: 'The delay before retrying, as an ISO 8601 duration such as PT0.2S.',
      },
      {
        key: 'timeout',
        path: 'spec.delivery.timeout',
        label: 'Timeout',
        validate: optionalDuration(true),
        helperText:
          'The timeout of each delivery attempt, as an ISO 8601 duration greater than zero, ' +
          "such as PT30S. Needs Knative's delivery-timeout feature, which is on by default.",
      },
    ],
  };
}

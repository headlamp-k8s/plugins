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

import { render } from '@testing-library/react';
import { vi } from 'vitest';

const destinations = vi.hoisted(() => [] as unknown[]);

vi.mock('./DestinationLink', () => ({
  DestinationLink: (props: unknown) => {
    destinations.push(props);
    return null;
  },
}));

vi.mock('./ResourceListCells', () => ({
  TextValue: ({ value }: { value?: string | number }) => <>{value ?? '-'}</>,
}));

import { getDeliveryRows } from './DeliveryRows';

describe('getDeliveryRows', () => {
  beforeEach(() => {
    destinations.length = 0;
  });

  it('shows every delivery setting as it is written', () => {
    const deadLetterSink = { ref: { apiVersion: 'v1', kind: 'Service', name: 'dlq' } };
    const rows = getDeliveryRows(
      {
        retry: 4,
        backoffPolicy: 'exponential',
        backoffDelay: 'PT1S',
        timeout: 'PT10S',
        retryAfterMax: 'PT30S',
        format: 'json',
        deadLetterSink,
      },
      'http://dlq.orders.svc',
      'orders',
      'cluster-a'
    );
    const { container } = render(
      <>
        {rows.map(row => (
          <p key={String(row.name)}>{row.value}</p>
        ))}
      </>
    );

    expect(rows.map(row => [row.name, row.hide])).toEqual([
      ['Retry', false],
      ['Backoff Policy', false],
      ['Backoff Delay', false],
      ['Timeout', false],
      ['Retry-After Max', false],
      ['Format', false],
      ['Dead Letter Sink', false],
      ['Dead Letter Sink URI', false],
    ]);
    expect([...container.querySelectorAll('p')].map(p => p.textContent)).toEqual([
      '4',
      'exponential',
      'PT1S',
      'PT10S',
      'PT30S',
      'json',
      '',
      'http://dlq.orders.svc',
    ]);
    expect(destinations).toEqual([
      { destination: deadLetterSink, namespace: 'orders', cluster: 'cluster-a' },
    ]);
  });

  it('hides the settings that are not set, and keeps a retry of 0', () => {
    expect(
      getDeliveryRows({ retry: 0 }, undefined, 'orders', 'cluster-a')
        .filter(row => !row.hide)
        .map(row => row.name)
    ).toEqual(['Retry']);
    expect(
      getDeliveryRows(undefined, undefined, 'orders', 'cluster-a').every(row => row.hide)
    ).toBe(true);
  });
});

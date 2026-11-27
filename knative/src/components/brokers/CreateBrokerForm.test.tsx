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

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { brokerFormSections } from './CreateBrokerForm';

const CLASS = 'eventing.knative.dev/broker.class';

const recorded = vi.hoisted(() => ({
  deliveryClusters: [] as string[],
}));

vi.mock('../common/deliveryFormSection', () => ({
  deliveryFormSection: (cluster: string) => {
    recorded.deliveryClusters.push(cluster);
    return { title: 'Delivery', fields: [] };
  },
}));

vi.mock('../../resources/knative/eventingData', () => ({
  BROKER_CLASS_ANNOTATION: 'eventing.knative.dev/broker.class',
}));

/**
 * Renders the class field of the Broker form under StrictMode.
 *
 * @param value - The annotations the field starts from.
 * @returns The changes the field reported, newest last.
 */
function renderClassField(value: unknown) {
  const changes: unknown[] = [];
  const field = brokerFormSections('cluster-a')[1].fields[0];
  render(
    <React.StrictMode>
      {field.render?.({ value, onChange: next => changes.push(next), resource: {} })}
    </React.StrictMode>
  );
  return changes;
}

beforeEach(() => {
  recorded.deliveryClusters = [];
});

describe('brokerFormSections', () => {
  it('asks for metadata, the class, and delivery settings in the given cluster', () => {
    const sections = brokerFormSections('cluster-b');
    expect(sections.map(section => section.title)).toEqual(['Metadata', 'Broker', 'Delivery']);
    expect(sections[1].fields.map(({ key, path }) => [key, path])).toEqual([
      ['class', 'metadata.annotations'],
    ]);
    expect(recorded.deliveryClusters).toEqual(['cluster-b']);
  });
});

describe('the class field', () => {
  it("offers the classes of Knative's own Brokers", () => {
    renderClassField(undefined);
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Class' }));
    expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual([
      'MTChannelBasedBroker',
      'Kafka',
      'KafkaNamespaced',
    ]);
  });

  it('writes a picked or typed class, and keeps the other annotations', () => {
    const changes = renderClassField({ team: 'shop' });
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Class' }));
    fireEvent.click(screen.getByRole('option', { name: 'Kafka' }));
    expect(changes[changes.length - 1]).toEqual({ team: 'shop', [CLASS]: 'Kafka' });

    fireEvent.change(screen.getByRole('combobox', { name: 'Class' }), {
      target: { value: 'RabbitMQBroker' },
    });
    expect(changes[changes.length - 1]).toEqual({ team: 'shop', [CLASS]: 'RabbitMQBroker' });
  });

  it('shows the class from the YAML', () => {
    renderClassField({ [CLASS]: 'MTChannelBasedBroker' });
    expect(screen.getByDisplayValue('MTChannelBasedBroker').getAttribute('aria-label')).toBe(
      'Class'
    );
  });

  it('removes a cleared class, and the annotations when nothing else is left', () => {
    let changes = renderClassField({ team: 'shop', [CLASS]: 'Kafka' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Class' }), { target: { value: '' } });
    expect(changes[changes.length - 1]).toEqual({ team: 'shop' });

    document.body.innerHTML = '';
    changes = renderClassField({ [CLASS]: 'Kafka' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Class' }), { target: { value: '' } });
    expect(changes[changes.length - 1]).toBeUndefined();
  });
});

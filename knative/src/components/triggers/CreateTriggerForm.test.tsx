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

import { TextField, type TextFieldProps } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KnativeBroker } from '../../resources/knative';
import { namesOneBroker, triggerFormSections } from './CreateTriggerForm';
import { isValidFilter } from './FilterAttributesField';

const recorded = vi.hoisted(() => ({
  deliveryClusters: [] as string[],
  destinations: [] as { key: string; path: string; cluster: string; required?: boolean }[],
  nameFields: [] as {
    resourceClass: unknown;
    namespace: string;
    cluster: string;
    label: string;
    onChange: (name: string) => void;
  }[],
  filterFields: [] as { value: unknown; onChange: (filter: unknown) => void }[],
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  FormTextField: (props: TextFieldProps) => <TextField {...props} />,
}));

vi.mock('../../resources/knative', () => ({ KnativeBroker: class {} }));

vi.mock('../common/ResourceNameField', () => ({
  ResourceNameField: (props: (typeof recorded.nameFields)[number]) => {
    recorded.nameFields.push(props);
    return <div>{`Brokers in ${props.namespace}`}</div>;
  },
}));

vi.mock('../common/DestinationField', () => ({
  destinationFormField: (options: (typeof recorded.destinations)[number]) => {
    recorded.destinations.push(options);
    return options;
  },
}));

vi.mock('../common/deliveryFormSection', () => ({
  deliveryFormSection: (cluster: string) => {
    recorded.deliveryClusters.push(cluster);
    return { title: 'Delivery', fields: [] };
  },
}));

vi.mock('./FilterAttributesField', () => ({
  FilterAttributesField: (props: (typeof recorded.filterFields)[number]) => {
    recorded.filterFields.push(props);
    return null;
  },
  isValidFilter: () => true,
}));

/**
 * Finds a field of the Trigger section.
 *
 * @param key - The field's key.
 * @param cluster - The cluster the sections are built for.
 * @returns The field, or undefined when the section has no field with that key.
 */
function triggerField(key: string, cluster = 'cluster-a') {
  return triggerFormSections(cluster)[1].fields.find(candidate => candidate.key === key);
}

beforeEach(() => {
  recorded.deliveryClusters = [];
  recorded.destinations = [];
  recorded.nameFields = [];
  recorded.filterFields = [];
});

describe('namesOneBroker', () => {
  it('reads a null spec.brokerRef as missing, as Knative does', () => {
    expect(namesOneBroker('default', { spec: { brokerRef: null } })).toBe(true);
  });

  it('needs exactly one of spec.broker and spec.brokerRef', () => {
    expect(namesOneBroker('default', {})).toBe(true);
    expect(namesOneBroker(undefined, { spec: { brokerRef: { name: 'default' } } })).toBe(true);
    expect(namesOneBroker('', {})).toBe(false);
    expect(namesOneBroker(undefined, { spec: {} })).toBe(false);
    expect(namesOneBroker('default', { spec: { brokerRef: { name: 'default' } } })).toBe(false);
  });
});

describe('triggerFormSections', () => {
  it('asks for metadata, the Trigger, and delivery settings in the given cluster', () => {
    const sections = triggerFormSections('cluster-b');
    expect(sections.map(section => section.title)).toEqual(['Metadata', 'Trigger', 'Delivery']);
    expect(sections[1].fields.map(({ key, path }) => [key, path])).toEqual([
      ['broker', 'spec.broker'],
      ['filter', 'spec.filter'],
      ['subscriber', 'spec.subscriber'],
    ]);
    expect(recorded.deliveryClusters).toEqual(['cluster-b']);
  });

  it('needs a Broker, named once', () => {
    const broker = triggerField('broker');
    expect(broker?.required).toBe(true);
    expect(broker?.validate).toBe(namesOneBroker);
  });

  it('checks the filter with the filter rules', () => {
    expect(triggerField('filter')?.validate).toBe(isValidFilter);
  });

  it('needs a subscriber in the given cluster', () => {
    triggerField('subscriber', 'cluster-b');
    expect(recorded.destinations).toContainEqual(
      expect.objectContaining({
        key: 'subscriber',
        path: 'spec.subscriber',
        cluster: 'cluster-b',
        required: true,
      })
    );
  });
});

describe('the Broker field', () => {
  it("offers the Brokers of the Trigger's namespace in the given cluster", () => {
    const changes: unknown[] = [];
    render(
      <React.StrictMode>
        {triggerField('broker', 'cluster-b')?.render?.({
          value: 'default',
          onChange: next => changes.push(next),
          resource: { metadata: { namespace: 'shop' } },
        })}
      </React.StrictMode>
    );
    expect(screen.queryByText('Brokers in shop')).not.toBeNull();
    expect(recorded.nameFields[0]).toMatchObject({
      resourceClass: KnativeBroker,
      namespace: 'shop',
      cluster: 'cluster-b',
      value: 'default',
      label: 'Broker',
    });
    recorded.nameFields[0].onChange('orders');
    expect(changes).toEqual(['orders']);
  });

  it('takes a typed name before the namespace is set', () => {
    const changes: unknown[] = [];
    render(
      <React.StrictMode>
        {triggerField('broker')?.render?.({
          value: undefined,
          onChange: next => changes.push(next),
          resource: {},
        })}
      </React.StrictMode>
    );
    expect(recorded.nameFields).toEqual([]);
    fireEvent.change(screen.getByLabelText('Broker'), { target: { value: 'default' } });
    expect(changes).toEqual(['default']);
  });
});

describe('the filter field', () => {
  it("edits the Trigger's filter", () => {
    const filter = { attributes: { type: 'dev.knative.order' } };
    const changes: unknown[] = [];
    render(
      <React.StrictMode>
        {triggerField('filter')?.render?.({
          value: filter,
          onChange: next => changes.push(next),
          resource: {},
        })}
      </React.StrictMode>
    );
    expect(recorded.filterFields[0].value).toBe(filter);
    recorded.filterFields[0].onChange({ attributes: { type: 'dev.knative.refund' } });
    expect(changes).toEqual([{ attributes: { type: 'dev.knative.refund' } }]);
  });
});

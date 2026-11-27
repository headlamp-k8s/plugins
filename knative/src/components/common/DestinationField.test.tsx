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
import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DestinationField,
  type DestinationFieldProps,
  destinationFormField,
  isValidDestination,
} from './DestinationField';

/** What one list of a kind answers in the test. */
interface ListAnswer {
  /** The listed objects, or null before they load. */
  items: { metadata: { name: string } }[] | null;
  /** The errors of the list, or null without errors. */
  errors: { message: string }[] | null;
}

const lists = vi.hoisted(() => {
  const state = {
    calls: [] as { kind: string; namespace?: string; cluster?: string }[],
    answers: {} as Record<string, ListAnswer>,
  };
  /**
   * Makes a resource class double whose `useList` records its options and answers from the state.
   *
   * @param kind - The `apiVersion/kind` the class lists.
   * @param useMemo - React's `useMemo`, so that the double calls a hook like the real one.
   * @returns The class double.
   */
  function listClass(kind: string, useMemo: <T>(make: () => T, deps: unknown[]) => T) {
    return class {
      static useList(options: { namespace?: string; cluster?: string }) {
        state.calls.push({ kind, ...options });
        const answer = state.answers[kind] ?? { items: [], errors: null };
        return useMemo(() => answer, [answer]);
      }
    };
  }
  return { state, listClass };
});

vi.mock('@kinvolk/headlamp-plugin/lib', async () => {
  const { useMemo } = await vi.importActual<typeof import('react')>('react');
  return { K8s: { ResourceClasses: { Service: lists.listClass('v1/Service', useMemo) } } };
});

vi.mock('../../resources/knative', async () => {
  const { useMemo } = await vi.importActual<typeof import('react')>('react');
  return {
    KService: lists.listClass('serving.knative.dev/v1/Service', useMemo),
    KnativeBroker: lists.listClass('eventing.knative.dev/v1/Broker', useMemo),
    KnativeChannel: lists.listClass('messaging.knative.dev/v1/Channel', useMemo),
  };
});

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  FormTextField: (props: TextFieldProps) => (
    <TextField variant="outlined" size="small" fullWidth {...props} />
  ),
}));

/**
 * Renders a destination field under StrictMode that keeps its own value, like the form does.
 *
 * @param props - The field's props apart from the value handling.
 * @returns The changes the field reported, newest last.
 */
function renderField(
  props: Partial<Omit<DestinationFieldProps, 'onChange'>> & { value?: unknown } = {}
) {
  const changes: unknown[] = [];

  /**
   * Holds the destination in state and passes every change on to the record.
   *
   * @returns The field.
   */
  function Harness() {
    const [value, setValue] = React.useState<unknown>(props.value);
    return (
      <DestinationField
        namespace="shop"
        cluster="cluster-a"
        label="Subscriber"
        {...props}
        value={value}
        onChange={next => {
          changes.push(next);
          setValue(next);
        }}
      />
    );
  }

  render(
    <React.StrictMode>
      <Harness />
    </React.StrictMode>
  );
  return changes;
}

/**
 * Picks an option of the target select.
 *
 * @param option - The option's label.
 */
function chooseTarget(option: string) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: /^Type/ }));
  fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }));
}

beforeEach(() => {
  lists.state.calls = [];
  lists.state.answers = {};
});

describe('isValidDestination', () => {
  it('needs a destination unless it is optional', () => {
    expect(isValidDestination(undefined, false)).toBe(false);
    expect(isValidDestination(undefined, true)).toBe(true);
    expect(isValidDestination(null, true)).toBe(true);
  });

  it('needs an API version, kind and name in a reference', () => {
    const ref = { apiVersion: 'serving.knative.dev/v1', kind: 'Service', name: 'display' };
    expect(isValidDestination({ ref }, false)).toBe(true);
    expect(isValidDestination({ ref: { ...ref, name: '' } }, true)).toBe(false);
    expect(isValidDestination({ ref: { kind: 'Service', name: 'display' } }, false)).toBe(false);
    expect(isValidDestination({ ref: { apiVersion: 'v1', name: 'display' } }, false)).toBe(false);
  });

  it('lets a relative URI extend a reference, but not an absolute one', () => {
    const ref = { apiVersion: 'v1', kind: 'Service', name: 'display' };
    expect(isValidDestination({ ref, uri: '/events' }, false)).toBe(true);
    expect(isValidDestination({ ref, uri: 'https://example.com' }, false)).toBe(false);
    expect(isValidDestination({ ref, uri: 'mailto:ops@example.com' }, false)).toBe(false);
  });

  it("needs either URI to be one that Go's net/url can read", () => {
    const ref = { apiVersion: 'v1', kind: 'Service', name: 'display' };
    expect(isValidDestination({ ref, uri: '/events/%zz' }, false)).toBe(false);
    expect(isValidDestination({ ref, uri: '8080:x/events' }, false)).toBe(false);
    expect(isValidDestination({ ref, uri: '/events\n' }, false)).toBe(false);
    expect(isValidDestination({ ref, uri: '/events?id=%zz' }, false)).toBe(true);
    expect(isValidDestination({ uri: 'https://example.com/%zz' }, false)).toBe(false);
    expect(isValidDestination({ uri: 'https://exa{mple.com/events' }, false)).toBe(false);
  });

  it('needs an absolute URI with a host without a reference', () => {
    expect(isValidDestination({ uri: 'https://example.com/events' }, false)).toBe(true);
    expect(isValidDestination({ ref: null, uri: 'https://example.com/events' }, false)).toBe(true);
    expect(isValidDestination({ uri: '/events' }, false)).toBe(false);
    expect(isValidDestination({ uri: '' }, true)).toBe(false);
    expect(isValidDestination({}, true)).toBe(false);
  });
});

describe('DestinationField', () => {
  it('offers the kinds that kn offers, and a URL, but no empty choice when required', () => {
    renderField();
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /^Type/ }));
    expect(
      within(screen.getByRole('listbox'))
        .getAllByRole('option')
        .map(option => option.textContent)
    ).toEqual(['Knative Service', 'Kubernetes Service', 'Broker', 'Channel', 'URL']);
  });

  it("labels its inputs in their outlines, like the rows of Headlamp's forms", () => {
    renderField({ value: { ref: { apiVersion: 'v1', kind: 'Service' } } });
    expect(screen.queryByText('Type', { selector: 'label' })).not.toBeNull();
    expect(screen.queryByText('Name', { selector: 'label' })).not.toBeNull();
    chooseTarget('URL');
    expect(screen.queryByText('URL', { selector: 'label' })).not.toBeNull();
  });

  it('offers Not set when optional, which removes the destination', () => {
    const changes = renderField({ optional: true, value: { uri: 'https://example.com' } });
    chooseTarget('Not set');
    expect(changes).toEqual([undefined]);
  });

  it('points to the chosen kind, and keeps the fields it does not show', () => {
    const changes = renderField({ value: { uri: 'https://example.com', audience: 'display' } });
    chooseTarget('Knative Service');
    expect(changes[changes.length - 1]).toEqual({
      audience: 'display',
      ref: { apiVersion: 'serving.knative.dev/v1', kind: 'Service' },
    });
  });

  it("keeps the reference's namespace when another kind is chosen", () => {
    const changes = renderField({
      value: { ref: { apiVersion: 'v1', kind: 'Service', name: 'web', namespace: 'payments' } },
    });
    chooseTarget('Broker');
    expect(changes[changes.length - 1]).toEqual({
      ref: { apiVersion: 'eventing.knative.dev/v1', kind: 'Broker', namespace: 'payments' },
    });
  });

  it('flags a URL whose percent escapes cannot be decoded', () => {
    renderField({ value: { uri: 'https://example.com/%zz' } });
    expect(
      screen.queryByText('Enter a valid absolute URL, such as https://example.com/events.')
    ).not.toBeNull();
  });

  it('points to a Channel in the messaging API group', () => {
    const changes = renderField();
    chooseTarget('Channel');
    expect(changes[changes.length - 1]).toEqual({
      ref: { apiVersion: 'messaging.knative.dev/v1', kind: 'Channel' },
    });
  });

  it("offers the names of the kind's objects in the namespace and cluster", () => {
    lists.state.answers['v1/Service'] = {
      items: [{ metadata: { name: 'web' } }, { metadata: { name: 'api' } }],
      errors: null,
    };
    const changes = renderField({ value: { ref: { apiVersion: 'v1', kind: 'Service' } } });
    expect(lists.state.calls).toContainEqual({
      kind: 'v1/Service',
      namespace: 'shop',
      cluster: 'cluster-a',
    });
    expect(lists.state.calls.every(call => call.kind === 'v1/Service')).toBe(true);

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Subscriber name' }));
    expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual(['api', 'web']);
    fireEvent.click(screen.getByRole('option', { name: 'web' }));
    expect(changes[changes.length - 1]).toEqual({
      ref: { apiVersion: 'v1', kind: 'Service', name: 'web' },
    });
  });

  it('takes a typed name, and shows why the names could not be listed', () => {
    lists.state.answers['eventing.knative.dev/v1/Broker'] = {
      items: null,
      errors: [{ message: 'brokers is forbidden' }],
    };
    const changes = renderField({
      value: { ref: { apiVersion: 'eventing.knative.dev/v1', kind: 'Broker' } },
    });
    expect(screen.queryByText('Could not list them: brokers is forbidden')).not.toBeNull();
    fireEvent.change(screen.getByRole('combobox', { name: 'Subscriber name' }), {
      target: { value: 'default' },
    });
    expect(changes[changes.length - 1]).toEqual({
      ref: { apiVersion: 'eventing.knative.dev/v1', kind: 'Broker', name: 'default' },
    });
  });

  it('writes a URL instead of a reference, and flags one that is not absolute', () => {
    const changes = renderField({
      value: { ref: { apiVersion: 'v1', kind: 'Service', name: 'web' } },
    });
    chooseTarget('URL');
    expect(changes[changes.length - 1]).toEqual({ uri: '' });

    fireEvent.change(screen.getByLabelText('Subscriber URL'), { target: { value: '/events' } });
    expect(changes[changes.length - 1]).toEqual({ uri: '/events' });
    expect(
      screen.queryByText('Enter a valid absolute URL, such as https://example.com/events.')
    ).not.toBeNull();

    fireEvent.change(screen.getByLabelText('Subscriber URL'), {
      target: { value: 'https://example.com/events' },
    });
    expect(
      screen.queryByText('Enter a valid absolute URL, such as https://example.com/events.')
    ).toBeNull();
  });

  it('keeps a reference to another kind from the YAML, and takes its name as typed', () => {
    const ref = { apiVersion: 'eventing.knative.dev/v1alpha1', kind: 'KafkaSink' };
    const changes = renderField({ value: { ref } });
    expect(screen.getByRole('combobox', { name: /^Type/ }).textContent).toBe(
      'KafkaSink (eventing.knative.dev/v1alpha1)'
    );
    fireEvent.change(screen.getByLabelText('Subscriber name'), { target: { value: 'orders' } });
    expect(changes[changes.length - 1]).toEqual({ ref: { ...ref, name: 'orders' } });
    expect(lists.state.calls).toEqual([]);
  });

  it("offers the names in the reference's own namespace, and keeps it", () => {
    lists.state.answers['v1/Service'] = { items: [{ metadata: { name: 'ledger' } }], errors: null };
    const ref = { apiVersion: 'v1', kind: 'Service', namespace: 'payments' };
    const changes = renderField({ value: { ref } });
    expect(lists.state.calls).toContainEqual({
      kind: 'v1/Service',
      namespace: 'payments',
      cluster: 'cluster-a',
    });
    expect(lists.state.calls.every(call => call.namespace === 'payments')).toBe(true);

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Subscriber name' }));
    fireEvent.click(screen.getByRole('option', { name: 'ledger' }));
    expect(changes[changes.length - 1]).toEqual({ ref: { ...ref, name: 'ledger' } });
  });

  it("lists the names in the reference's namespace before the resource has one", () => {
    renderField({
      namespace: '',
      value: { ref: { apiVersion: 'v1', kind: 'Service', namespace: 'payments' } },
    });
    expect(lists.state.calls).toContainEqual({
      kind: 'v1/Service',
      namespace: 'payments',
      cluster: 'cluster-a',
    });
  });

  it('does not list names before the resource has a namespace', () => {
    renderField({ namespace: '', value: { ref: { apiVersion: 'v1', kind: 'Service' } } });
    expect(lists.state.calls).toEqual([]);
    expect(screen.getByLabelText('Subscriber name').getAttribute('role')).toBeNull();
  });

  it('removes the name from the reference when it is cleared', () => {
    const changes = renderField({
      namespace: '',
      value: { ref: { apiVersion: 'v1', kind: 'Service', name: 'web' } },
    });
    fireEvent.change(screen.getByLabelText('Subscriber name'), { target: { value: '' } });
    expect(changes[changes.length - 1]).toEqual({ ref: { apiVersion: 'v1', kind: 'Service' } });
  });
});

describe('destinationFormField', () => {
  it('is valid only for a destination Knative accepts', () => {
    const required = destinationFormField({
      key: 'subscriber',
      path: 'spec.subscriber',
      label: 'Subscriber',
      cluster: 'cluster-a',
      required: true,
    });
    const optional = destinationFormField({
      key: 'dls',
      path: 'spec.delivery.deadLetterSink',
      label: 'Dead letter sink',
      cluster: 'cluster-a',
    });
    expect(required).toMatchObject({ key: 'subscriber', path: 'spec.subscriber', required: true });
    expect(optional.required).toBe(false);
    expect(required.validate?.(undefined, {})).toBe(false);
    expect(optional.validate?.(undefined, {})).toBe(true);
    expect(optional.validate?.({ uri: '/events' }, {})).toBe(false);
  });

  it('offers Not set only when the destination is optional', () => {
    for (const required of [true, false]) {
      const field = destinationFormField({
        key: 'dls',
        path: 'spec.delivery.deadLetterSink',
        label: 'Dead letter sink',
        cluster: 'cluster-a',
        required,
      });
      const { unmount } = render(
        <>{field.render?.({ value: undefined, onChange: () => {}, resource: {} })}</>
      );
      fireEvent.mouseDown(screen.getByRole('combobox', { name: /^Type/ }));
      expect(screen.queryByRole('option', { name: 'Not set' }) === null).toBe(required);
      unmount();
    }
  });

  it("looks up names in the resource's namespace and the given cluster", () => {
    const field = destinationFormField({
      key: 'subscriber',
      path: 'spec.subscriber',
      label: 'Subscriber',
      cluster: 'cluster-b',
      required: true,
    });
    render(
      <React.StrictMode>
        {field.render?.({
          value: { ref: { apiVersion: 'eventing.knative.dev/v1', kind: 'Broker' } },
          onChange: () => {},
          resource: { metadata: { namespace: 'billing' } },
        })}
      </React.StrictMode>
    );
    expect(lists.state.calls).toContainEqual({
      kind: 'eventing.knative.dev/v1/Broker',
      namespace: 'billing',
      cluster: 'cluster-b',
    });
  });
});

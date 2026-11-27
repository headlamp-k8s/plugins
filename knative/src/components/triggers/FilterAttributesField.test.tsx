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
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FilterAttributesField, isAttributeName, isValidFilter } from './FilterAttributesField';

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  FormTextField: (props: TextFieldProps) => (
    <TextField variant="outlined" size="small" fullWidth {...props} />
  ),
}));

/** Lets a test replace the filter from outside, as the YAML editor does. */
interface Handle {
  /** Replaces the filter the field shows. */
  setValue?: (value: unknown) => void;
}

/**
 * Renders the filter field under StrictMode with a parent that keeps its value, like the form.
 *
 * @param initial - The filter the field starts from.
 * @returns The changes the field reported, newest last, and a handle to replace the filter.
 */
function renderField(initial: unknown) {
  const changes: unknown[] = [];
  const handle: Handle = {};

  /**
   * Holds the filter in state and records every change.
   *
   * @returns The field.
   */
  function Harness() {
    const [value, setValue] = React.useState<unknown>(initial);
    handle.setValue = setValue;
    return (
      <FilterAttributesField
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
  return { changes, handle };
}

/**
 * Reads the names and values the rows show.
 *
 * @returns One `[name, value]` pair per row.
 */
function shownRows() {
  const names = screen.queryAllByLabelText('Attribute name');
  const values = screen.queryAllByLabelText('Attribute value');
  return names.map((name, index) => [
    name.getAttribute('value'),
    values[index].getAttribute('value'),
  ]);
}

describe('isAttributeName', () => {
  it('accepts the names Knative accepts', () => {
    expect(isAttributeName('type')).toBe(true);
    expect(isAttributeName('myext1')).toBe(true);
  });

  it('rejects other names', () => {
    for (const name of ['', 'Type', '1type', 'my-ext', 'my_ext', 'my.ext']) {
      expect(isAttributeName(name)).toBe(false);
    }
  });
});

describe('isValidFilter', () => {
  it('accepts no filter and valid attributes, empty values included', () => {
    expect(isValidFilter(undefined)).toBe(true);
    expect(isValidFilter({})).toBe(true);
    expect(isValidFilter({ attributes: { type: 'dev.knative.order', source: '' } })).toBe(true);
  });

  it('rejects a bad name or a value that is not a string', () => {
    expect(isValidFilter({ attributes: { 'my-ext': 'a' } })).toBe(false);
    expect(isValidFilter({ attributes: { type: 3 } })).toBe(false);
  });
});

describe('FilterAttributesField', () => {
  it("shows the filter's attributes", () => {
    renderField({ attributes: { type: 'dev.knative.order', source: '' } });
    expect(shownRows()).toEqual([
      ['type', 'dev.knative.order'],
      ['source', ''],
    ]);
  });

  it('adds rows and writes their attributes', () => {
    const { changes } = renderField(undefined);
    fireEvent.click(screen.getByRole('button', { name: 'Add attribute' }));
    expect(changes[changes.length - 1]).toBeUndefined();

    fireEvent.change(screen.getByLabelText('Attribute name'), { target: { value: 'type' } });
    expect(changes[changes.length - 1]).toEqual({ attributes: { type: '' } });
    fireEvent.change(screen.getByLabelText('Attribute value'), {
      target: { value: 'dev.knative.order' },
    });
    expect(changes[changes.length - 1]).toEqual({ attributes: { type: 'dev.knative.order' } });
  });

  it('keeps a row whose name repeats another while it is typed', () => {
    const { changes } = renderField({ attributes: { type: 'a' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add attribute' }));
    fireEvent.change(screen.getAllByLabelText('Attribute name')[1], { target: { value: 'type' } });
    expect(shownRows()).toEqual([
      ['type', 'a'],
      ['type', ''],
    ]);
    expect(changes[changes.length - 1]).toEqual({ attributes: { type: 'a' } });

    fireEvent.change(screen.getAllByLabelText('Attribute name')[1], {
      target: { value: 'typex' },
    });
    expect(changes[changes.length - 1]).toEqual({ attributes: { type: 'a', typex: '' } });
  });

  it('neither flags nor writes a row until it has a name, as Headlamp does for labels', () => {
    const { changes } = renderField({ attributes: { type: 'a' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add attribute' }));
    expect(shownRows()).toEqual([
      ['type', 'a'],
      ['', ''],
    ]);
    expect(changes[changes.length - 1]).toEqual({ attributes: { type: 'a' } });
    expect(screen.queryByText('A lowercase letter, then lowercase letters and digits.')).toBeNull();
  });

  it('flags a name Knative would reject', () => {
    renderField({ attributes: { 'my-ext': 'a' } });
    expect(
      screen.queryByText('A lowercase letter, then lowercase letters and digits.')
    ).not.toBeNull();
  });

  it('removes a row, and the filter once nothing else is left in it', () => {
    const { changes } = renderField({ attributes: { type: 'a', source: 'b' } });
    fireEvent.click(screen.getByRole('button', { name: 'Remove attribute type' }));
    expect(changes[changes.length - 1]).toEqual({ attributes: { source: 'b' } });
    fireEvent.click(screen.getByRole('button', { name: 'Remove attribute source' }));
    expect(changes[changes.length - 1]).toBeUndefined();
  });

  it('keeps the rest of the filter when its attributes are removed', () => {
    const { changes } = renderField({ attributes: { type: 'a' }, other: true });
    fireEvent.click(screen.getByRole('button', { name: 'Remove attribute type' }));
    expect(changes[changes.length - 1]).toEqual({ other: true });
  });

  it('shows attributes set from outside, as the YAML editor does', () => {
    const { handle } = renderField({ attributes: { type: 'a' } });
    act(() => handle.setValue?.({ attributes: { source: 'shop' } }));
    expect(shownRows()).toEqual([['source', 'shop']]);
    act(() => handle.setValue?.(undefined));
    expect(shownRows()).toEqual([]);
  });

  it('takes names from the YAML that clash with built-in object keys, or are empty', () => {
    const { changes, handle } = renderField({ attributes: { constructor: 'x' } });
    expect(shownRows()).toEqual([['constructor', 'x']]);
    act(() => handle.setValue?.({ attributes: { '': 'y', toString: 'z' } }));
    expect(shownRows()).toEqual([
      ['', 'y'],
      ['toString', 'z'],
    ]);
    fireEvent.change(screen.getAllByLabelText('Attribute value')[1], { target: { value: 'w' } });
    expect(changes[changes.length - 1]).toEqual({ attributes: { toString: 'w' } });
  });

  it('gives a row added after a change from outside its own inputs', () => {
    const { changes, handle } = renderField({ attributes: { type: 'a' } });
    act(() => handle.setValue?.({ attributes: { source: 'shop' } }));
    fireEvent.click(screen.getByRole('button', { name: /add/i }));
    fireEvent.change(screen.getAllByLabelText('Attribute name')[1], { target: { value: 'type' } });
    expect(shownRows()).toEqual([
      ['source', 'shop'],
      ['type', ''],
    ]);
    expect(changes[changes.length - 1]).toEqual({ attributes: { source: 'shop', type: '' } });
  });

  it('writes a name that clashes with a built-in object key', () => {
    const { changes } = renderField(undefined);
    fireEvent.click(screen.getByRole('button', { name: /add/i }));
    fireEvent.change(screen.getByLabelText('Attribute name'), { target: { value: 'constructor' } });
    expect(changes[changes.length - 1]).toEqual({ attributes: { constructor: '' } });
  });
});

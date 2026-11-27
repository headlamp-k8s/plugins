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
import { describe, expect, it } from 'vitest';
import { type NameListingClass, ResourceNameField } from './ResourceNameField';

/** What the list of the stand-in class answers. */
interface ListAnswer {
  /** The listed objects, or null before they load. */
  items: { metadata: { name: string } }[] | null;
  /** The list's errors, or null without errors. */
  errors: { message: string }[] | null;
}

/**
 * Makes a stand-in resource class whose `useList` calls a hook, records its options and answers
 * with the given list.
 *
 * @param answer - What the list answers.
 * @returns The class and the options its list was called with.
 */
function listedClass(answer: ListAnswer) {
  const calls: { namespace?: string; cluster?: string }[] = [];
  const resourceClass: NameListingClass = {
    useList(options) {
      calls.push(options);
      return React.useMemo(() => answer, []);
    },
  };
  return { resourceClass, calls };
}

/**
 * Renders the field under StrictMode.
 *
 * @param answer - What the list answers.
 * @param fieldLabel - The label to show in the input's outline, if any.
 * @returns The names the field reported, and the options its list was called with.
 */
function renderField(answer: ListAnswer, fieldLabel?: string) {
  const names: string[] = [];
  const { resourceClass, calls } = listedClass(answer);
  render(
    <React.StrictMode>
      <ResourceNameField
        resourceClass={resourceClass}
        namespace="shop"
        cluster="cluster-a"
        value=""
        onChange={name => names.push(name)}
        label="Broker"
        fieldLabel={fieldLabel}
      />
    </React.StrictMode>
  );
  return { names, calls };
}

describe('ResourceNameField', () => {
  it('lists the objects in the namespace and cluster, and offers their names in order', () => {
    const { names, calls } = renderField({
      items: [{ metadata: { name: 'orders' } }, { metadata: { name: 'default' } }],
      errors: null,
    });
    expect(calls).toContainEqual({ namespace: 'shop', cluster: 'cluster-a' });
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Broker' }));
    expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual([
      'default',
      'orders',
    ]);
    fireEvent.click(screen.getByRole('option', { name: 'orders' }));
    expect(names[names.length - 1]).toBe('orders');
  });

  it('takes a typed name, and shows why the objects could not be listed', () => {
    const { names } = renderField({ items: null, errors: [{ message: 'forbidden' }] });
    expect(screen.queryByText('Could not list them: forbidden')).not.toBeNull();
    fireEvent.change(screen.getByRole('combobox', { name: 'Broker' }), {
      target: { value: 'default' },
    });
    expect(names[names.length - 1]).toBe('default');
  });

  it('shows a label in its outline only when given one', () => {
    renderField({ items: [], errors: null });
    expect(screen.queryByText('Name', { selector: 'label' })).toBeNull();
    renderField({ items: [], errors: null }, 'Name');
    expect(screen.queryByText('Name', { selector: 'label' })).not.toBeNull();
  });
});

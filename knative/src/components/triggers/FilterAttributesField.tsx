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

import { Icon } from '@iconify/react';
import { FormTextField } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { isEqual, omit } from 'lodash';
import React from 'react';
import { asRecord } from '../common/formValues';

const ATTRIBUTE_NAME = /^[a-z][a-z0-9]*$/;

/** One row of the filter editor. */
interface AttributeRow {
  /** Identifies the row while its name is edited. */
  id: number;
  /** The attribute's name. */
  name: string;
  /** The value the attribute must have; empty matches any value. */
  value: string;
}

/**
 * Tells whether a name is a CloudEvents attribute name that Knative accepts in a Trigger filter.
 *
 * @param name - The name.
 * @returns True for a lowercase letter followed by lowercase letters and digits.
 */
export function isAttributeName(name: string): boolean {
  return ATTRIBUTE_NAME.test(name);
}

/**
 * Reads the attributes of a Trigger's `spec.filter`, keeping only string values, which are the
 * only ones Knative supports.
 *
 * @param filter - The filter as the resource holds it.
 * @returns The attribute names and values.
 */
function readAttributes(filter: unknown): Record<string, string> {
  const attributes = asRecord(asRecord(filter).attributes);
  return Object.fromEntries(
    Object.entries(attributes).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string'
    )
  );
}

/**
 * Turns rows into the attributes map, as Headlamp's labels editor does: a row without a name is
 * left out, and a name that repeats keeps its first value.
 *
 * @param rows - The rows.
 * @returns The attribute names and values.
 */
function rowsToAttributes(rows: AttributeRow[]): Record<string, string> {
  const named = new Map<string, string>();
  for (const row of rows) {
    if (row.name !== '' && !named.has(row.name)) {
      named.set(row.name, row.value);
    }
  }
  return Object.fromEntries(named);
}

/**
 * Turns the attributes map into rows, one per attribute.
 *
 * @param attributes - The attribute names and values.
 * @param firstId - The ID of the first row; the others count up from it.
 * @returns The rows.
 */
function attributesToRows(attributes: Record<string, string>, firstId: number): AttributeRow[] {
  return Object.entries(attributes).map(([name, value], index) => ({
    id: firstId + index,
    name,
    value,
  }));
}

/**
 * Tells whether a Trigger filter's attributes are valid for Knative: every name is an attribute
 * name and every value a string. An empty or missing filter is valid.
 *
 * @param filter - The filter as the resource holds it.
 * @returns True when Knative accepts the attributes.
 */
export function isValidFilter(filter: unknown): boolean {
  const attributes = asRecord(asRecord(filter).attributes);
  return Object.entries(attributes).every(
    ([name, value]) => isAttributeName(name) && typeof value === 'string'
  );
}

/** Props for {@link FilterAttributesField}. */
export interface FilterAttributesFieldProps {
  /** The Trigger's `spec.filter`, which may be missing. */
  value: unknown;
  /** Replaces the filter; undefined removes it. */
  onChange: (filter: Record<string, unknown> | undefined) => void;
}

/**
 * Edits the attributes of a Trigger's `spec.filter`: each row names a CloudEvents attribute and the
 * value it must equal, or leaves the value empty to match any value. Like Headlamp's labels editor,
 * a row is written once it has a name; a name Knative would reject is flagged. Edits from the YAML
 * editor replace the rows; the form's own edits keep them, so that a half-typed name does not lose
 * its row.
 *
 * @param props - The filter and how to replace it.
 * @returns The rows and a button to add one.
 */
export function FilterAttributesField({ value, onChange }: FilterAttributesFieldProps) {
  const attributes = readAttributes(value);
  const [rows, setRows] = React.useState(() => attributesToRows(attributes, 0));
  const [shownAttributes, setShownAttributes] = React.useState(attributes);
  const nextId = rows.reduce((highest, row) => Math.max(highest, row.id + 1), 0);

  if (!isEqual(attributes, shownAttributes)) {
    setShownAttributes(attributes);
    setRows(attributesToRows(attributes, nextId));
  }

  /**
   * Keeps the rows and writes them to the filter, removing the filter's attributes when no row has
   * a name.
   *
   * @param next - The rows.
   */
  function commit(next: AttributeRow[]) {
    setRows(next);
    const filter = omit(asRecord(value), 'attributes');
    const named = rowsToAttributes(next);
    setShownAttributes(named);
    const updated = Object.keys(named).length > 0 ? { ...filter, attributes: named } : filter;
    onChange(Object.keys(updated).length > 0 ? updated : undefined);
  }

  /**
   * Changes one row.
   *
   * @param id - The row's ID.
   * @param change - The new name or value.
   */
  function updateRow(id: number, change: Partial<Pick<AttributeRow, 'name' | 'value'>>) {
    commit(rows.map(row => (row.id === id ? { ...row, ...change } : row)));
  }

  return (
    <Box>
      {rows.map(row => {
        const isNameInvalid = row.name !== '' && !isAttributeName(row.name);
        return (
          <Box
            key={row.id}
            sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mt: 2, mb: 2 }}
          >
            <FormTextField
              label="Attribute"
              value={row.name}
              placeholder="type"
              error={isNameInvalid}
              helperText={
                isNameInvalid ? 'A lowercase letter, then lowercase letters and digits.' : undefined
              }
              onChange={event => updateRow(row.id, { name: event.target.value })}
              inputProps={{ 'aria-label': 'Attribute name' }}
            />
            <FormTextField
              label="Value"
              value={row.value}
              placeholder="Any value"
              onChange={event => updateRow(row.id, { value: event.target.value })}
              inputProps={{ 'aria-label': 'Attribute value' }}
            />
            <IconButton
              color="default"
              size="small"
              onClick={() => commit(rows.filter(other => other.id !== row.id))}
              aria-label={`Remove attribute ${row.name}`}
            >
              <Icon icon="mdi:close-circle" width={24} height={24} />
            </IconButton>
          </Box>
        );
      })}
      <Box sx={{ mt: 2 }}>
        <Button
          color="primary"
          size="small"
          onClick={() => commit([...rows, { id: nextId, name: '', value: '' }])}
        >
          <Icon icon="mdi:plus-circle" width={24} height={24} />
          <Typography variant="body2" sx={{ ml: 0.5 }}>
            Add attribute
          </Typography>
        </Button>
      </Box>
    </Box>
  );
}

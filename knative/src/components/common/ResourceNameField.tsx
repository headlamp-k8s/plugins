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

import { Autocomplete, TextField } from '@mui/material';
import React from 'react';

/** A class that lists objects by namespace and cluster, as Headlamp's resource classes do. */
export interface NameListingClass {
  /**
   * Lists the objects of the class.
   *
   * @param options - The namespace and cluster to list.
   * @returns The objects, null before they load, and the errors of the list, null without any.
   */
  useList(options: { namespace: string; cluster: string }): {
    /** The listed objects, or null before they load. */
    items: { metadata: { name: string } }[] | null;
    /** The errors of the list, or null without any. */
    errors: { message: string }[] | null;
  };
}

/** Props for {@link ResourceNameField}. */
export interface ResourceNameFieldProps {
  /** The class whose objects are offered. */
  resourceClass: NameListingClass;
  /** The namespace whose objects are offered. */
  namespace: string;
  /** The cluster whose objects are offered. */
  cluster: string;
  /** The name typed or picked so far. */
  value: string;
  /** Replaces the name. */
  onChange: (name: string) => void;
  /** The input's label, read by screen readers. */
  label: string;
  /** A label shown in the input's outline, as in a row of several inputs. */
  fieldLabel?: string;
}

/**
 * A name input that offers the names of a kind's objects in a namespace, and still takes any name,
 * for an object that does not exist yet or cannot be listed.
 *
 * @param props - The kind, where to look, the name, and the labels.
 * @returns The input, with the list's error below it when the objects cannot be listed.
 */
export function ResourceNameField({
  resourceClass,
  namespace,
  cluster,
  value,
  onChange,
  label,
  fieldLabel,
}: ResourceNameFieldProps) {
  const { items, errors } = resourceClass.useList({ namespace, cluster });
  const names = React.useMemo(() => (items ?? []).map(item => item.metadata.name).sort(), [items]);
  const error = errors?.[0];

  return (
    <Autocomplete
      freeSolo
      fullWidth
      options={names}
      value={value}
      onChange={(_event, name) => onChange(name ?? '')}
      onInputChange={(_event, name, reason) => {
        if (reason === 'input') {
          onChange(name);
        }
      }}
      renderInput={params => (
        <TextField
          {...params}
          label={fieldLabel}
          variant="outlined"
          size="small"
          fullWidth
          error={!!error}
          helperText={error ? `Could not list them: ${error.message}` : undefined}
          InputProps={{
            ...params.InputProps,
            sx: theme => ({ background: theme.palette.background.default }),
          }}
          inputProps={{ ...params.inputProps, 'aria-label': label }}
        />
      )}
    />
  );
}

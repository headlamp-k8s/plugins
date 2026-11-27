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

import { stringify } from 'yaml';
import { isPlainObject, ValuesMap } from './release';

/**
 * Merges the values given by the user over the defaults of the chart, the way Helm computes the
 * values it renders the templates with (`helm get values --all`):
 * - tables are merged key by key, the user value winning;
 * - a `null` given by the user removes the default key.
 *
 * Helm does not keep the subcharts in the release record, so their own defaults are only present
 * when the parent chart overrides them.
 */
export function coalesceValues(defaults: ValuesMap, user: ValuesMap): ValuesMap {
  const merged: ValuesMap = {};

  for (const [key, defaultValue] of Object.entries(defaults)) {
    if (!(key in user)) {
      merged[key] = structuredCloneValue(defaultValue);
      continue;
    }
    const userValue = user[key];
    if (userValue === null) continue;
    merged[key] =
      isPlainObject(defaultValue) && isPlainObject(userValue)
        ? coalesceValues(defaultValue, userValue)
        : structuredCloneValue(userValue);
  }

  for (const [key, userValue] of Object.entries(user)) {
    if (!(key in defaults)) merged[key] = structuredCloneValue(userValue);
  }

  return merged;
}

function structuredCloneValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(structuredCloneValue);
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, structuredCloneValue(entry)])
    );
  }
  return value;
}

export function hasValues(values: ValuesMap): boolean {
  return Object.keys(values).length > 0;
}

/**
 * Renders values as YAML. Keys are sorted, as Helm prints them, and long strings are kept on one
 * line so that two revisions compare line by line.
 */
export function valuesToYaml(values: ValuesMap): string {
  if (!hasValues(values)) return '';
  return stringify(values, { sortMapEntries: true, lineWidth: 0 });
}

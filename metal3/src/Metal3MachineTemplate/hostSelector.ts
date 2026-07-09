/*
 * Copyright 2025 The Kubernetes Authors
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

/** A single matchExpressions entry of a HostSelector. */
export interface HostSelectorRequirement {
  key: string;
  operator: string;
  values?: string[];
}

/** The embedded machine spec's hostSelector: label match criteria for choosing a BareMetalHost. */
export interface HostSelector {
  matchLabels?: Record<string, string>;
  matchExpressions?: HostSelectorRequirement[];
}

/**
 * Formats a HostSelector into a readable one-line summary, joining matchLabels as
 * `key=value` and matchExpressions as `key operator [values]`. Set-based operators
 * such as `Exists`/`DoesNotExist` carry no values, so the bracketed list is dropped
 * for them. Returns `'-'` when the selector is absent or empty (a template with no
 * selector matches any host).
 *
 * @param hostSelector - The `spec.template.spec.hostSelector` value, if present.
 * @returns The summary string, or `'-'` when there is nothing to show.
 */
export function formatHostSelector(hostSelector?: HostSelector): string {
  if (!hostSelector) {
    return '-';
  }
  const labels = hostSelector.matchLabels
    ? Object.entries(hostSelector.matchLabels)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
    : [];
  const expressions = (hostSelector.matchExpressions || []).map(expr => {
    // Exists/DoesNotExist take no values, so drop the bracketed list for them;
    // value-taking operators (In/NotIn) keep it, even when empty, so missing
    // values stay visible rather than reading like a value-less operator.
    const valueLess = expr.operator === 'Exists' || expr.operator === 'DoesNotExist';
    return valueLess
      ? `${expr.key} ${expr.operator}`
      : `${expr.key} ${expr.operator} [${(expr.values || []).join(', ')}]`;
  });
  const parts = [...labels, ...expressions];
  return parts.length ? parts.join(', ') : '-';
}

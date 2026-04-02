import {
  NameValueTable,
  type NameValueTableRow,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import type { ReactNode } from 'react';
import { Condition, KubeReference } from '../../resources/common';

/**
 * Maps a resource phase string to a Headlamp StatusLabel style.
 *
 * @param phase - The resource phase (e.g., 'Running', 'Failed').
 * @returns A status string: 'success', 'warning', or 'error'.
 */
export function getPhaseStatus(phase: string | undefined): 'success' | 'warning' | 'error' | '' {
  if (!phase) return '';
  const normalized = phase.toLowerCase();
  if (['running', 'provisioned', 'succeeded', 'ready'].includes(normalized)) {
    return 'success';
  }
  if (['pending', 'provisioning', 'deleting', 'updating', 'draining'].includes(normalized)) {
    return 'warning';
  }
  if (['failed', 'error', 'unknown', 'degraded'].includes(normalized)) {
    return 'error';
  }
  return 'warning';
}

/**
 * Generic input type for name-value rows.
 * Can be a simple Record (dictionary) or an array of { name, value } objects.
 */
export type NameValueInput =
  | Record<string, string | number | boolean | null | undefined>
  | Array<{ name: string; value: string | number | boolean | null | undefined }>
  | undefined
  | null;

/**
 * Normalizes mixed name-value input formats into a consistent row array.
 *
 * @param data - Record, array of objects, or undefined/null.
 * @returns Array of name-value pairs as strings.
 */
export function toNameValueRows(data: NameValueInput): { name: string; value: string }[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.map(({ name, value }) => ({
      name,
      value: value === null ? '' : String(value),
    }));
  }
  return Object.entries(data).map(([name, value]) => ({
    name,
    value: value === null ? '' : String(value),
  }));
}

/**
 * Converts an array of name-value rows back into a object dictionary.
 *
 * @param rows - Array of name-value pairs.
 * @returns A Record object.
 */
export function rowsToDict(rows: Array<{ name: string; value: string }>) {
  return rows.reduce<Record<string, string>>((acc, { name, value }) => {
    acc[name] = value ?? '';
    return acc;
  }, {});
}

/**
 * Renders a Kubernetes reference object as a small information table.
 *
 * @param ref - The KubeReference object.
 * @returns A React component showing the ref details.
 */
export function renderReference(ref?: KubeReference): ReactNode {
  if (!ref) return '-';
  const rows: NameValueTableRow[] = [];
  if (ref.apiVersion) {
    rows.push({ name: 'API Version', value: ref.apiVersion });
  } else {
    rows.push({ name: 'API Group', value: ref.apiGroup ?? '-' });
  }
  rows.push(
    { name: 'Kind', value: ref.kind ?? '-' },
    { name: 'Name', value: ref.name ?? '-' },
    { name: 'Namespace', value: ref.namespace ?? '-', hide: !ref.namespace }
  );
  return <NameValueTable rows={rows} />;
}

/**
 * Renders a condition status as a styled StatusLabel.
 * Supports custom labels and status mappings for different condition states.
 *
 * @param value - Optional string value ('true'/'false').
 * @param condition - Optional Condition object from resource status.
 * @param options - Configuration for labels and color statuses for True, False, and Unknown states.
 * @returns A styled status badge.
 */
export function renderConditionStatus(
  value?: string,
  condition?: Condition,
  options?: {
    trueLabel?: string;
    falseLabel?: string;
    trueStatus?: 'success' | 'warning' | 'error';
    falseStatus?: 'success' | 'warning' | 'error';
    unknownLabel?: string;
    unknownStatus?: 'success' | 'warning' | 'error';
  }
): ReactNode {
  let isTrue: boolean | undefined;
  if (condition) {
    if (condition.status === 'Unknown') {
      return (
        <StatusLabel status={options?.unknownStatus ?? 'warning'}>
          {options?.unknownLabel ?? 'Unknown'}
        </StatusLabel>
      );
    }
    isTrue = condition.status === 'True';
  } else if (value !== undefined) {
    isTrue = value === 'true';
  } else {
    return (
      <StatusLabel status={options?.unknownStatus ?? 'warning'}>
        {options?.unknownLabel ?? 'Unknown'}
      </StatusLabel>
    );
  }
  const label = isTrue ? options?.trueLabel ?? 'True' : options?.falseLabel ?? 'False';

  const status = isTrue ? options?.trueStatus ?? 'success' : options?.falseStatus ?? 'error';

  return <StatusLabel status={status}>{label}</StatusLabel>;
}

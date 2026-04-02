import {
  NameValueTable,
  type NameValueTableRow,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import type { ReactNode } from 'react';
import { Condition, KubeReference } from '../../resources/common';

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

export type NameValueInput =
  | Record<string, string | number | boolean | null | undefined>
  | Array<{ name: string; value: string | number | boolean | null | undefined }>
  | undefined
  | null;

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

export function rowsToDict(rows: Array<{ name: string; value: string }>) {
  return rows.reduce<Record<string, string>>((acc, { name, value }) => {
    acc[name] = value ?? '';
    return acc;
  }, {});
}

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

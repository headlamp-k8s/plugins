import { StatusLabel, StatusLabelProps } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Typography } from '@mui/material';

/** Display value used when a list column has no data to show. */
export const EMPTY_VALUE = '-';

/**
 * Converts empty or missing values to a consistent table fallback.
 *
 * @param value - Value read from a Kubernetes resource.
 * @returns The stringified value or `EMPTY_VALUE` when absent.
 */
export function fallback(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return EMPTY_VALUE;
  }

  return String(value);
}

/**
 * Formats an optional boolean for display in table columns.
 *
 * @param value - Boolean value read from a Kubernetes resource.
 * @returns "Yes", "No", or `EMPTY_VALUE` when absent.
 */
export function booleanLabel(value: boolean | undefined): string {
  if (value === undefined) {
    return EMPTY_VALUE;
  }

  return value ? 'Yes' : 'No';
}

/**
 * Formats a count with singular or plural wording.
 *
 * @param count - Count to display.
 * @param singular - Singular noun used when count is one.
 * @param plural - Plural noun used for all non-one counts.
 * @returns A formatted count label or `EMPTY_VALUE` when absent.
 */
export function countLabel(count: number | undefined, singular: string, plural = `${singular}s`) {
  if (count === undefined) {
    return EMPTY_VALUE;
  }

  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Finds the first present value in a list of optional values.
 *
 * @param values - Candidate values in priority order.
 * @returns The first non-empty value, or undefined when none are present.
 */
export function getFirstDefined<T>(...values: (T | undefined)[]): T | undefined {
  return values.find(value => value !== undefined && value !== null && value !== '') as
    | T
    | undefined;
}

/**
 * Renders a value using muted text when the value is absent.
 *
 * @param value - Value read from a Kubernetes resource.
 * @returns A text element containing the value or fallback.
 */
export function renderFallback(value: unknown) {
  return (
    <Typography
      variant="body2"
      color={fallback(value) === EMPTY_VALUE ? 'text.secondary' : 'inherit'}
    >
      {fallback(value)}
    </Typography>
  );
}

/**
 * Renders a status-like value using Headlamp's standard status label.
 *
 * @param value - Status, state, or phase value read from a resource.
 * @returns A Headlamp status label suitable for use in list tables.
 */
export function renderStatus(value: unknown) {
  const label = fallback(value);
  const normalized = label.toLowerCase();

  let status: StatusLabelProps['status'] = '';
  if (['ready', 'running', 'success', 'succeeded', 'completed', 'on'].includes(normalized)) {
    status = 'success';
  } else if (['pending', 'unknown', EMPTY_VALUE.toLowerCase()].includes(normalized)) {
    status = '';
  } else if (['failed', 'failure', 'error', 'timed out', 'timeout', 'off'].includes(normalized)) {
    status = 'error';
  } else if (['warning', 'disabled'].includes(normalized)) {
    status = 'warning';
  } else {
    status = '';
  }

  return <StatusLabel status={status}>{label}</StatusLabel>;
}

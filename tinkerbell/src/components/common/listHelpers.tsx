import { Chip, Typography } from '@mui/material';

export const EMPTY_VALUE = '-';

export function fallback(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return EMPTY_VALUE;
  }

  return String(value);
}

export function booleanLabel(value: boolean | undefined): string {
  if (value === undefined) {
    return EMPTY_VALUE;
  }

  return value ? 'Yes' : 'No';
}

export function countLabel(count: number | undefined, singular: string, plural = `${singular}s`) {
  if (count === undefined) {
    return EMPTY_VALUE;
  }

  return `${count} ${count === 1 ? singular : plural}`;
}

export function getFirstDefined<T>(...values: (T | undefined)[]): T | undefined {
  return values.find(value => value !== undefined && value !== null && value !== '') as
    | T
    | undefined;
}

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

export function renderStatus(value: unknown) {
  const label = fallback(value);
  const normalized = label.toLowerCase();

  let color: 'default' | 'success' | 'warning' | 'error' | 'info' = 'default';
  if (['ready', 'running', 'success', 'succeeded', 'completed', 'on'].includes(normalized)) {
    color = 'success';
  } else if (['pending', 'unknown', EMPTY_VALUE.toLowerCase()].includes(normalized)) {
    color = 'default';
  } else if (['failed', 'failure', 'error', 'timed out', 'timeout', 'off'].includes(normalized)) {
    color = 'error';
  } else if (['warning', 'disabled'].includes(normalized)) {
    color = 'warning';
  } else {
    color = 'info';
  }

  return <Chip label={label} color={color} size="small" variant="outlined" />;
}

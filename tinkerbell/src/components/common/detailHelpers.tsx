import {
  NameValueTable,
  NameValueTableRow,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Typography } from '@mui/material';
import { booleanLabel, EMPTY_VALUE, fallback, renderStatus } from './listHelpers';

export { fallback };

/**
 * Renders a status-like value as a table value.
 *
 * @param value - Status value read from a Tinkerbell resource.
 * @returns A status chip or fallback text when absent.
 */
export function statusValue(value: unknown) {
  return fallback(value) === EMPTY_VALUE ? EMPTY_VALUE : renderStatus(value);
}

/**
 * Renders an optional boolean value for detail tables.
 *
 * @param value - Boolean value read from a Tinkerbell resource.
 * @returns A readable boolean label or fallback.
 */
export function booleanValue(value: boolean | undefined): string {
  return booleanLabel(value);
}

/**
 * Converts a record into rows for a Headlamp NameValueTable.
 *
 * @param value - Record to render.
 * @returns Name/value rows sorted by insertion order.
 */
export function recordToRows(value: Record<string, unknown> | undefined): NameValueTableRow[] {
  if (!value) {
    return [];
  }

  return Object.entries(value).map(([name, rowValue]) => ({
    name,
    value: renderUnknownValue(rowValue),
  }));
}

/**
 * Renders a section for arbitrary key/value object data.
 *
 * @param title - Section title.
 * @param value - Object data to render.
 * @returns A section with a name/value table or a fallback row.
 */
export function renderRecordSection(title: string, value: Record<string, unknown> | undefined) {
  const rows = recordToRows(value);

  return (
    <SectionBox title={title}>
      <NameValueTable rows={rows.length ? rows : [{ name: 'Data', value: EMPTY_VALUE }]} />
    </SectionBox>
  );
}

/**
 * Renders a preformatted block for raw text.
 *
 * @param title - Section title.
 * @param value - Text value to show.
 * @returns A section containing preformatted text or a fallback.
 */
export function renderTextSection(title: string, value: string | undefined) {
  return (
    <SectionBox title={title}>
      <Typography
        component="pre"
        sx={{
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          margin: 0,
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
        }}
      >
        {fallback(value)}
      </Typography>
    </SectionBox>
  );
}

/**
 * Renders arbitrary unknown data safely in detail tables.
 *
 * @param value - Unknown value from a custom resource.
 * @returns A readable primitive or formatted JSON string.
 */
export function renderUnknownValue(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return EMPTY_VALUE;
  }

  if (typeof value === 'object') {
    return JSON.stringify(maskSensitiveValues(value), null, 2);
  }

  return String(value);
}

/**
 * Masks common sensitive keys in nested custom resource data.
 *
 * @param value - Unknown data structure that may contain credentials.
 * @returns A copy of the data with sensitive values replaced.
 */
export function maskSensitiveValues(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(maskSensitiveValues);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, itemValue]) => {
      const lowerKey = key.toLowerCase();
      const isSensitive =
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('credential');

      return [key, isSensitive ? '******' : maskSensitiveValues(itemValue)];
    })
  );
}

/**
 * Renders an array of objects as a SimpleTable with a fallback row.
 *
 * @param title - Section title.
 * @param columns - Table columns.
 * @param data - Rows to render.
 * @returns A section containing a table or empty-state row.
 */
export function renderTableSection<T extends object>(
  title: string,
  columns: { label: string; getter: (row: T) => React.ReactNode }[],
  data: T[] | undefined
) {
  return (
    <SectionBox title={title}>
      <SimpleTable columns={columns} data={data?.length ? data : ([] as T[])} />
    </SectionBox>
  );
}

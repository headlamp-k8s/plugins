import { HoverInfoLabel, NameValueTableRow } from '@kinvolk/headlamp-plugin/lib/components/common';
import { localeDate } from '@kinvolk/headlamp-plugin/lib/Utils';
import { JSONPath } from 'jsonpath-plus';

export type AdditionalPrinterColumns = Array<{
  name: string;
  type: string;
  jsonPath: string;
  description?: string;
  priority?: number;
  format?: string;
}>;

/**
 * Returns the additionalPrinterColumns for a specific API version from a CRD.
 *
 * @param crd - The CustomResourceDefinition object.
 * @param apiVersion - The API version to search for (e.g., v1beta1).
 * @returns An array of printer column definitions.
 */
export function getExtraColumnsFromCrd(
  crd: {
    jsonData?: {
      spec?: {
        versions?: Array<{ name: string; additionalPrinterColumns?: AdditionalPrinterColumns }>;
      };
    };
  } | null,
  apiVersion: string
): AdditionalPrinterColumns {
  const spec = crd?.jsonData?.spec;
  const versions = spec?.versions ?? [];
  const version = versions.find((v: { name: string }) => v.name === apiVersion);
  return version?.additionalPrinterColumns ?? [];
}

/**
 * Evaluates CRD printer columns against a resource instance to produce table rows.
 * Handles JSONPath evaluation, date formatting, and hover descriptions.
 *
 * @param extraInfoSpec - The printer column specifications from the CRD.
 * @param item - The actual JSON data of the resource instance.
 * @returns An array of NameValueTableRow objects for display in a DetailsGrid.
 */
export function getExtraInfoFromPrinterColumns(
  extraInfoSpec: AdditionalPrinterColumns,
  item: Record<string, unknown>
): NameValueTableRow[] {
  const extraInfo: NameValueTableRow[] = [];
  extraInfoSpec.forEach(spec => {
    if (spec.jsonPath === '.metadata.creationTimestamp') return;

    let value: string | undefined;
    try {
      const rawValue = JSONPath({ path: '$' + spec.jsonPath, json: item });
      let normalized: unknown;
      if (Array.isArray(rawValue)) {
        if (rawValue.length === 0) normalized = undefined;
        else if (rawValue.length === 1) normalized = rawValue[0];
        else normalized = rawValue.join(', ');
      } else {
        normalized = rawValue;
      }
      if (
        spec.type === 'date' &&
        normalized !== null &&
        normalized !== undefined &&
        normalized !== ''
      ) {
        const date = new Date(normalized as string | number | Date);
        value = localeDate(date);
      } else if (normalized !== null && normalized !== undefined) {
        value = String(normalized);
      } else {
        value = undefined;
      }
    } catch (err) {
      console.error(`Failed to get value from JSONPath ${spec.jsonPath} on CR item`, err);
      return;
    }
    const desc = spec.description;
    extraInfo.push({
      name: spec.name,
      value: desc ? <HoverInfoLabel label={value ?? ''} hoverInfo={desc} /> : value,
      hide: value === '' || value === undefined,
    });
  });
  return extraInfo;
}

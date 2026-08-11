import { ClusterQueue, FlavorUsage, ResourceGroup } from '../resources/clusterQueue';

const RAM_TYPES = ['Bi', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei'];
const UNITS = ['B', 'K', 'M', 'G', 'T', 'P', 'E'];

/** Parse a Kubernetes CPU quantity string into nanocores. */
export function parseCpu(value: string): number {
  if (!value) return 0;
  const number = parseFloat(value);
  if (value.endsWith('n')) return number;
  if (value.endsWith('u')) return number * 1000;
  if (value.endsWith('m')) return number * 1000 * 1000;
  return number * 1000 * 1000 * 1000;
}

/** Parse a Kubernetes byte quantity string into numeric bytes. */
export function parseRam(value: string): number {
  if (!value) return 0;
  const groups = value.match(/(\d+(?:\.\d+)?)([BKMGTPEe])?(i)?(\d+)?/) || [];
  const number = parseFloat(groups[1]);
  if (Number.isNaN(number)) return 0;

  if (groups[2] === undefined) {
    return number;
  }
  if (groups[4] !== undefined) {
    return number * 10 ** parseInt(groups[4], 10);
  }

  const unitIndex = UNITS.indexOf(groups[2]);
  if (unitIndex === -1) return number;

  if (groups[3] !== undefined) {
    return number * 1024 ** unitIndex;
  }
  return number * 1000 ** unitIndex;
}

/** Convert byte number back into human-readable unit object. */
export function unparseRam(value: number): { value: number; unit: string } {
  let i = 0;
  let val = value;
  while (val >= 1024 && i < RAM_TYPES.length - 1) {
    i++;
    val /= 1024;
  }
  return {
    value: Math.round(val * 10) / 10,
    unit: RAM_TYPES[i],
  };
}

/** Quota reservation calculation result for a single resource. */
export interface ResourceQuotaCalculation {
  resourceName: string;
  nominalQuotaValue: number;
  ratio: number | null;
  percentage: number | null;
  isBorrowingOnly: boolean;
  isOverNominal: boolean;
  reservedDisplay: string;
  nominalDisplay: string;
  borrowedDisplay: string;
}

/** Parse a Kubernetes quantity string or number safely into base numeric value. */
export function parseQuantity(value: string | number | undefined, resourceName: string): number {
  if (value === undefined || value === null || value === '') {
    return 0;
  }
  if (typeof value === 'number') {
    return Number.isNaN(value) ? 0 : value;
  }

  const resName = resourceName.toLowerCase();
  if (resName === 'cpu') {
    // parseCpu returns nanocores
    const nanoCores = parseCpu(value);
    return Number.isNaN(nanoCores) ? 0 : nanoCores / 1e9;
  }

  if (resName === 'memory' || resName.endsWith('bytes') || resName.endsWith('storage')) {
    // parseRam returns bytes
    const bytes = parseRam(value);
    return Number.isNaN(bytes) ? 0 : bytes;
  }

  // Count/integer resources (e.g. GPUs, pods)
  const num = parseFloat(value);
  return Number.isNaN(num) ? 0 : num;
}

/** Format a base numeric quantity into a human-readable display string. */
export function formatQuantityValue(value: number, resourceName: string): { display: string; unit: string } {
  const resName = resourceName.toLowerCase();

  if (resName === 'cpu') {
    const rounded = Math.round(value * 1000) / 1000;
    return {
      display: `${rounded}`,
      unit: rounded === 1 ? 'core' : 'cores',
    };
  }

  if (resName === 'memory' || resName.endsWith('bytes') || resName.endsWith('storage')) {
    if (value === 0) {
      return { display: '0', unit: 'B' };
    }
    const { value: val, unit } = unparseRam(value);
    return {
      display: `${val}`,
      unit,
    };
  }

  const rounded = Math.round(value * 100) / 100;
  return {
    display: `${rounded}`,
    unit: '',
  };
}

/** Format a raw string or numeric quantity value directly. */
export function formatRawQuantity(value: string | number | undefined, resourceName: string): string {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  const numeric = parseQuantity(value, resourceName);
  const { display, unit } = formatQuantityValue(numeric, resourceName);
  return unit ? `${display} ${unit}` : `${display}`;
}

/** Find configured nominal quota and borrowing limit for a flavor and resource name from spec.resourceGroups. */
export function findConfiguredQuota(
  resourceGroups: ResourceGroup[] = [],
  flavorName: string,
  resourceName: string
): { nominalQuota?: string | number; borrowingLimit?: string | number } {
  for (const group of resourceGroups) {
    const flavor = group.flavors?.find(f => f.name === flavorName);
    if (flavor) {
      const resQuota = flavor.resources?.find(r => r.name === resourceName);
      if (resQuota) {
        return {
          nominalQuota: resQuota.nominalQuota,
          borrowingLimit: resQuota.borrowingLimit,
        };
      }
    }
  }
  return {};
}

/** Compute quota reservation ratio and percentages for a resource row. */
export function calculateResourceQuotaRatio(
  flavorName: string,
  resourceName: string,
  reservedTotalRaw: string | number = '0',
  reservedBorrowedRaw: string | number = '0',
  resourceGroups: ResourceGroup[] = []
): ResourceQuotaCalculation {
  const { nominalQuota, borrowingLimit } = findConfiguredQuota(resourceGroups, flavorName, resourceName);

  const nominalVal = nominalQuota !== undefined ? parseQuantity(nominalQuota, resourceName) : 0;
  const borrowingVal = borrowingLimit !== undefined ? parseQuantity(borrowingLimit, resourceName) : undefined;
  const reservedTotalVal = parseQuantity(reservedTotalRaw, resourceName);

  const { display: resDisp, unit: resUnit } = formatQuantityValue(reservedTotalVal, resourceName);
  const { display: nomDisp } = formatQuantityValue(nominalVal, resourceName);

  const reservedDisplay = resUnit ? `${resDisp} ${resUnit}` : resDisp;
  const nominalDisplay = nominalQuota !== undefined ? (resUnit ? `${nomDisp} ${resUnit}` : nomDisp) : '-';
  const borrowedDisplay = formatRawQuantity(reservedBorrowedRaw, resourceName);

  const isBorrowingOnly = nominalVal === 0 && borrowingVal !== undefined && borrowingVal > 0;
  let ratio: number | null = null;
  let percentage: number | null = null;

  if (nominalVal > 0) {
    ratio = reservedTotalVal / nominalVal;
    percentage = Math.floor(ratio * 100);
  }

  const isOverNominal = nominalVal > 0 && reservedTotalVal > nominalVal;

  return {
    resourceName,
    nominalQuotaValue: nominalVal,
    ratio,
    percentage,
    isBorrowingOnly,
    isOverNominal,
    reservedDisplay,
    nominalDisplay,
    borrowedDisplay,
  };
}

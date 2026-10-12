import { Box, LinearProgress, Typography } from '@mui/material';
import type { ResourceQuantity } from '../../resources/clusterQueue';

export interface QuotaBarProps {
  /** Optional resource name, e.g. cpu, memory, or nvidia.com/gpu. */
  resourceName?: string;
  /** Current consumed/used quantity (numeric or ResourceQuantity string like 500m, 1Gi). */
  used?: ResourceQuantity;
  /** Nominal/guaranteed quota limit (numeric or ResourceQuantity string). */
  nominal?: ResourceQuantity;
  /** Optional borrowing limit quantity. */
  borrowingLimit?: ResourceQuantity;
  /** Optional lending limit quantity. */
  lendingLimit?: ResourceQuantity;
}

/** Parse Kubernetes quantity representations (m, Ki, Mi, Gi, Ti, Pi, etc.) into numbers. */
export function parseResourceQuantity(
  val: ResourceQuantity | string | number | undefined | null
): number {
  if (val === undefined || val === null || val === '-' || val === '') {
    return 0;
  }
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  const str = String(val).trim();
  if (!str) return 0;

  const decimalSubunitMultipliers: Record<string, number> = {
    n: 1e-9,
    u: 1e-6,
    m: 1e-3,
  };
  for (const [suffix, mult] of Object.entries(decimalSubunitMultipliers)) {
    if (str.endsWith(suffix)) {
      const num = parseFloat(str.slice(0, -suffix.length));
      return isNaN(num) ? 0 : num * mult;
    }
  }

  const binaryMultipliers: Record<string, number> = {
    Ki: 1024,
    Mi: 1024 ** 2,
    Gi: 1024 ** 3,
    Ti: 1024 ** 4,
    Pi: 1024 ** 5,
    Ei: 1024 ** 6,
  };
  for (const [suffix, mult] of Object.entries(binaryMultipliers)) {
    if (str.endsWith(suffix)) {
      const num = parseFloat(str.slice(0, -suffix.length));
      return isNaN(num) ? 0 : num * mult;
    }
  }

  const decimalMultipliers: Record<string, number> = {
    k: 1e3,
    M: 1e6,
    G: 1e9,
    T: 1e12,
    P: 1e15,
    E: 1e18,
  };
  for (const [suffix, mult] of Object.entries(decimalMultipliers)) {
    if (str.endsWith(suffix)) {
      const num = parseFloat(str.slice(0, -suffix.length));
      return isNaN(num) ? 0 : num * mult;
    }
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/** Calculate percentage safely without NaN or Infinity division errors. */
export function calculateQuotaPercentage(
  used: ResourceQuantity | undefined | null,
  nominal: ResourceQuantity | undefined | null
): number {
  const usedNum = parseResourceQuantity(used);
  const nominalNum = parseResourceQuantity(nominal);
  if (nominalNum <= 0) {
    return usedNum > 0 ? 100 : 0;
  }
  const pct = (usedNum / nominalNum) * 100;
  return Math.max(pct, 0);
}

export function QuotaBar({
  resourceName,
  used,
  nominal,
  borrowingLimit,
  lendingLimit,
}: QuotaBarProps) {
  const percentage = calculateQuotaPercentage(used, nominal);
  const barPercentage = Math.min(percentage, 100);
  const color = percentage > 90 ? 'error' : percentage > 75 ? 'warning' : 'primary';
  const displayNominal = nominal ?? '-';

  return (
    <Box sx={{ minWidth: 160, my: 0.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        {resourceName && (
          <Typography variant="body2" fontWeight="bold">
            {resourceName}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          {used !== undefined ? `${used} / ` : ''}
          {displayNominal}
          {used !== undefined ? ` (${Math.round(percentage)}%)` : ''}
        </Typography>
      </Box>

      {used !== undefined && (
        <LinearProgress
          aria-label={resourceName ? `${resourceName} quota utilization` : 'Quota utilization'}
          variant="determinate"
          value={barPercentage}
          color={color}
          sx={{ height: 6, borderRadius: 1 }}
        />
      )}

      {(borrowingLimit !== undefined || lendingLimit !== undefined) && (
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          {borrowingLimit !== undefined && borrowingLimit !== '-' && (
            <Typography variant="caption" color="text.secondary">
              Borrow: {borrowingLimit}
            </Typography>
          )}
          {lendingLimit !== undefined && lendingLimit !== '-' && (
            <Typography variant="caption" color="text.secondary">
              Lend: {lendingLimit}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

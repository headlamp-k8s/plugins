import { Box, LinearProgress, Typography } from '@mui/material';

export interface QuotaBarProps {
  /** Resource name, e.g. cpu, memory, or nvidia.com/gpu. */
  resourceName: string;
  /** Current consumed/used quantity (numeric or parsed). */
  used: number;
  /** Nominal/guaranteed quota limit. */
  nominal: number;
  /** Optional borrowing limit quantity. */
  borrowingLimit?: number;
  /** Optional lending limit quantity. */
  lendingLimit?: number;
}

/** Calculate percentage safely without NaN or Infinity division errors. */
export function calculateQuotaPercentage(used: number, nominal: number): number {
  if (nominal <= 0) {
    return used > 0 ? 100 : 0;
  }
  const pct = (used / nominal) * 100;
  return Math.min(Math.max(pct, 0), 100);
}

export function QuotaBar({
  resourceName,
  used,
  nominal,
  borrowingLimit,
  lendingLimit,
}: QuotaBarProps) {
  const percentage = calculateQuotaPercentage(used, nominal);
  const color = percentage > 90 ? 'error' : percentage > 75 ? 'warning' : 'primary';

  return (
    <Box sx={{ mb: 1.5, minWidth: 200 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" fontWeight="bold">
          {resourceName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {used} / {nominal} ({Math.round(percentage)}%)
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={percentage}
        color={color}
        sx={{ height: 8, borderRadius: 1 }}
      />

      {(borrowingLimit !== undefined || lendingLimit !== undefined) && (
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          {borrowingLimit !== undefined && (
            <Typography variant="caption" color="text.secondary">
              Borrow Limit: {borrowingLimit}
            </Typography>
          )}
          {lendingLimit !== undefined && (
            <Typography variant="caption" color="text.secondary">
              Lend Limit: {lendingLimit}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

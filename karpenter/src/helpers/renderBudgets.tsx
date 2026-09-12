import { Box, Chip } from '@mui/material';

/**
 * Renders a NodePool's disruption budgets, one row per budget.
 *
 * Each budget is a separate object whose fields (`nodes`, `schedule`, `duration`,
 * `reasons`) only make sense together, so budgets are grouped rather than
 * flattened into a single row of chips.
 *
 * @param budgets - The `spec.disruption.budgets` entries of a NodePool.
 * @see https://karpenter.sh/docs/concepts/disruption/#disruption-budgets
 */
export function renderDisruptionBudgets(budgets: any[] = []) {
  if (!budgets || budgets.length === 0) return 'No budgets set';
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {budgets.map((budget, index) => (
        <Box key={index} sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Object.entries(budget).map(([k, v]) => (
            <Chip key={k} label={`${k}: ${v}`} variant="outlined" size="small" />
          ))}
        </Box>
      ))}
    </Box>
  );
}

import { Box, Chip } from '@mui/material';

export function renderDisruptionBudgets(budgets: any[] = []) {
  if (!budgets || budgets.length === 0) return 'No budgets set';
  return (
    <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {budgets.map((budget, index) =>
        Object.entries(budget).map(([k, v]) => (
          <Chip key={index} label={`${k}: ${v}`} variant="outlined" size="small" />
        ))
      )}
    </Box>
  );
}

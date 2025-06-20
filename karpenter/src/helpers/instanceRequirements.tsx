import { MetadataDictGrid } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box } from '@mui/material';

export function renderInstanceRequirements(requirements: any[] = []) {
  if (!requirements || requirements.length === 0) return 'No requirements';

  const requirementsDict = requirements.reduce((acc, req) => {
    acc[req.key] = `${req.operator} ${req.values?.join(', ') || ''}`.trim();
    return acc;
  }, {} as Record<string, string>);

  return (
    <Box sx={{ mt: 1 }}>
      <MetadataDictGrid dict={requirementsDict} showKeys />
    </Box>
  );
}

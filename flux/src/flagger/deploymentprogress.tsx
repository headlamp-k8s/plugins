import { LinearProgress, Box } from '@mui/material';

export function DeploymentProgress({ canary }) {
  const progress = (canary.status?.canaryWeight / canary.spec.analysis.maxWeight) * 100;
    
    if (isNaN(progress)) return (<Box sx={{ width: '100%' }}><LinearProgress value={0} variant="determinate"/></Box>);
    
  return (
    <Box sx={{ width: '100%' }}>
      <LinearProgress value={progress} variant="determinate"/>
      <p>{progress.toFixed(2)}% Complete</p>
    </Box>
  );
}

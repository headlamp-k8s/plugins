import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Box, LinearProgress } from '@mui/material';

export function DeploymentProgress({ canary }) {
  const { t } = useTranslation();
  const progress = (canary.status?.canaryWeight / canary.spec.analysis.maxWeight) * 100;

  if (isNaN(progress))
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress
          value={0}
          variant="determinate"
          aria-label={t('Canary progress')}
          aria-valuetext={t('No progress data')}
        />
      </Box>
    );

  const progressText = t('{{progress}}% Complete', { progress: progress.toFixed(2) });

  return (
    <Box sx={{ width: '100%' }}>
      <LinearProgress
        value={progress}
        variant="determinate"
        aria-label={t('Canary progress')}
        aria-valuetext={progressText}
      />
      <p>{progressText}</p>
    </Box>
  );
}

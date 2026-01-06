import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import React from 'react';
import { KRevision, KService } from '../../../../../resources/knative';
import TrafficSplittingSection from './TrafficSplittingSection';

type KServiceSectionProps = {
  kservice: KService;
};

export function TrafficSection({ kservice }: KServiceSectionProps) {
  const {
    cluster,
    metadata: { name },
  } = kservice;
  const namespace = kservice.metadata.namespace!;
  const clusters = [kservice.cluster];

  const revisionListResult = KRevision.useList({
    clusters,
    namespace,
    labelSelector: `serving.knative.dev/service=${name}`,
  });

  const error = React.useMemo(() => {
    if (revisionListResult.error) {
      return (
        (revisionListResult.error as { message?: string })?.message || 'Failed to load revisions'
      );
    }
    return null;
  }, [revisionListResult]);

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (revisionListResult.isLoading || !revisionListResult.items) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <TrafficSplittingSection
        cluster={cluster}
        kservice={kservice}
        revisions={revisionListResult.items}
      />
    </Stack>
  );
}

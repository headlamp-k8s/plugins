import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';

/**
 * Shown in place of any Strimzi list view when the kafka.strimzi.io API
 * group is not present on the cluster (i.e. the Strimzi operator is not
 * installed).
 */
export function StrimziNotInstalledMessage() {
  return (
    <SectionBox title="Strimzi not detected">
      <Box sx={{ p: 2 }}>
        <Typography variant="body1" gutterBottom>
          The Strimzi operator was not found on this cluster. Install Strimzi to
          use this plugin.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          See the{' '}
          <Link
            href="https://strimzi.io/quickstarts/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Strimzi quick-start guide
          </Link>{' '}
          for installation instructions.
        </Typography>
      </Box>
    </SectionBox>
  );
}

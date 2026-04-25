import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, Paper } from '@mui/material';

/**
 * Standalone intro card for the Strimzi Headlamp plugin.
 * No cluster or K8s dependency – use this to confirm Storybook runs.
 */
function StrimziIntro() {
  return (
    <Box sx={{ p: 3, maxWidth: 560 }}>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Strimzi Headlamp Plugin
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This Storybook is for the Strimzi plugin. Here you can develop and review UI
          (Kafka list, topics, users, topology) with mock data—no cluster required.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add more <code>*.stories.tsx</code> next to your components to see them here.
        </Typography>
      </Paper>
    </Box>
  );
}

const meta: Meta<typeof StrimziIntro> = {
  title: 'strimzi/Intro',
  component: StrimziIntro,
};
export default meta;

type Story = StoryObj<typeof StrimziIntro>;

export const Default: Story = {};

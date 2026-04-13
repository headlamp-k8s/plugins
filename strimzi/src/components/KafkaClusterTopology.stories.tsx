/**
 * KafkaClusterTopology uses React Flow, ApiProxy, and large Strimzi graph logic.
 * Importing it in Storybook previously triggered headlamp KubeObject init issues.
 */
import React from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { Meta, StoryObj } from '@storybook/react';

function TopologyNote() {
  return (
    <Box sx={{ p: 2, maxWidth: 640 }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        The interactive topology graph is rendered by <strong>KafkaClusterTopology</strong> inside{' '}
        <strong>KafkaTopologyModal</strong> in the real app.
      </Alert>
      <Typography variant="body2" color="text.secondary" paragraph>
        Open <strong>Strimzi → Kafka Clusters</strong> in Headlamp and click <strong>View</strong> in the Topology
        column to see pods, StrimziPodSets, and zoom controls (React Flow).
      </Typography>
      <Typography variant="body2" color="text.secondary">
        For a modal shell-only preview in Storybook, see <code>strimzi/KafkaTopologyModal</code>.
      </Typography>
    </Box>
  );
}

const meta: Meta = {
  title: 'strimzi/KafkaClusterTopology',
  parameters: {
    docs: {
      description: {
        component: 'Topology graph is not bundled in Storybook; use Headlamp with a cluster.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Documentation: Story = {
  render: () => <TopologyNote />,
};

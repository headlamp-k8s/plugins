/**
 * ResourceEditor loads/saves YAML via ApiProxy and Monaco — not suitable for Storybook without heavy MSW.
 * This story documents the component; use Headlamp + cluster to exercise it.
 */
import React from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { Meta, StoryObj } from '@storybook/react';

function ResourceEditorNote() {
  return (
    <Box sx={{ p: 2, maxWidth: 560 }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>ResourceEditor</strong> opens from the topology view when editing a Strimzi resource. It uses{' '}
        <code>ApiProxy</code> and <code>@monaco-editor/react</code>.
      </Alert>
      <Typography variant="body2" color="text.secondary">
        Run the plugin in Headlamp, open a Kafka cluster topology, and use edit actions to see this component.
      </Typography>
    </Box>
  );
}

const meta: Meta = {
  title: 'strimzi/ResourceEditor',
  parameters: {
    docs: {
      description: {
        component: 'No live preview in Storybook; requires backend and Monaco bundle.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Documentation: Story = {
  render: () => <ResourceEditorNote />,
};

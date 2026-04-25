import { LogViewer } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import type { Meta, StoryFn } from '@storybook/react';
import React from 'react';

type JobLogsViewerStoryProps = {
  helperMessage: string | null;
  logs: string[];
  showReconnectButton: boolean;
};

function JobLogsViewerStoryHarness({
  helperMessage,
  logs,
  showReconnectButton,
}: JobLogsViewerStoryProps) {
  const [selectedPodName, setSelectedPodName] = React.useState<'all' | string>('all');
  const [selectedContainer, setSelectedContainer] = React.useState('main');
  const [lines, setLines] = React.useState(100);
  const [showPrevious, setShowPrevious] = React.useState(false);
  const [showTimestamps, setShowTimestamps] = React.useState(true);
  const [follow, setFollow] = React.useState(true);

  const topActions = [
    <Box
      key="job-log-controls"
      sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}
    >
      <Box
        sx={{
          minHeight: theme => theme.spacing(3),
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
        >
          {helperMessage || ' '}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, width: '100%' }}>
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel id="story-job-logs-pod-label">Select Pod</InputLabel>
          <Select
            id="story-job-logs-pod-select"
            labelId="story-job-logs-pod-label"
            value={selectedPodName}
            label="Select Pod"
            onChange={event => setSelectedPodName(event.target.value as 'all' | string)}
          >
            <MenuItem value="all">All Pods</MenuItem>
            <MenuItem value="job-worker-0">job-worker-0</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel id="story-job-logs-container-label">Container</InputLabel>
          <Select
            id="story-job-logs-container-select"
            labelId="story-job-logs-container-label"
            value={selectedContainer}
            label="Container"
            onChange={event => setSelectedContainer(event.target.value)}
          >
            <MenuItem value="main">main</MenuItem>
            <MenuItem value="sidecar">sidecar</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="story-job-logs-lines-label">Lines</InputLabel>
          <Select
            id="story-job-logs-lines-select"
            labelId="story-job-logs-lines-label"
            value={lines}
            label="Lines"
            onChange={event => setLines(Number(event.target.value))}
          >
            {[100, 1000, 2500].map(option => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
            <MenuItem value={-1}>All</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          label="Show previous"
          control={
            <Switch checked={showPrevious} onChange={() => setShowPrevious(value => !value)} />
          }
        />
        <FormControlLabel
          label="Timestamps"
          control={
            <Switch checked={showTimestamps} onChange={() => setShowTimestamps(value => !value)} />
          }
        />
        <FormControlLabel
          label="Follow"
          control={<Switch checked={follow} onChange={() => setFollow(value => !value)} />}
        />
      </Box>
    </Box>,
  ];

  return (
    <LogViewer
      noDialog
      open
      title="example-job"
      downloadName="example-job"
      logs={logs}
      topActions={topActions}
      onClose={() => {}}
      handleReconnect={() => {}}
      showReconnectButton={showReconnectButton}
    />
  );
}

const meta = {
  title: 'Jobs/JobLogsViewer',
  component: JobLogsViewerStoryHarness,
} satisfies Meta<typeof JobLogsViewerStoryHarness>;

export default meta;

const Template: StoryFn<typeof JobLogsViewerStoryHarness> = args => (
  <JobLogsViewerStoryHarness {...args} />
);

export const SinglePod = Template.bind({});
SinglePod.args = {
  helperMessage: null,
  logs: ['2026-04-18T13:16:58.715082657Z hello from template\n'],
  showReconnectButton: false,
};

export const AllPods = Template.bind({});
AllPods.args = {
  helperMessage: null,
  logs: [
    '[job-worker-0/main] 2026-04-18T13:16:58.715082657Z hello from template\n',
    '[job-worker-1/main] 2026-04-18T13:16:59.715082657Z processing batch\n',
  ],
  showReconnectButton: false,
};

export const NoPods = Template.bind({});
NoPods.args = {
  helperMessage:
    'No pods have been created for this Job yet. It may still be pending or unschedulable. Check Pod Issues and Events.',
  logs: [],
  showReconnectButton: false,
};

export const NoLogsYet = Template.bind({});
NoLogsYet.args = {
  helperMessage:
    'No logs available yet. The selected container may not have started or may not have emitted output. Check Pod Issues and Events.',
  logs: [],
  showReconnectButton: false,
};

export const ReconnectVisible = Template.bind({});
ReconnectVisible.args = {
  helperMessage: null,
  logs: ['2026-04-18T13:16:58.715082657Z hello from template\n'],
  showReconnectButton: true,
};

import { configureStore } from '@reduxjs/toolkit';
import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import CommandDialog from './CommandDialog';

const mockReducer = () => ({
  config: {
    clusters: {
      'test-cluster': {
        name: 'test-cluster',
        status: 'running',
      },
    },
  },
});

const store = configureStore({
  reducer: mockReducer,
});

export default {
  title: 'Components/CommandDialog',
  component: CommandDialog,
  decorators: [
    Story => (
      <Provider store={store}>
        <Story />
      </Provider>
    ),
  ],
  argTypes: {
    onClose: { action: 'onClose' },
    onConfirm: { action: 'onConfirm' },
  },
} as Meta<typeof CommandDialog>;

const Template: StoryFn<typeof CommandDialog> = args => <CommandDialog {...args} />;

export const Ask = Template.bind({});
Ask.args = {
  open: true,
  initialClusterName: 'test-cluster',
  command: 'start',
  title: 'Start Cluster',
  acting: false,
  running: false,
  commandDone: false,
  useGrid: false,
};

export const NotRunningYet = Template.bind({});
NotRunningYet.args = {
  open: true,
  initialClusterName: 'test-cluster',
  command: 'stop',
  title: 'Stop Cluster',
  acting: true,
  running: false,
  commandDone: false,
  useGrid: false,
};

export const RunningCommand = Template.bind({});
RunningCommand.args = {
  open: true,
  initialClusterName: 'test-cluster',
  command: 'stop',
  title: 'Stop Cluster',
  acting: true,
  running: true,
  actingLines: ['Stopping cluster...', 'Cluster stopped successfully'],
  commandDone: false,
  useGrid: false,
};

export const CommandCompleted = Template.bind({});
CommandCompleted.args = {
  open: true,
  initialClusterName: 'test-cluster',
  command: 'delete',
  title: 'Delete Cluster',
  actingLines: ['Deleting cluster...', 'Cluster deleted successfully'],
  acting: true,
  running: true,
  commandDone: true,
  useGrid: false,
};

export const GridAsk = Template.bind({});
GridAsk.args = {
  open: true,
  initialClusterName: '',
  command: 'start',
  title: 'Start Cluster',
  acting: false,
  running: false,
  commandDone: false,
  useGrid: true,
  askClusterName: true,
};

export const GridNotRunningYet = Template.bind({});
GridNotRunningYet.args = {
  open: true,
  initialClusterName: 'test-cluster',
  command: 'stop',
  title: 'Stop Cluster',
  acting: true,
  running: false,
  commandDone: false,
  useGrid: true,
};

export const GridRunningCommand = Template.bind({});
GridRunningCommand.args = {
  open: true,
  initialClusterName: 'test-cluster',
  command: 'stop',
  title: 'Stop Cluster',
  acting: true,
  running: true,
  actingLines: ['Stopping cluster...', 'Cluster stopped successfully'],
  commandDone: false,
  useGrid: true,
};

export const GridCommandCompleted = Template.bind({});
GridCommandCompleted.args = {
  open: true,
  initialClusterName: 'test-cluster',
  command: 'delete',
  title: 'Delete Cluster',
  actingLines: ['Deleting cluster...', 'Cluster deleted successfully'],
  acting: true,
  running: true,
  commandDone: true,
  useGrid: true,
};

export const CommandSucceeded = Template.bind({});
CommandSucceeded.args = {
  open: true,
  initialClusterName: 'test-cluster',
  command: 'start',
  title: 'Start Cluster',
  actingLines: [
    'Starting cluster...',
    'Done! kubectl is now configured to use "test-cluster" cluster',
  ],
  acting: true,
  running: true,
  commandDone: true,
  commandError: false,
  useGrid: false,
};

export const GridCommandSucceeded = Template.bind({});
GridCommandSucceeded.args = {
  ...CommandSucceeded.args,
  useGrid: true,
};

export const CommandFailed = Template.bind({});
CommandFailed.args = {
  open: true,
  initialClusterName: 'test-cluster',
  command: 'start',
  title: 'Start Cluster',
  acting: true,
  running: true,
  actingLines: ['Starting cluster...', 'Error: unable to start host: provider not found'],
  commandDone: true,
  commandError: true,
  useGrid: false,
};

export const GridCommandFailed = Template.bind({});
GridCommandFailed.args = {
  ...CommandFailed.args,
  useGrid: true,
};

export const MinikubeNotFound = Template.bind({});
MinikubeNotFound.args = {
  open: true,
  initialClusterName: 'test-cluster',
  command: 'start',
  title: 'Start Cluster',
  acting: false,
  running: false,
  commandDone: false,
  useGrid: false,
  minikubeAvailable: false,
};

export const MinikubeChecking = Template.bind({});
MinikubeChecking.args = {
  open: true,
  initialClusterName: 'test-cluster',
  command: 'start',
  title: 'Start Cluster',
  acting: false,
  running: false,
  commandDone: false,
  useGrid: false,
  minikubeAvailable: null,
};

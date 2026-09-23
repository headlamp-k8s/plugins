import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { SettingsPure, SettingsPureProps } from './SettingsPure';

export default {
  title: 'Components/SettingsPure',
  component: SettingsPure,
} as Meta;

const Template: StoryFn<SettingsPureProps> = args => <SettingsPure {...args} />;

export const Default = Template.bind({});
Default.args = {
  data: {
    cluster1: { grafanaUrl: 'https://Grafana.example.com' },
    cluster2: { grafanaUrl: '' },
  },
  clusters: { cluster1: {}, cluster2: {} },
  selectedCluster: 'cluster1',
  validUrl: true,
  onClusterChange: () => {},
  onUrlChange: () => {},
};

export const InvalidUrl = Template.bind({});
InvalidUrl.args = {
  ...Default.args,
  validUrl: false,
  data: {
    cluster1: { grafanaUrl: 'invalid-url' },
    cluster2: { grafanaUrl: '' },
  },
};

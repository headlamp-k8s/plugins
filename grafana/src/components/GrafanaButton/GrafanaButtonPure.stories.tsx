import { Meta, StoryFn } from '@storybook/react';
import { GrafanaButtonPure, GrafanaButtonPureProps } from './GrafanaButtonPure';

export default {
  title: 'Components/GrafanaButtonPure',
  component: GrafanaButtonPure,
  argTypes: {
    dashboard: { control: 'text' },
    grafanaUrl: { control: 'text' },
  },
} as Meta;

const Template: StoryFn<GrafanaButtonPureProps> = args => <GrafanaButtonPure {...args} />;

export const Default = Template.bind({});
Default.args = {
  dashboard: '/d/example',
  grafanaUrl: 'https://grafana.example.com',
};

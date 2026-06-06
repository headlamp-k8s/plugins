import { Meta, StoryFn } from '@storybook/react';
import { GrafanaButtonPure, GrafanaButtonPureProps } from './GrafanaButtonPure';

export default {
  title: 'Components/GrafanaButtonPure',
  component: GrafanaButtonPure,
  argTypes: {
    kubernetesId: { control: 'text' },
    namespace: { control: 'text' },
    grafanaUrl: { control: 'text' },
    isInIframe: { control: 'boolean' },
    onIframeMessage: { action: 'iframe message' },
  },
} as Meta;

const Template: StoryFn<GrafanaButtonPureProps> = args => <GrafanaButtonPure {...args} />;

export const Default = Template.bind({});
Default.args = {
  kubernetesId: 'example-id',
  namespace: 'default',
  grafanaUrl: 'https://Grafana.example.com',
  isInIframe: false,
};

export const InIframe = Template.bind({});
InIframe.args = {
  ...Default.args,
  isInIframe: true,
  onIframeMessage: (message: { action: string; redirectPath: string }) => {
    window.alert(`iframe message: ${JSON.stringify(message)}`);
  },
};

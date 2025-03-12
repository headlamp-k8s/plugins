import { Meta, StoryFn } from '@storybook/react';
import { BackstageButtonPure, BackstageButtonPureProps } from './BackstageButtonPure';

export default {
  title: 'Components/BackstageButtonPure',
  component: BackstageButtonPure,
  argTypes: {
    kubernetesId: { control: 'text' },
    namespace: { control: 'text' },
    backstageUrl: { control: 'text' },
    isInIframe: { control: 'boolean' },
    onIframeMessage: { action: 'iframe message' },
  },
} as Meta;

const Template: StoryFn<BackstageButtonPureProps> = args => <BackstageButtonPure {...args} />;

export const Default = Template.bind({});
Default.args = {
  kubernetesId: 'example-id',
  namespace: 'default',
  backstageUrl: 'https://backstage.example.com',
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

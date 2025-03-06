import { Meta, StoryFn } from '@storybook/react';
import LoadingButton, { LoadingButtonProps } from './LoadingButton';

export default {
  title: 'LoadingButton',
  component: LoadingButton,
} as Meta;

// Template for a story
const Template: StoryFn<LoadingButtonProps> = args => <LoadingButton {...args} />;

// Default state story
export const Default = Template.bind({});
Default.args = {
  progress: 0,
  onCancel: () => console.log('Cancel clicked'),
};

// Story with progress
export const WithProgress = Template.bind({});
WithProgress.args = {
  progress: 50,
  onCancel: () => console.log('Cancel clicked'),
};

// Story with progress at 100%
export const CompleteProgress = Template.bind({});
CompleteProgress.args = {
  progress: 100,
  onCancel: () => console.log('Cancel clicked'),
};

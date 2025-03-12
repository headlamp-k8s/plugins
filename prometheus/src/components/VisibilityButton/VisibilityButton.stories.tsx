import { Meta, StoryFn } from '@storybook/react';
import { VisibilityButton } from './VisibilityButton';

export default {
  title: 'VisibilityButton',
  component: VisibilityButton,
} as Meta;

const Template: StoryFn<{}> = args => <VisibilityButton {...args} />;

export const Default = Template.bind({});

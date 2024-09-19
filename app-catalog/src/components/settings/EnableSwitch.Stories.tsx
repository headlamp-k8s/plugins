import { Meta, Story } from '@storybook/react';
import React from 'react';
import { EnableSwitch } from './EnableSwitch';

export default {
  title: 'Components/EnableSwitch',
  component: EnableSwitch,
} as Meta;

const Template: Story = args => <EnableSwitch {...args} />;

export const CheckedTrue = Template.bind({});
CheckedTrue.args = {
  checked: true,
};

export const CheckedFalse = Template.bind({});
CheckedFalse.args = {
  checked: false,
};

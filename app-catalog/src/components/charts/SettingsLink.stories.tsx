import { Meta, Story } from '@storybook/react';
import React from 'react';
import { SettingsLink } from './SettingsLink';

export default {
    title: 'Components/SettingsLink',
    component: SettingsLink,
} as Meta;

const Template: Story = (args) => <SettingsLink {...args} />;

export const Title = Template.bind({});
Title.args = {};
import { Meta, Story } from '@storybook/react';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { SettingsLink } from './SettingsLink';

export default {
  title: 'Components/SettingsLink',
  component: SettingsLink,
  decorators: [
    Story => (
      <Router>
        <Story />
      </Router>
    ),
  ],
} as Meta;

const Template: Story = args => <SettingsLink {...args} />;

export const Title = Template.bind({});
Title.args = {};

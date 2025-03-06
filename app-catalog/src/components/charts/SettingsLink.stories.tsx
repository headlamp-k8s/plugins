import { Meta, StoryFn } from '@storybook/react';
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

const Template: StoryFn = args => <SettingsLink {...args} />;

export const Title = Template.bind({});
Title.args = {};

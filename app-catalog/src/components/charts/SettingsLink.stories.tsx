import { configureStore } from '@reduxjs/toolkit';
import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { SettingsLink } from './SettingsLink';

const mockStore = configureStore({
  reducer: (state = { drawerMode: { isDetailDrawerEnabled: false } }) => state,
});

export default {
  title: 'Components/SettingsLink',
  component: SettingsLink,
  decorators: [
    Story => (
      <Router>
        <Provider store={mockStore}>
          <Story />
        </Provider>
      </Router>
    ),
  ],
} as Meta;

const Template: StoryFn = args => <SettingsLink {...args} />;

export const Title = Template.bind({});
Title.args = {};

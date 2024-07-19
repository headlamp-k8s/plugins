import { configureStore } from '@reduxjs/toolkit';
import { Meta, Story } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { PurePluginInstalledList, PurePluginInstalledListProps } from './InstalledList';

const store = configureStore({
  reducer: {
    config: (state = { settings: { tableRowsPerPageOptions: [10, 20, 50] } }) => state,
  },
});

export default {
  title: 'InstalledList',
  component: PurePluginInstalledList,
  decorators: [
    Story => (
      <Provider store={store}>
        <BrowserRouter>
          <Story />
        </BrowserRouter>
      </Provider>
    ),
  ],
} as Meta;

const Template: Story<PurePluginInstalledListProps> = args => <PurePluginInstalledList {...args} />;

const samplePlugins = [
  {
    pluginName: 'plugin1',
    pluginTitle: 'Plugin 1',
    pluginVersion: '1.0.0',
    folderName: true,
    repoName: 'repo1',
    author: 'Author 1',
  },
  {
    pluginName: 'plugin2',
    pluginTitle: 'Plugin 2',
    pluginVersion: '1.2.0',
    folderName: true,
    repoName: 'repo2',
    author: 'Author 2',
  },
];

export const Default = Template.bind({});
Default.args = {
  installedPlugins: samplePlugins,
  error: null,
};

export const WithError = Template.bind({});
WithError.args = {
  installedPlugins: null,
  error: 'Failed to load plugins.',
};

export const Empty = Template.bind({});

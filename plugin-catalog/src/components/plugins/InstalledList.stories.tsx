import { configureStore } from '@reduxjs/toolkit';
import { Meta, StoryFn } from '@storybook/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { PurePluginInstalledList, PurePluginInstalledListProps } from './InstalledList';

const store = configureStore({
  reducer: (
    state = {
      drawerMode: { isDetailDrawerEnabled: false },
      config: { settings: { tableRowsPerPageOptions: [10, 20, 50] } },
    }
  ) => state,
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

const Template: StoryFn<PurePluginInstalledListProps> = args => (
  <PurePluginInstalledList {...args} />
);

const samplePlugins = [
  {
    artifacthub: 'abcde1',
    pluginName: 'plugin1',
    pluginTitle: 'Plugin 1',
    pluginVersion: '1.0.0',
    artifacthubVersion: '1.0.0',
    folderName: 'plugin1',
    repoName: 'repo1',
    author: 'Author 1',
  },
  {
    artifacthub: 'abcde2',
    pluginName: 'plugin2',
    pluginTitle: 'Plugin 2',
    pluginVersion: '1.2.0',
    artifacthubVersion: '1.2.0',
    folderName: 'plugin2',
    repoName: 'repo2',
    author: 'Author 2',
  },
];

const availableVersionsWithUpdate = {
  plugin1: '2.0.0',
  plugin2: '1.2.0',
};

export const Default = Template.bind({});
Default.args = {
  catalogPlugins: samplePlugins,
  nonCatalogPlugins: [],
  availableVersions: {},
  error: null,
};

export const WithUpdateAvailable = Template.bind({});
WithUpdateAvailable.args = {
  catalogPlugins: samplePlugins,
  nonCatalogPlugins: [],
  availableVersions: availableVersionsWithUpdate,
  error: null,
};

export const WithError = Template.bind({});
WithError.args = {
  catalogPlugins: null,
  nonCatalogPlugins: [],
  availableVersions: {},
  error: 'Failed to load plugins.',
};

export const Empty = Template.bind({});
Empty.args = {
  catalogPlugins: [],
  nonCatalogPlugins: [],
  availableVersions: {},
  error: null,
};

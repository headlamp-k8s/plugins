import { configureStore } from '@reduxjs/toolkit';
import { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import ReleaseList from './List';

export default {
  title: 'components/release/List',
  component: ReleaseList,
} as Meta;

const mockReleases = [
  {
    name: 'example-release-11',
    namespace: 'default',
    chart: {
      metadata: {
        name: 'example-chart-1',
        appVersion: '1.0.0',
        icon: 'https://via.placeholder.com/50',
      },
    },
    version: '1.0',
    info: {
      status: 'deployed',
      last_deployed: '2023-10-23T12:00:00Z',
    },
  },
  {
    name: 'example-release-2',
    namespace: 'default',
    chart: {
      metadata: {
        name: 'example-chart-2',
        appVersion: '2.0.0',
        icon: 'https://via.placeholder.com/50',
      },
    },
    version: '2.0',
    info: {
      status: 'error',
      last_deployed: '2023-10-24T12:00:00Z',
    },
  },
];

const initialState = {
  config: {
    settings: {
      tableRowsPerPageOptions: [15, 25, 50],
    },
  },
};

// a mock store that is completely empty
const mockStore = configureStore({
  reducer: (state = initialState) => state,
});

const Template: Story = args => (
  <Provider store={mockStore}>
    <BrowserRouter>
      <ReleaseList {...args} fetchReleases={() => Promise.resolve({ releases: mockReleases })} />
    </BrowserRouter>
  </Provider>
);

export const Default = Template.bind({});
Default.args = {};

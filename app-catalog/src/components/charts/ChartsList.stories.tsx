import { configureStore } from '@reduxjs/toolkit';
import { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ChartsList } from './List';

export default {
  title: 'components/charts/List',
  component: ChartsList,
} as Meta;

const mockCharts = [
  {
    name: 'MockChart1',
    version: '1.0',
    description: 'This is a mock chart description.',
    logo_image_id: '0503add5-3fce-4b63-bbf3-b9f649512a86',
    repository: {
      name: 'MockRepo',
      url: 'https://example.com',
    },
  },
  {
    name: 'MockChart2',
    version: '1.1',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Donec et mollis dolor.',
    logo_image_id: 'c711f9f9-28b3-4ee8-98a2-30e00abf9f02',
    repository: {
      name: 'MockRepo2',
      url: 'https://example2.com',
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

const mockStore = configureStore({
  reducer: (state = initialState) => state,
});

const Template: Story = args => (
  <Provider store={mockStore}>
    <BrowserRouter>
      <ChartsList {...args} />
    </BrowserRouter>
  </Provider>
);

export const EmptyCharts = Template.bind({});
EmptyCharts.args = {
  fetchCharts: () =>
    Promise.resolve({
      packages: [],
      facets: [
        {
          title: 'Category',
          options: [{ name: 'All', total: 0 }],
        },
      ],
    }),
};

export const SomeCharts = Template.bind({});
SomeCharts.args = {
  fetchCharts: () =>
    Promise.resolve({
      packages: mockCharts,
      facets: [
        {
          title: 'Category',
          options: [{ name: 'All', total: 0 }],
        },
      ],
    }),
};

import { configureStore } from '@reduxjs/toolkit';
import { Meta, StoryFn } from '@storybook/react';
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
  {
    name: 'MockChart3',
    version: '1.0',
    description: 'This is a mock chart description.',
    logo_image_id: 'zzzzz-3fce-4b63-bbf3-b9f649512a86',
    repository: {
      name: 'MockRepoy',
      url: 'https://exampley.com',
      verified_publisher: true,
    },
  },
  {
    name: 'MockChart4',
    version: '1.1',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Donec et mollis dolor.',
    logo_image_id: 'zzzzz-28b3-4ee8-98a2-30e00abf9f02',
    repository: {
      name: 'MockRepo2y',
      url: 'https://example2y.com',
      verified_publisher: true,
    },
  },
];

const mockFacets = [{ title: 'Category', options: [{ name: 'All', total: 0 }] }];

function fetchMockCharts(_search: string | undefined, verified: boolean) {
  const packages = verified ? mockCharts.filter(c => c.repository.verified_publisher) : mockCharts;
  return Promise.resolve({ data: { packages, facets: mockFacets }, total: packages.length });
}

const initialStateTrue = {
  pluginConfigs: { 'app-catalog': { showOnlyVerified: true } },
  config: { settings: { tableRowsPerPageOptions: [15, 25, 50] } },
};

const initialStateFalse = {
  pluginConfigs: { 'app-catalog': { showOnlyVerified: false } },
  config: { settings: { tableRowsPerPageOptions: [15, 25, 50] } },
};

interface TemplateProps {
  initialState?: {
    pluginConfigs: { 'app-catalog': { showOnlyVerified: boolean } };
    config: { settings: { tableRowsPerPageOptions: number[] } };
  };
  fetchCharts?: (
    search: string | undefined,
    verified: boolean,
    category: { title: string; value: number },
    page: number,
    limit?: number
  ) => Promise<{ data: { packages: unknown[]; facets: unknown[] }; total: number }>;
}

const Template: StoryFn<TemplateProps> = ({ initialState, fetchCharts, ...args }) => {
  const mockStore = configureStore({
    reducer: (state = { ...initialState, drawerMode: { isDetailDrawerEnabled: false } }) => state,
  });

  return (
    <Provider store={mockStore}>
      <BrowserRouter>
        <ChartsList fetchCharts={fetchCharts} {...args} />
      </BrowserRouter>
    </Provider>
  );
};

export const EmptyCharts = Template.bind({});
EmptyCharts.args = {
  initialState: initialStateFalse,
  fetchCharts: () => Promise.resolve({ data: { packages: [], facets: mockFacets }, total: 0 }),
};

export const SomeCharts = Template.bind({});
SomeCharts.args = {
  initialState: initialStateFalse,
  fetchCharts: fetchMockCharts,
};

export const WithShowOnlyVerifiedTrue = Template.bind({});
WithShowOnlyVerifiedTrue.args = {
  initialState: initialStateTrue,
  fetchCharts: fetchMockCharts,
};

export const WithShowOnlyVerifiedFalse = Template.bind({});
WithShowOnlyVerifiedFalse.args = {
  initialState: initialStateFalse,
  fetchCharts: fetchMockCharts,
};

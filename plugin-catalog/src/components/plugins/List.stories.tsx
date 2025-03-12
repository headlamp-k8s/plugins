// src/components/PurePluginList.stories.tsx

import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { PluginPackage, PurePluginList, PurePluginListProps } from './List';

export default {
  title: 'List',
  component: PurePluginList,
  decorators: [
    Story => {
      return (
        <BrowserRouter>
          <Story />
        </BrowserRouter>
      );
    },
  ],
} as Meta;

const Template: StoryFn<PurePluginListProps> = args => <PurePluginList {...args} />;

const samplePlugins: PluginPackage[] = [
  {
    package_id: '1',
    name: 'sample-plugin-1',
    normalized_name: 'sample-plugin-1',
    logo_image_id: 'default_logo',
    stars: 5,
    display_name: 'Sample Plugin 1',
    description: 'This is a sample plugin description that demonstrates the PluginCard component.',
    version: '1.0.0',
    deprecated: false,
    has_values_schema: false,
    signed: true,
    production_organizations_count: 1,
    ts: Date.now(),
    official: true,
    repository: {
      url: 'https://example.com',
      kind: 0,
      name: 'sample-repo-1',
      official: true,
      user_alias: 'user1',
      display_name: 'Sample Repository 1',
      repository_id: 'repo1',
      scanner_disabled: false,
      verified_publisher: true,
    },
  },
  {
    package_id: '2',
    name: 'sample-plugin-2',
    normalized_name: 'sample-plugin-2',
    logo_image_id: 'default_logo',
    stars: 4,
    display_name: 'Sample Plugin 2',
    description:
      'This is another sample plugin description that demonstrates the PluginCard component.',
    version: '1.0.1',
    deprecated: false,
    has_values_schema: false,
    signed: true,
    production_organizations_count: 1,
    ts: Date.now(),
    official: true,
    repository: {
      url: 'https://example.com',
      kind: 0,
      name: 'sample-repo-2',
      official: true,
      user_alias: 'user2',
      display_name: 'Sample Repository 2',
      repository_id: 'repo2',
      scanner_disabled: false,
      verified_publisher: true,
    },
  },
];

export const Default = Template.bind({});
Default.args = {
  search: '',
  plugins: samplePlugins,
  totalPages: 2,
  page: 1,
  onSearchChange: event => console.log('Search change:', event.target.value),
  onPageChange: (event, page) => console.log('Page change:', page),
};

export const WithSearchTerm = Template.bind({});
WithSearchTerm.args = {
  ...Default.args,
  search: 'sample',
};

export const Empty = Template.bind({});
Empty.args = {
  search: '',
  plugins: [],
  totalPages: 0,
  page: 1,
  onSearchChange: event => console.log('Search change:', event.target.value),
  onPageChange: (event, page) => console.log('Page change:', page),
};

export const Loading = Template.bind({});

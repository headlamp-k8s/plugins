// src/components/PluginCard.stories.tsx

import { Meta, Story } from '@storybook/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { PluginPackage } from './List';
import { PluginCard } from './PluginCard';

export default {
  title: 'PluginCard',
  component: PluginCard,
  decorators: [
    Story => {
      return (
        <BrowserRouter>
          <Story />
        </BrowserRouter>
      );
    },
  ],
  argTypes: {
    logo_image_id: { control: 'text' },
    display_name: { control: 'text' },
    name: { control: 'text' },
    version: { control: 'text' },
    description: { control: 'text' },
    repository: { control: 'object' },
    official: { control: 'boolean' },
  },
} as Meta;

const Template: Story<PluginPackage> = args => <PluginCard plugin={args} />;

export const Default = Template.bind({});
Default.args = {
  package_id: 'eb35c4ce-118d-4d39-99b0-d5403016c97f',
  name: 'appcatalog_headlamp_plugin',
  normalized_name: 'appcatalog_headlamp_plugin',
  logo_image_id: '9efd017f-25e8-4c7f-a80f-e920dc1dd4ac',
  stars: 0,
  display_name: 'App catalog Headlamp Plugin Test',
  description: 'App catalog plugin for Headlamp',
  version: '0.0.3',
  deprecated: false,
  has_values_schema: false,
  signed: false,
  production_organizations_count: 0,
  ts: 1708839350,
  repository: {
    url: 'https://github.com/yolossn/headlamp-plugins',
    kind: 21,
    name: 'test-123',
    official: true,
    user_alias: 'yolossn',
    display_name: 'Headlamp plugins',
    repository_id: '410eaa8a-f2f6-41b1-81af-81dddfce0fe0',
    scanner_disabled: false,
    verified_publisher: true,
  },
};

export const LongDescription = Template.bind({});
LongDescription.args = {
  ...Default.args,
  description:
    'This is a sample plugin description that is intentionally long to demonstrate how the PluginCard component handles overflow text. The description continues with more details and information about the plugin to ensure that it exceeds the 100 character limit.',
};

export const NoOfficialOrVerified = Template.bind({});
NoOfficialOrVerified.args = {
  ...Default.args,
  official: false,
  repository: {
    ...Default.args.repository,
    official: false,
    verified_publisher: false,
  },
};

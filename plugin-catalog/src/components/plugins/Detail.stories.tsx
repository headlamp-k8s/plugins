// src/components/PurePluginDetail.stories.tsx

import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { PluginDetailResp, PurePluginDetail, PurePluginDetailProps } from './Detail';

export default {
  title: 'Detail',
  component: PurePluginDetail,
} as Meta;

const Template: StoryFn<PurePluginDetailProps> = args => <PurePluginDetail {...args} />;

const samplePluginDetail: PluginDetailResp = {
  isInstalled: true,
  currentVersion: '1.0.0',
  packageName: 'sample-plugin',
  updateAvailable: true,
  package_id: '1',
  name: 'sample-plugin',
  normalized_name: 'sample-plugin',
  is_operator: false,
  display_name: 'Sample Plugin',
  description: 'This is a sample plugin description that demonstrates the PluginCard component.',
  logo_image_id: 'default_logo',
  readme: '# Sample Plugin\n\nThis is the README for the sample plugin.',
  data: {
    'headlamp/plugin/archive-url': 'https://example.com/archive',
    'headlamp/plugin/distro-compat': 'Any',
    'headlamp/plugin/version-compat': '1.0.0',
    'headlamp/plugin/archive-checksum': 'abc123',
  },
  version: '1.0.0',
  available_versions: [
    { version: '1.0.0', contains_security_updates: false, prerelease: false, ts: 1625247600 },
    { version: '1.1.0', contains_security_updates: true, prerelease: false, ts: 1625334000 },
  ],
  deprecated: false,
  contains_security_updates: false,
  prerelease: false,
  signed: true,
  has_values_schema: false,
  has_changelog: false,
  ts: 1625247600,
  repository: {
    repository_id: 'repo1',
    name: 'sample-repo',
    display_name: 'Sample Repository',
    url: 'https://example.com',
    branch: 'main',
    private: false,
    kind: 0,
    verified_publisher: true,
    official: true,
    scanner_disabled: false,
    user_alias: 'user1',
  },
  stats: {
    subscriptions: 10,
    webhooks: 5,
  },
  production_organizations_count: 2,
  relative_path: '/plugins/sample-plugin',
};

export const Default = Template.bind({});
Default.args = {
  pluginDetail: samplePluginDetail,
  currentAction: null,
  currentActionState: null,
  currentActionMessage: null,
  currentActionProgress: 0,
  onInstall: () => alert('Install action triggered'),
  onUpdate: pluginName => alert(`Update action triggered for ${pluginName}`),
  onUninstall: pluginName => alert(`Uninstall action triggered for ${pluginName}`),
  onCancel: () => alert('Cancel action triggered'),
};

export const Installing = Template.bind({});
Installing.args = {
  ...Default.args,
  currentAction: 'Install',
  currentActionState: 'in-progress',
  currentActionMessage: 'Installing plugin...',
  currentActionProgress: 50,
};

export const Updating = Template.bind({});
Updating.args = {
  ...Default.args,
  currentAction: 'Update',
  currentActionState: 'in-progress',
  currentActionMessage: 'Updating plugin...',
  currentActionProgress: 70,
};

export const Uninstalling = Template.bind({});
Uninstalling.args = {
  ...Default.args,
  currentAction: 'Uninstall',
  currentActionState: 'in-progress',
  currentActionMessage: 'Uninstalling plugin...',
  currentActionProgress: 30,
};

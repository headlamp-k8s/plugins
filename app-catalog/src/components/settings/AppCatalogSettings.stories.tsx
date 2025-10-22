import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { AppCatalogSettings, AppCatalogSettingsProps } from './AppCatalogSettings';

export default {
  title: 'Components/AppCatalogSettings',
  component: AppCatalogSettings,
} as Meta;

const Template: StoryFn<AppCatalogSettingsProps> = args => <AppCatalogSettings {...args} />;

export const Default = Template.bind({});
Default.args = {};

export const ShowOnlyVerifiedTrue = Template.bind({});
ShowOnlyVerifiedTrue.args = {
  initialConfig: { showOnlyVerified: true },
};

export const ShowOnlyVerifiedFalse = Template.bind({});
ShowOnlyVerifiedFalse.args = {
  initialConfig: { showOnlyVerified: false },
};

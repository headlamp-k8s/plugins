import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Meta, Story } from '@storybook/react';
import React from 'react';
import { AppCatalogSettings, AppCatalogSettingsProps } from './AppCatalogSettings';

export default {
    title: 'Components/AppCatalogSettings',
    component: AppCatalogSettings,
} as Meta

const theme = createTheme();

const Template: Story<AppCatalogSettingsProps> = (args) => (
    <ThemeProvider theme={theme}>
        <AppCatalogSettings {...args} />
    </ThemeProvider>
);

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
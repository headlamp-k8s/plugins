import { Meta, Story } from '@storybook/react';
import React from 'react';
import { AppCatalogTitle } from './AppCatalogTitle';

export default {
    title: 'Components/AppCatalogTitle',
    component: AppCatalogTitle,
} as Meta;

const Template: Story = (args) => <AppCatalogTitle {...args} />;

export const Title = Template.bind({});
Title.args = {};
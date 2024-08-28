import { Meta, Story } from '@storybook/react';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppCatalogTitle } from './AppCatalogTitle';

export default {
    title: 'Components/AppCatalogTitle',
    component: AppCatalogTitle,
    decorators: [(Story) => <Router><Story /></Router>],
} as Meta;

const Template: Story = (args) => <AppCatalogTitle {...args} />;

export const Title = Template.bind({});
Title.args = {};
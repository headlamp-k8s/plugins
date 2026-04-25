import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import SeverityColumn from './SeverityColumn';
import { FalcoEvent } from '../types/FalcoEvent';

export default {
  title: 'falco/SeverityColumn',
  component: SeverityColumn,
} as Meta;

const Template: StoryFn<{ ev: FalcoEvent }> = args => <SeverityColumn {...args} />;

export const Notice = Template.bind({});
Notice.args = {
  ev: { priority: 'Notice' },
};

export const Warning = Template.bind({});
Warning.args = {
  ev: { priority: 'Warning' },
};

export const Critical = Template.bind({});
Critical.args = {
  ev: { priority: 'Critical' },
};

export const Error = Template.bind({});
Error.args = {
  ev: { priority: 'Error' },
};

export const Emergency = Template.bind({});
Emergency.args = {
  ev: { priority: 'Emergency' },
};

export const Alert = Template.bind({});
Alert.args = {
  ev: { priority: 'Alert' },
};

export const Debug = Template.bind({});
Debug.args = {
  ev: { priority: 'Debug' },
};

export const Info = Template.bind({});
Info.args = {
  ev: { priority: 'Informational' },
};

export const Missing = Template.bind({});
Missing.args = {
  ev: {},
};

import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import LoadingIndicator from './LoadingIndicator';

export default {
  title: 'falco/LoadingIndicator',
  component: LoadingIndicator,
} as Meta;

const Template: StoryFn<{ loading: boolean; error: string | null }> = args => (
  <LoadingIndicator {...args} />
);

export const Loading = Template.bind({});
Loading.args = {
  loading: true,
  error: null,
};

export const WithError = Template.bind({});
WithError.args = {
  loading: false,
  error: 'Failed to fetch Falco rules: connection refused',
};

export const LoadingWithError = Template.bind({});
LoadingWithError.args = {
  loading: true,
  error: 'Previous attempt failed, retrying...',
};

export const Idle = Template.bind({});
Idle.args = {
  loading: false,
  error: null,
};

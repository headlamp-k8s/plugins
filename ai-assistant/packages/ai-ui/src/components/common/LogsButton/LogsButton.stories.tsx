/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import LogsButton from './LogsButton';

export default {
  title: 'AI UI/LogsButton',
  component: LogsButton,
} as Meta;

const Template: StoryFn<React.ComponentProps<typeof LogsButton>> = args => <LogsButton {...args} />;

export const Default = Template.bind({});
Default.args = {
  logs: 'Error: connection refused\nRetrying...',
};

export const WithResourceInfo = Template.bind({});
WithResourceInfo.args = {
  logs: '2025-01-01T12:00:00Z Starting nginx\n2025-01-01T12:00:01Z Listening on port 80',
  resourceName: 'nginx-pod',
  resourceType: 'Pod',
  namespace: 'default',
  containerName: 'nginx',
};

export const EmptyLogs = Template.bind({});
EmptyLogs.args = {
  logs: '',
};

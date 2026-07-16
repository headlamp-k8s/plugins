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

import type { Meta, StoryFn } from '@storybook/react';
import LogsButton, { type LogsButtonProps } from './LogsButton';

export default {
  title: 'AI UI/LogsButton',
  component: LogsButton,
} as Meta;

const Template: StoryFn<LogsButtonProps> = args => <LogsButton {...args} />;

export const defaultLogsButtonArgs: LogsButtonProps = {
  logs: 'Error: connection refused\nRetrying...',
};
export const Default = Template.bind({});
Default.args = defaultLogsButtonArgs;

export const resourceLogsButtonArgs: LogsButtonProps = {
  logs: '2025-01-01T12:00:00Z Starting nginx\n2025-01-01T12:00:01Z Listening on port 80',
  resourceName: 'nginx-pod',
  resourceType: 'Pod',
  namespace: 'default',
  containerName: 'nginx',
};
export const WithResourceInfo = Template.bind({});
WithResourceInfo.args = resourceLogsButtonArgs;

export const emptyLogsButtonArgs: LogsButtonProps = { logs: '' };
export const EmptyLogs = Template.bind({});
EmptyLogs.args = emptyLogsButtonArgs;

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
import type React from 'react';
import { ReduxDecorator } from '../../helpers/storybook';
import { NotInstalledBanner } from './NotInstalledBanner';

export default {
  title: 'knative/Common/NotInstalledBanner',
  component: NotInstalledBanner,
  decorators: [ReduxDecorator],
} as Meta;

const Template: StoryFn<React.ComponentProps<typeof NotInstalledBanner>> = args => (
  <NotInstalledBanner {...args} />
);

export const NotInstalled = Template.bind({});
NotInstalled.args = {
  isLoading: false,
};

export const Loading = Template.bind({});
Loading.args = {
  isLoading: true,
};

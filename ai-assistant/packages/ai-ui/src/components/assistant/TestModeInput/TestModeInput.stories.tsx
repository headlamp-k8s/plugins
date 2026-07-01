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
import TestModeInput from './TestModeInput';

export default {
  title: 'AI UI/TestModeInput',
  component: TestModeInput,
} as Meta;

const Template: StoryFn<React.ComponentProps<typeof TestModeInput>> = args => (
  <TestModeInput {...args} />
);

export const Active = Template.bind({});
Active.args = {
  isTestMode: true,
  onAddTestResponse: (content: string | object, type: string, hasError?: boolean) =>
    console.log('Test response:', { content, type, hasError }),
};

export const Inactive = Template.bind({});
Inactive.args = {
  isTestMode: false,
  onAddTestResponse: () => {},
};

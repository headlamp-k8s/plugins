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
import AIAssistantHeader, { type AIAssistantHeaderProps } from './AIAssistantHeader';

export default {
  title: 'AI UI/AIAssistantHeader',
  component: AIAssistantHeader,
} as Meta;

const Template: StoryFn<AIAssistantHeaderProps> = args => <AIAssistantHeader {...args} />;

export const defaultHeaderArgs: AIAssistantHeaderProps = {
  isTestMode: false,
  disableSettingsButton: false,
  onClose: () => console.log('Closed'),
  onSettings: () => console.log('Settings clicked'),
};
export const Default = Template.bind({});
Default.args = defaultHeaderArgs;

export const testModeHeaderArgs: AIAssistantHeaderProps = {
  ...defaultHeaderArgs,
  isTestMode: true,
};
export const TestMode = Template.bind({});
TestMode.args = testModeHeaderArgs;

export const disabledSettingsHeaderArgs: AIAssistantHeaderProps = {
  ...defaultHeaderArgs,
  disableSettingsButton: true,
};
export const SettingsDisabled = Template.bind({});
SettingsDisabled.args = disabledSettingsHeaderArgs;

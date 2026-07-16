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
import React from 'react';
import {
  HolmesAgentSettings,
  type HolmesAgentSettingsProps,
  type HolmesSettingsPatch,
} from './HolmesAgentSettings';

export default {
  title: 'AI UI/HolmesAgentSettings',
  component: HolmesAgentSettings,
} as Meta;

const Template: StoryFn<HolmesAgentSettingsProps> = args => {
  const [config, setConfig] = React.useState(args.config);

  return (
    <HolmesAgentSettings
      {...args}
      config={config}
      onConfigChange={patch => {
        setConfig((previous: unknown) => ({ ...toRecord(previous), ...patch }));
        args.onConfigChange(patch);
      }}
    />
  );
};

function toRecord(value: unknown): HolmesSettingsPatch {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value))
    : {};
}

export const defaultHolmesArgs: HolmesAgentSettingsProps = {
  config: null,
  onConfigChange: patch => console.log('Holmes config patch:', patch),
};
export const Default = Template.bind({});
Default.args = defaultHolmesArgs;

export const configuredHolmesArgs: HolmesAgentSettingsProps = {
  config: {
    holmesNamespace: 'observability',
    holmesServiceName: 'holmesgpt',
    holmesPort: 8080,
  },
  onConfigChange: patch => console.log('Holmes config patch:', patch),
};
export const Configured = Template.bind({});
Configured.args = configuredHolmesArgs;

export const customHolmesDefaultsArgs: HolmesAgentSettingsProps = {
  config: {},
  defaultNamespace: 'ai-tools',
  defaultServiceName: 'holmes-proxy',
  defaultPort: 8081,
  onConfigChange: patch => console.log('Holmes config patch:', patch),
};
export const CustomDefaults = Template.bind({});
CustomDefaults.args = customHolmesDefaultsArgs;

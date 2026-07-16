import type { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { DeveloperSettings, type DeveloperSettingsProps } from './DeveloperSettings';

export default {
  title: 'AI UI/DeveloperSettings',
  component: DeveloperSettings,
} as Meta;

const Template: StoryFn<DeveloperSettingsProps> = args => {
  const [devOptions, setDevOptions] = React.useState(args.devOptions);
  return (
    <DeveloperSettings
      {...args}
      devOptions={devOptions}
      onDevOptionsChange={opts => {
        setDevOptions(opts);
        args.onDevOptionsChange(opts);
      }}
    />
  );
};

/** All options disabled (default state). */
export const allDisabledArgs: DeveloperSettingsProps = {
  devOptions: {},
  onDevOptionsChange: opts => console.log('Dev options changed:', opts),
  savedConfigs: { providers: [] },
  onConfigsChange: configs => console.log('Configs changed:', configs),
};
export const AllDisabled = Template.bind({});
AllDisabled.args = allDisabledArgs;

/** All options enabled. */
export const allEnabledArgs: DeveloperSettingsProps = {
  devOptions: {
    enableMockModel: true,
    enableMockAgent: true,
    enableFakeMCP: true,
    enableAutoApproval: true,
    enableMockTools: true,
  },
  onDevOptionsChange: opts => console.log('Dev options changed:', opts),
  savedConfigs: {
    providers: [
      { providerId: 'mock-testing-model', displayName: 'Mock Testing Model', config: {} },
    ],
    defaultProviderIndex: 0,
  },
  onConfigsChange: configs => console.log('Configs changed:', configs),
};
export const AllEnabled = Template.bind({});
AllEnabled.args = allEnabledArgs;

/** Only mock model enabled. */
export const mockModelOnlyArgs: DeveloperSettingsProps = {
  devOptions: { enableMockModel: true },
  onDevOptionsChange: opts => console.log('Dev options changed:', opts),
  savedConfigs: {
    providers: [
      { providerId: 'openai', displayName: 'OpenAI', config: { apiKey: 'sk-test' } },
      { providerId: 'mock-testing-model', displayName: 'Mock Testing Model', config: {} },
    ],
    defaultProviderIndex: 1,
  },
  onConfigsChange: configs => console.log('Configs changed:', configs),
};
export const MockModelOnly = Template.bind({});
MockModelOnly.args = mockModelOnlyArgs;

import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import type { ConfigStore } from './MCPSettings';
import { SkillSettings, type SkillSettingsProps, type SkillSourceEntry } from './SkillSettings';

/** Creates a mock ConfigStore backed by an in-memory object. */
function createMockStore(initial: Record<string, any> = {}): ConfigStore {
  let data = { ...initial };
  return {
    get: () => data,
    update: (patch: any) => {
      data = { ...data, ...patch };
    },
  };
}

export default {
  title: 'AI UI/SkillSettings',
  component: SkillSettings,
} as Meta;

const Template: StoryFn<SkillSettingsProps> = args => <SkillSettings {...args} />;

/** Default empty state with no configured sources. */
export const Empty = Template.bind({});
Empty.args = {
  configStore: createMockStore(),
};

/** All well-known paths detected. */
export const AllDetected = Template.bind({});
AllDetected.args = {
  configStore: createMockStore(),
  projectRoot: '/home/user/project',
  checkPathExists: async () => true,
};

/** No well-known paths found on disk. */
export const NoneDetected = Template.bind({});
NoneDetected.args = {
  configStore: createMockStore(),
  projectRoot: '/home/user/project',
  checkPathExists: async () => false,
};

/** Pre-configured with filesystem and GitHub sources. */
export const WithSources: StoryFn<SkillSettingsProps> = args => <SkillSettings {...args} />;
WithSources.args = {
  configStore: createMockStore({
    skills: {
      sources: [
        {
          id: 'fs-1',
          type: 'filesystem',
          path: '/home/user/my-skills',
          enabled: true,
        } as SkillSourceEntry,
        {
          id: 'fs-2',
          type: 'filesystem',
          path: '/opt/shared-skills',
          enabled: false,
        } as SkillSourceEntry,
        {
          id: 'git-1',
          type: 'git',
          url: 'https://github.com/example/skills-repo',
          ref: 'main',
          subdirectory: 'k8s/',
          enabled: true,
        } as SkillSourceEntry,
      ],
      disabledSkills: [],
      maxSkillSizeBytes: 50 * 1024,
      maxTotalSkillSizeBytes: 200 * 1024,
    },
  }),
  projectRoot: '/home/user/project',
  checkPathExists: async (p: string) => p.includes('.github'),
};

/** Some well-known paths enabled via toggles. */
export const WellKnownEnabled: StoryFn<SkillSettingsProps> = args => <SkillSettings {...args} />;
WellKnownEnabled.args = {
  configStore: createMockStore({
    skills: {
      sources: [
        {
          id: 'wk-.github/skills',
          type: 'filesystem',
          path: '/home/user/project/.github/skills',
          enabled: true,
        } as SkillSourceEntry,
      ],
      disabledSkills: [],
    },
  }),
  projectRoot: '/home/user/project',
  checkPathExists: async (p: string) => p.includes('.github/skills'),
};

/** With a suggested GitHub repository enabled. */
export const SuggestedRepoEnabled: StoryFn<SkillSettingsProps> = args => (
  <SkillSettings {...args} />
);
SuggestedRepoEnabled.args = {
  configStore: createMockStore({
    skills: {
      sources: [
        {
          type: 'git',
          url: 'https://github.com/kubeshark/kubeshark',
          ref: '1926067bd928c2acfc875542d6ce4e418e7e95d8',
          path: 'skills',
          enabled: true,
        } as SkillSourceEntry,
      ],
      disabledSkills: [],
    },
  }),
  projectRoot: '/home/user/project',
  checkPathExists: async () => false,
};

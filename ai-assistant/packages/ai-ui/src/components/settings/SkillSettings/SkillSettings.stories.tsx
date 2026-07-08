import type { Meta, StoryObj } from '@storybook/react';
import type { ConfigStore } from '../MCPSettings/MCPSettings';
import { type SkillsConfig, SkillSettings } from './SkillSettings';

const meta = {
  title: 'AI UI/SkillSettings',
  component: SkillSettings,
} satisfies Meta<typeof SkillSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export interface MemoryConfigStore extends ConfigStore {
  /** Returns the current in-memory plugin configuration. */
  data: () => Record<string, unknown>;
}

/** Creates a mutable in-memory config store for stories and tests. */
export function createMemoryConfigStore(initial: Record<string, unknown> = {}): MemoryConfigStore {
  let data = { ...initial };
  return {
    get: () => data,
    update: patch => {
      data = { ...data, ...patch };
    },
    data: () => data,
  };
}

export const configuredSkills: SkillsConfig = {
  sources: [
    { type: 'local', url: '/home/user/my-skills', enabled: true },
    { type: 'local', url: '/opt/shared-skills', enabled: false },
    {
      type: 'git',
      url: 'https://github.com/example/skills-repo',
      ref: 'main',
      path: 'k8s',
      enabled: true,
    },
  ],
  disabledSkills: [],
  maxSkillSizeBytes: 50 * 1024,
  maxTotalSkillSizeBytes: 200 * 1024,
};

export const Empty: Story = {
  args: { configStore: createMemoryConfigStore() },
};

export const WithSources: Story = {
  args: {
    configStore: createMemoryConfigStore({ skills: configuredSkills }),
    projectRoot: '/home/user/project',
    isRunningAsApp: true,
    filesystemSkillsEnabled: true,
    checkPathExists: async path => path.includes('.github'),
  },
};

export const SuggestedRepoEnabled: Story = {
  args: {
    configStore: createMemoryConfigStore({
      skills: {
        ...configuredSkills,
        sources: [
          {
            type: 'git',
            url: 'https://github.com/kubeshark/kubeshark',
            ref: '1926067bd928c2acfc875542d6ce4e418e7e95d8',
            path: 'skills',
            enabled: true,
          },
        ],
      },
    }),
  },
};

export const FilesystemDetectionUnavailable: Story = {
  args: {
    configStore: createMemoryConfigStore(),
    projectRoot: '/home/user/project',
    isRunningAsApp: true,
    filesystemSkillsEnabled: true,
  },
};

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
import type { SkillSourceEntry } from './SkillSettings';
import SkillSourceEditorDialog from './SkillSourceEditorDialog';

export default {
  title: 'AI UI/SkillSourceEditorDialog',
  component: SkillSourceEditorDialog,
} as Meta;

const Template: StoryFn<React.ComponentProps<typeof SkillSourceEditorDialog>> = args => (
  <SkillSourceEditorDialog {...args} />
);

const baseArgs: React.ComponentProps<typeof SkillSourceEditorDialog> = {
  open: true,
  onClose: () => console.log('Closed'),
  onSave: (source: SkillSourceEntry) => console.log('Saved source:', source),
  existingUrls: ['https://github.com/example/platform-skills'],
};

export const NewSource = Template.bind({});
NewSource.args = {
  ...baseArgs,
};

export const EditExisting = Template.bind({});
EditExisting.args = {
  ...baseArgs,
  source: {
    type: 'git',
    url: 'https://github.com/example/cluster-skills',
    ref: 'main',
    path: 'skills/',
    enabled: true,
    sha256: '9f86d081884c7d659a2feaa0c55ad015',
  },
};

export const Closed = Template.bind({});
Closed.args = {
  ...baseArgs,
  open: false,
};

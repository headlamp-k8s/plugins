import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import TagsCell from './TagsCell';

export default {
  title: 'falco/TagsCell',
  component: TagsCell,
} as Meta;

const Template: StoryFn<{ tags: string[] }> = args => <TagsCell {...args} />;

export const MultipleTags = Template.bind({});
MultipleTags.args = {
  tags: ['k8s', 'container', 'network', 'maturity_stable', 'mitre_execution'],
};

export const SingleTag = Template.bind({});
SingleTag.args = {
  tags: ['k8s'],
};

export const CustomTags = Template.bind({});
CustomTags.args = {
  tags: ['custom-tag-alpha', 'custom-tag-beta', 'another-tag'],
};

export const EmptyTags = Template.bind({});
EmptyTags.args = {
  tags: [],
};

export const AllKnownTags = Template.bind({});
AllKnownTags.args = {
  tags: [
    'k8s',
    'container',
    'shell',
    'mitre_execution',
    'maturity_stable',
    't1059',
    'privileged',
    'syscall',
    'k8s_audit',
    'network',
    'file',
    'process',
    'default',
  ],
};

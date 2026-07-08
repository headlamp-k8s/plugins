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
import {
  type SkillDisplayInfo,
  SkillsViewerDialog,
  type SkillsViewerDialogProps,
} from './SkillsViewerDialog';

export default {
  title: 'AI UI/SkillsViewerDialog',
  component: SkillsViewerDialog,
  argTypes: { onClose: { action: 'closed' } },
} as Meta;

const Template: StoryFn<SkillsViewerDialogProps> = args => <SkillsViewerDialog {...args} />;

// -- Sample skills data --

export const azureSkills: SkillDisplayInfo[] = [
  {
    name: 'azure-kubernetes',
    description:
      'Plan, create, and configure production-ready Azure Kubernetes Service (AKS) clusters. Covers Day-0 checklist, SKU selection, networking, security, and operations.',
    source:
      'https://github.com/microsoft/azure-skills@02a614f6ee1f052826f834d65c61e430ad152c8e/azure-kubernetes/SKILL.md',
    content: `# Azure Kubernetes Service

> **AUTHORITATIVE GUIDANCE — MANDATORY COMPLIANCE**

## Quick Reference
| Property | Value |
|----------|-------|
| Best for | AKS cluster planning and Day-0 decisions |
| MCP Tools | \`mcp_azure_mcp_aks\` |
| CLI | \`az aks create\`, \`az aks show\` |

## When to Use This Skill
Activate this skill when user wants to:
- Create a new AKS cluster
- Plan AKS cluster configuration
- Design AKS networking

## Workflow

### 1. Cluster Type
- **AKS Automatic** (default): Best for most workloads
- **AKS Standard**: Use if you need full control`,
    contentSizeBytes: 9600,
    tags: ['kubernetes', 'azure'],
  },
  {
    name: 'azure-cost',
    description: 'Azure cost management: query costs, forecast spending, optimize to reduce waste.',
    source:
      'https://github.com/microsoft/azure-skills@02a614f6ee1f052826f834d65c61e430ad152c8e/azure-cost/SKILL.md',
    content: `# Azure Cost Management Skill

Query historical costs, forecast future spending, optimize to reduce waste.

## Routing

| User Intent | Workflow |
|-------------|----------|
| Understand current costs | Cost Query |
| Reduce costs / find waste | Cost Optimization |
| Project future costs | Cost Forecast |`,
    contentSizeBytes: 1300,
    tags: ['cost', 'azure'],
  },
  {
    name: 'azure-diagnostics',
    description:
      'Debug Azure production issues using AppLens, Azure Monitor, resource health, and safe triage.',
    source:
      'https://github.com/microsoft/azure-skills@02a614f6ee1f052826f834d65c61e430ad152c8e/azure-diagnostics/SKILL.md',
    content: `# Azure Diagnostics

## Triggers
- Debug or troubleshoot production issues
- Diagnose errors in Azure services
- Analyze application logs or metrics

## Quick Diagnosis Flow
1. **Identify symptoms** - What's failing?
2. **Check resource health** - Is Azure healthy?
3. **Review logs** - What do logs show?

\`\`\`bash
# Check resource health
az resource show --ids RESOURCE_ID
\`\`\``,
    contentSizeBytes: 4800,
    tags: ['diagnostics', 'azure'],
  },
];

export const k8sSkills: SkillDisplayInfo[] = [
  {
    name: 'pod-debugging',
    description: 'Step-by-step guide for debugging Kubernetes pod issues.',
    source: 'https://github.com/example/k8s-skills@main/pod-debugging/SKILL.md',
    content: `# Pod Debugging

## When to Use
- Pod stuck in CrashLoopBackOff
- Pod not scheduling (Pending)
- Container OOMKilled

## Steps
1. Check pod events: \`kubectl describe pod <name>\`
2. Check logs: \`kubectl logs <name> --previous\`
3. Check resource limits`,
    contentSizeBytes: 820,
  },
];

export const localSkills: SkillDisplayInfo[] = [
  {
    name: 'team-conventions',
    description: 'Internal team coding conventions and review standards.',
    source: '/home/user/project/.github/skills/team-conventions/SKILL.md',
    content: `# Team Conventions

## Code Review
- All PRs require 2 approvals
- Use conventional commits

## Naming
- Components: PascalCase
- Utilities: camelCase`,
    contentSizeBytes: 340,
    author: 'platform-team',
    version: '1.2.0',
  },
];

// -- Stories --

/** Loading state — spinner shown while skills are fetched. */
export const Loading = Template.bind({});
Loading.args = {
  open: true,
  loadSkills: () => new Promise(() => {}), // never resolves
};

/** Empty state — no skills configured. */
export const Empty = Template.bind({});
Empty.args = {
  open: true,
  loadSkills: async () => [],
};

/** Error state — skill loading failed. */
export const ErrorState = Template.bind({});
ErrorState.args = {
  open: true,
  loadSkills: async () => {
    throw new Error('Failed to fetch repository: CORS error');
  },
};

/** Single group — all skills from one GitHub repo. */
export const SingleGroup = Template.bind({});
SingleGroup.args = {
  open: true,
  loadSkills: async () => azureSkills,
};

/** Multiple groups — skills from GitHub repos and local filesystem. */
export const MultipleGroups = Template.bind({});
MultipleGroups.args = {
  open: true,
  loadSkills: async () => [...azureSkills, ...k8sSkills, ...localSkills],
};

/** Large set — simulates many skills to test scrolling and grouping. */
export const LargeSet = Template.bind({});
LargeSet.args = {
  open: true,
  loadSkills: async () => {
    const skills: SkillDisplayInfo[] = [];
    const names = [
      'azure-ai',
      'azure-compute',
      'azure-deploy',
      'azure-messaging',
      'azure-prepare',
      'azure-rbac',
      'azure-storage',
      'azure-validate',
      'azure-upgrade',
      'azure-reliability',
      'azure-compliance',
      'microsoft-foundry',
      'deploy-model',
      'finetuning',
    ];
    for (const [index, name] of names.entries()) {
      skills.push({
        name,
        description: `Skill for ${name.replace(/-/g, ' ')} operations and management.`,
        source: `https://github.com/microsoft/azure-skills@abc123/${name}/SKILL.md`,
        content: `# ${name}\n\nThis skill handles ${name.replace(
          /-/g,
          ' '
        )}.\n\n## When to Use\n- User asks about ${name}`,
        contentSizeBytes: 500 + index * 317,
      });
    }
    // Add some from another repo
    for (const [index, name] of ['pod-debug', 'service-mesh', 'helm-charts'].entries()) {
      skills.push({
        name,
        description: `Kubernetes ${name} guidance.`,
        source: `https://github.com/k8s-community/skills@def456/${name}/SKILL.md`,
        content: `# ${name}\n\nGuidance for ${name}.`,
        contentSizeBytes: 200 + index * 211,
      });
    }
    return skills;
  },
};

/** With metadata — skill that has version, author, and tags. */
export const WithMetadata = Template.bind({});
WithMetadata.args = {
  open: true,
  loadSkills: async () => [
    {
      ...azureSkills[0],
      version: '3.1.0',
      author: 'azure-team',
      tags: ['kubernetes', 'aks', 'networking', 'security', 'day-0'],
    },
    ...localSkills,
  ],
};

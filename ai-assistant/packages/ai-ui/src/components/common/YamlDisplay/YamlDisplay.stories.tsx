import type { Meta, StoryObj } from '@storybook/react';
import YamlDisplay, { type YamlDisplayProps } from './YamlDisplay';

const meta = { title: 'AI UI/YamlDisplay', component: YamlDisplay } satisfies Meta<
  typeof YamlDisplay
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const deploymentYaml = `---
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: nginx-deployment
  spec:
    replicas: 3
---`;

export const deploymentYamlArgs: YamlDisplayProps = {
  yaml: deploymentYaml,
  title: 'Apply Deployment',
  onOpenInEditor: () => undefined,
};
export const DeploymentYaml: Story = { args: deploymentYamlArgs };

export const serviceYamlArgs: YamlDisplayProps = {
  yaml: `apiVersion: v1
kind: Service
metadata:
  name: webapp-service`,
  onOpenInEditor: () => undefined,
};
export const ServiceYaml: Story = { args: serviceYamlArgs };

export const invalidYamlArgs: YamlDisplayProps = {
  yaml: 'plain text',
};
export const InvalidYaml: Story = { args: invalidYamlArgs };

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
import ContentRenderer from './ContentRenderer';

export default {
  title: 'AI UI/ContentRenderer',
  component: ContentRenderer,
} as Meta;

const Template: StoryFn<React.ComponentProps<typeof ContentRenderer>> = args => (
  <div style={{ maxWidth: 800 }}>
    <ContentRenderer {...args} />
  </div>
);

export const PlainText = Template.bind({});
export const plainTextArgs: React.ComponentProps<typeof ContentRenderer> = {
  content:
    'The assistant can summarize cluster activity, explain resources, and help you inspect issues directly from Headlamp.',
};
PlainText.args = plainTextArgs;

export const MarkdownContent = Template.bind({});
export const markdownContentArgs: React.ComponentProps<typeof ContentRenderer> = {
  content: `# Cluster summary

The **production** cluster looks healthy.

- 12 nodes are Ready
- 48 pods are running normally
- See the [deployment guide](https://headlamp.dev/docs/latest/development/) for more details.

| Namespace | Status |
| --- | --- |
| default | Healthy |
| observability | Warning |`,
};
MarkdownContent.args = markdownContentArgs;

export const WithCodeBlock = Template.bind({});
WithCodeBlock.args = {
  content: `Use this command to inspect workloads:

\`\`\`bash
kubectl get deployments -A
kubectl get pods -n kube-system
\`\`\``,
};

export const WithYaml = Template.bind({});
export const yamlContentArgs: React.ComponentProps<typeof ContentRenderer> = {
  content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-assistant
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ai-assistant
  template:
    metadata:
      labels:
        app: ai-assistant
    spec:
      containers:
        - name: ai-assistant
          image: ghcr.io/headlamp-k8s/ai-assistant:latest
          ports:
            - containerPort: 8080`,
  onYamlDetected: (yaml, resourceType) => console.log('Open YAML:', { yaml, resourceType }),
};
WithYaml.args = yamlContentArgs;

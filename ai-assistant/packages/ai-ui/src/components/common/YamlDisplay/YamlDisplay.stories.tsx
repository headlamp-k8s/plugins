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
import YamlDisplay from './YamlDisplay';

export default {
  title: 'AI UI/YamlDisplay',
  component: YamlDisplay,
} as Meta;

const Template: StoryFn<React.ComponentProps<typeof YamlDisplay>> = args => (
  <YamlDisplay {...args} />
);

export const DeploymentYaml = Template.bind({});
DeploymentYaml.args = {
  yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80`,
  title: 'Apply Deployment',
  onOpenInEditor: (yaml: string, resourceType: string, title?: string) =>
    console.log('Open in editor:', { yaml, resourceType, title }),
};

export const ServiceYaml = Template.bind({});
ServiceYaml.args = {
  yaml: `apiVersion: v1
kind: Service
metadata:
  name: webapp-service
  namespace: default
spec:
  selector:
    app: webapp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP`,
  onOpenInEditor: () => {},
};

export const WithoutTitle = Template.bind({});
WithoutTitle.args = {
  yaml: `apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  database_url: postgres://localhost:5432/mydb
  log_level: info`,
  onOpenInEditor: () => {},
};

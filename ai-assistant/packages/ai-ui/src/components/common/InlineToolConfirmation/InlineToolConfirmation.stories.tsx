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
import InlineToolConfirmation, { type InlineToolConfirmationProps } from './InlineToolConfirmation';

export default {
  title: 'AI UI/InlineToolConfirmation',
  component: InlineToolConfirmation,
} as Meta;

const Template: StoryFn<React.ComponentProps<typeof InlineToolConfirmation>> = args => (
  <InlineToolConfirmation {...args} />
);

export const SingleKubernetesTool = Template.bind({});
export const singleKubernetesToolArgs: InlineToolConfirmationProps = {
  toolCalls: [
    {
      id: 'call_1',
      name: 'kubernetes_api_request',
      description: 'Executes Kubernetes API operations',
      arguments: {
        url: '/api/v1/namespaces/default/pods',
        method: 'GET',
      },
      type: 'regular',
    },
  ],
  onApprove: (ids: string[]) => console.log('Approved:', ids),
  onDeny: () => console.log('Denied'),
  loading: false,
};
SingleKubernetesTool.args = singleKubernetesToolArgs;

export const MultipleMixedTools = Template.bind({});
export const multipleMixedToolsArgs: InlineToolConfirmationProps = {
  toolCalls: [
    {
      id: 'call_1',
      name: 'kubernetes_api_request',
      description: 'Get pods from Kubernetes API',
      arguments: {
        url: '/api/v1/namespaces/default/pods',
        method: 'GET',
      },
      type: 'regular',
    },
    {
      id: 'call_2',
      name: 'flux_get_helmreleases',
      description: 'Check Flux Helm releases',
      arguments: {
        namespace: 'flux-system',
        name: '',
        output: 'json',
      },
      type: 'mcp',
    },
  ],
  onApprove: (ids: string[]) => console.log('Approved:', ids),
  onDeny: () => console.log('Denied'),
  loading: false,
};
MultipleMixedTools.args = multipleMixedToolsArgs;

export const LoadingState = Template.bind({});
export const loadingStateArgs: InlineToolConfirmationProps = {
  toolCalls: [
    {
      id: 'call_1',
      name: 'kubernetes_api_request',
      description: 'Executes Kubernetes API operations',
      arguments: {
        url: '/api/v1/namespaces/default/pods',
        method: 'GET',
      },
      type: 'regular',
    },
  ],
  onApprove: () => {},
  onDeny: () => {},
  loading: true,
};
LoadingState.args = loadingStateArgs;

export const MCPOnlyTools = Template.bind({});
export const mcpOnlyToolsArgs: InlineToolConfirmationProps = {
  toolCalls: [
    {
      id: 'call_1',
      name: 'flux_get_resources',
      description: 'Get Flux resources from the cluster',
      arguments: {
        namespace: 'flux-system',
        resourceType: 'helmreleases',
      },
      type: 'mcp',
    },
    {
      id: 'call_2',
      name: 'gadget_trace_network',
      description: 'Trace network activity using Inspektor Gadget',
      arguments: {
        namespace: 'default',
        pod: 'nginx-deployment-abc123',
        duration: '30s',
      },
      type: 'mcp',
    },
  ],
  onApprove: (ids: string[]) => console.log('Approved:', ids),
  onDeny: () => console.log('Denied'),
  loading: false,
};
MCPOnlyTools.args = mcpOnlyToolsArgs;

export const WithUserContext = Template.bind({});
export const withUserContextArgs: InlineToolConfirmationProps = {
  toolCalls: [
    {
      id: 'call_1',
      name: 'kubernetes_api_request',
      description: 'Delete a pod',
      arguments: {
        url: '/api/v1/namespaces/production/pods/web-server-123',
        method: 'DELETE',
      },
      type: 'regular',
    },
  ],
  onApprove: (ids: string[]) => console.log('Approved:', ids),
  onDeny: () => console.log('Denied'),
  loading: false,
  userContext: {
    userMessage: 'Please delete the crashed pod',
    kubernetesContext: {
      selectedClusters: ['production-cluster'],
      namespace: 'production',
    },
  },
};
WithUserContext.args = withUserContextArgs;

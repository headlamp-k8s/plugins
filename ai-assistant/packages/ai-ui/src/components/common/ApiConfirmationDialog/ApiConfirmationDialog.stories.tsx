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
import ApiConfirmationDialog from './ApiConfirmationDialog';

export default {
  title: 'AI UI/ApiConfirmationDialog',
  component: ApiConfirmationDialog,
} as Meta;

const Template: StoryFn<React.ComponentProps<typeof ApiConfirmationDialog>> = args => (
  <ApiConfirmationDialog {...args} />
);

export const GetRequest = Template.bind({});
GetRequest.args = {
  open: true,
  onClose: () => console.log('Closed'),
  method: 'GET',
  url: '/api/v1/namespaces/default/pods',
  onConfirm: (editedBody?: string, resourceInfo?: string) =>
    console.log('Confirmed:', { editedBody, resourceInfo }),
};

export const PostRequest = Template.bind({});
PostRequest.args = {
  open: true,
  onClose: () => console.log('Closed'),
  method: 'POST',
  url: '/api/v1/namespaces/default/pods',
  body: '{\n  "kind": "Pod",\n  "apiVersion": "v1",\n  "metadata": {\n    "name": "example-pod",\n    "namespace": "default"\n  }\n}',
  onConfirm: (editedBody?: string, resourceInfo?: string) =>
    console.log('Confirmed:', { editedBody, resourceInfo }),
};

export const WithError = Template.bind({});
WithError.args = {
  open: true,
  onClose: () => console.log('Closed'),
  method: 'POST',
  url: '/api/v1/namespaces/default/pods',
  body: '{\n  "kind": "Pod",\n  "metadata": {\n    "name": "forbidden-pod",\n    "namespace": "default"\n  }\n}',
  onConfirm: (editedBody?: string, resourceInfo?: string) =>
    console.log('Confirmed:', { editedBody, resourceInfo }),
  error: '403 Forbidden',
};

export const Loading = Template.bind({});
Loading.args = {
  open: true,
  onClose: () => console.log('Closed'),
  method: 'POST',
  url: '/api/v1/namespaces/default/pods',
  body: '{\n  "kind": "Pod",\n  "metadata": {\n    "name": "loading-pod",\n    "namespace": "default"\n  }\n}',
  onConfirm: (editedBody?: string, resourceInfo?: string) =>
    console.log('Confirmed:', { editedBody, resourceInfo }),
  isLoading: true,
};

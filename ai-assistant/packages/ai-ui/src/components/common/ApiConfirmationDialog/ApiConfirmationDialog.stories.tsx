import type { Meta, StoryObj } from '@storybook/react';
import ApiConfirmationDialog, { type ApiConfirmationDialogProps } from './ApiConfirmationDialog';

const meta = {
  title: 'AI UI/ApiConfirmationDialog',
  component: ApiConfirmationDialog,
} satisfies Meta<typeof ApiConfirmationDialog>;
export default meta;
type Story = StoryObj<typeof meta>;

export const podBody = JSON.stringify({
  apiVersion: 'v1',
  kind: 'Pod',
  metadata: { name: 'example-pod', namespace: 'default' },
});

export const postRequestArgs: ApiConfirmationDialogProps = {
  open: true,
  onClose: () => undefined,
  method: 'POST',
  url: '/api/v1/namespaces/default/pods',
  body: podBody,
  onConfirm: () => undefined,
};
export const PostRequest: Story = { args: postRequestArgs };
export const GetRequest: Story = { args: { ...postRequestArgs, method: 'GET', body: undefined } };
export const PutRequest: Story = { args: { ...postRequestArgs, method: 'PUT' } };
export const DeleteRequest: Story = {
  args: { ...postRequestArgs, method: 'DELETE', body: undefined },
};
export const Loading: Story = { args: { ...postRequestArgs, isLoading: true } };

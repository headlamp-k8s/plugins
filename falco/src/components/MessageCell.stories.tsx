import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import MessageCell from './MessageCell';

export default {
  title: 'falco/MessageCell',
  component: MessageCell,
} as Meta;

const Template: StoryFn<{ message: string; fullText: string; onClick: () => void }> = args => (
  <MessageCell {...args} />
);

export const ShortMessage = Template.bind({});
ShortMessage.args = {
  message: 'File opened for reading',
  fullText: 'File opened for reading by process nginx',
  onClick: () => {},
};

export const LongMessage = Template.bind({});
LongMessage.args = {
  message:
    'Notice Unexpected connection to K8S API Server from container (command=curl https://kubernetes.default.svc/api/v1/namespaces user=root container_id=abc123)',
  fullText:
    'Notice Unexpected connection to K8S API Server from container (command=curl https://kubernetes.default.svc/api/v1/namespaces user=root container_id=abc123 pod=my-pod namespace=kube-system)',
  onClick: () => {},
};

export const TimePrefixedMessage = Template.bind({});
TimePrefixedMessage.args = {
  message: '10:30:00.123456789: Notice Suspicious activity detected in container',
  fullText:
    '10:30:00.123456789: Notice Suspicious activity detected in container (user=root proc=bash)',
  onClick: () => {},
};

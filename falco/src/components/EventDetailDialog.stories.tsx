import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { FalcoEvent } from '../types/FalcoEvent';
import EventDetailDialog from './EventDetailDialog';

export default {
  title: 'falco/EventDetailDialog',
  component: EventDetailDialog,
} as Meta;

const Template: StoryFn<{ event: FalcoEvent | null; open: boolean; onClose: () => void }> =
  args => <EventDetailDialog {...args} />;

const sampleSyscallEvent: FalcoEvent = {
  time: '2024-06-15T10:30:00Z',
  priority: 'Warning',
  rule: 'Terminal shell in container',
  source: 'syscall',
  output:
    'Warning A shell was spawned in a container with an attached terminal (user=root container=nginx pod=web-server-abc123)',
  tags: ['container', 'shell', 'mitre_execution', 'T1059'],
  output_fields: {
    'user.name': 'root',
    'container.name': 'nginx',
    'k8s.pod.name': 'web-server-abc123',
    'k8s.ns.name': 'default',
    'proc.name': 'bash',
    'evt.time': 1718444600000000000,
  },
};

const sampleAuditEvent: FalcoEvent = {
  time: '2024-06-15T11:00:00Z',
  priority: 'Notice',
  rule: 'Contact K8S API Server From Container',
  source: 'k8s_audit',
  output:
    'Notice Unexpected connection to K8S API Server from container (command=curl user=system:serviceaccount)',
  tags: ['k8s', 'network', 'maturity_stable'],
  output_fields: {
    'ka.user.name': 'system:serviceaccount:default:my-sa',
    'ka.target.resource': 'pods',
    'ka.target.name': 'nginx-deployment-abc123',
    'ka.target.namespace': 'kube-system',
  },
};

export const SyscallEvent = Template.bind({});
SyscallEvent.args = {
  event: sampleSyscallEvent,
  open: true,
  onClose: () => {},
};

export const AuditEvent = Template.bind({});
AuditEvent.args = {
  event: sampleAuditEvent,
  open: true,
  onClose: () => {},
};

export const MinimalEvent = Template.bind({});
MinimalEvent.args = {
  event: {
    rule: 'Simple Rule',
    priority: 'Error',
    time: '2024-06-15T12:00:00Z',
  },
  open: true,
  onClose: () => {},
};

export const Closed = Template.bind({});
Closed.args = {
  event: sampleSyscallEvent,
  open: false,
  onClose: () => {},
};

export const NoEvent = Template.bind({});
NoEvent.args = {
  event: null,
  open: true,
  onClose: () => {},
};

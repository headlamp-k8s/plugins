import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Toast, ToastMessage } from './Toast';

const meta: Meta<typeof Toast> = {
  title: 'strimzi/Toast',
  component: Toast,
};
export default meta;

function ToastHarness(props: { toast: ToastMessage | null }) {
  const [current, setCurrent] = React.useState<ToastMessage | null>(props.toast);
  React.useEffect(() => {
    setCurrent(props.toast);
  }, [props.toast]);
  return (
    <div style={{ minHeight: 120, position: 'relative' }}>
      <Toast toast={current} onClose={() => setCurrent(null)} />
    </div>
  );
}

type Story = StoryObj<typeof Toast>;

export const Success: Story = {
  render: () => (
    <ToastHarness toast={{ message: 'Topic created successfully', type: 'success', duration: 60000 }} />
  ),
};

export const Error: Story = {
  render: () => (
    <ToastHarness toast={{ message: 'Failed to connect to the cluster', type: 'error', duration: 60000 }} />
  ),
};

export const Info: Story = {
  render: () => (
    <ToastHarness toast={{ message: 'Sync in progress…', type: 'info', duration: 60000 }} />
  ),
};

export const Dismissed: Story = {
  render: () => <ToastHarness toast={null} />,
};

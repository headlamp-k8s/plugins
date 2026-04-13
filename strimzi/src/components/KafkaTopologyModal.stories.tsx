/**
 * Story shows the Kafka Topology Modal shell only (no KafkaClusterTopology/ResourceEditor)
 * to avoid pulling in headlamp KubeObject and triggering "Cannot access 'KubeObject' before initialization".
 * Use this to get the gist of the modal layout; the real component runs inside Headlamp with a cluster.
 */
import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Meta, StoryObj } from '@storybook/react';

interface ModalShellProps {
  clusterName: string;
  namespace: string;
  onClose: () => void;
}

function KafkaTopologyModalShell({ clusterName, namespace, onClose }: ModalShellProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: '12px',
          width: '95vw',
          maxWidth: '1600px',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isDark
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)'
            : '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: theme.palette.text.primary }}>
              {clusterName}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 400, color: theme.palette.text.secondary, marginTop: '4px' }}>
              {namespace} • Cluster Topology
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isDark ? '#334155' : '#e2e8f0',
              color: theme.palette.text.secondary,
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '24px',
            backgroundColor: theme.palette.background.default,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.palette.text.secondary,
          }}
        >
          Topology view (KafkaClusterTopology) loads here when run in Headlamp with a cluster.
        </div>
      </div>
    </div>
  );
}

const meta: Meta<typeof KafkaTopologyModalShell> = {
  title: 'strimzi/KafkaTopologyModal',
  component: KafkaTopologyModalShell,
  argTypes: {
    onClose: { action: 'onClose' },
  },
};
export default meta;

type Story = StoryObj<typeof KafkaTopologyModalShell>;

export const Open: Story = {
  args: {
    clusterName: 'my-cluster',
    namespace: 'default',
    onClose: () => {},
  },
};

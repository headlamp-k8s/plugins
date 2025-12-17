// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Angelo Cesaro

import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Kafka } from '../crds';
import { KafkaClusterTopology } from './KafkaClusterTopology';

interface KafkaTopologyModalProps {
  kafka: Kafka | null;
  open: boolean;
  onClose: () => void;
}

export function KafkaTopologyModal({ kafka, open, onClose }: KafkaTopologyModalProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!kafka || !open) return null;

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
        {/* Header */}
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
              {kafka.metadata.name}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 400, color: theme.palette.text.secondary, marginTop: '4px' }}>
              {kafka.metadata.namespace} • Cluster Topology
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
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? '#475569' : '#cbd5e1';
              e.currentTarget.style.color = theme.palette.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#e2e8f0';
              e.currentTarget.style.color = theme.palette.text.secondary;
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '24px',
            backgroundColor: theme.palette.background.default,
          }}
        >
          <KafkaClusterTopology kafka={kafka} />
        </div>
      </div>
    </div>
  );
}

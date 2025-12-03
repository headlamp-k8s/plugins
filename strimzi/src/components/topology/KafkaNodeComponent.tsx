// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Angelo Cesaro

import React from 'react';
import { Node } from '@xyflow/react';
import { useTopologyTheme } from '../../hooks/useTopologyTheme';

interface Pod {
  metadata?: {
    name?: string;
  };
  status?: {
    podIP?: string;
    phase?: string;
    conditions?: Array<{
      type: string;
      status: string;
    }>;
  };
}

// Helper to determine if pod is ready
function isPodReady(pod: Pod | undefined): boolean {
  if (!pod?.status?.conditions) return false;
  const readyCondition = pod.status.conditions.find(c => c.type === 'Ready');
  return readyCondition?.status === 'True';
}

interface SemanticColor {
  border: string;
  bg: string;
  label: string;
}

/**
 * Creates a themed Kafka pod node for the topology visualization.
 * Uses Material-UI theme for consistent styling across light/dark modes.
 */
export function createPodNode(params: {
  id: string;
  name: string;
  nodeId: number;
  role: string;
  parentId: string;
  position: { x: number; y: number };
  color: SemanticColor;
  pod?: Pod;
}): Node {
  const { id, name, nodeId, role, parentId, position, color, pod } = params;

  return {
    id,
    type: 'kafkaPod',
    position,
    data: {
      name,
      nodeId,
      role,
      color,
      pod,
    },
    parentId,
    extent: 'parent' as const,
    style: {
      width: 180,
      height: 200,
      backgroundColor: 'transparent',
      border: 'none',
      padding: 0,
    },
    draggable: false,
  };
}

/**
 * React component for rendering a Kafka pod node.
 * Fully theme-aware using useTopologyTheme().
 */
export function KafkaPodNode({ data }: { data: any }) {
  const theme = useTopologyTheme();
  const { name, nodeId, role, color, pod } = data;

  const podIP = pod?.status?.podIP || 'N/A';
  const ready = isPodReady(pod);
  const phase = pod?.status?.phase || 'Unknown';

  return (
    <div
      style={{
        padding: theme.spacing.sm,
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: theme.typography.fontSize.medium,
          fontWeight: theme.typography.fontWeight.bold,
          fontFamily: theme.typography.fontFamily,
          color: color.label,
          marginBottom: theme.spacing.sm,
          textAlign: 'center',
          letterSpacing: theme.typography.letterSpacing,
        }}
      >
        {name}-{nodeId}
      </div>

      {/* Details */}
      <div
        style={{
          fontSize: theme.typography.fontSize.small,
          fontFamily: theme.typography.fontFamily,
          color: theme.colors.nodeTextSecondary,
          lineHeight: theme.typography.lineHeight.relaxed,
          fontWeight: theme.typography.fontWeight.medium,
        }}
      >
        <div>
          <strong style={{ color: theme.colors.nodeText }}>ID:</strong> {nodeId}
        </div>
        <div>
          <strong style={{ color: theme.colors.nodeText }}>Role:</strong> {role}
        </div>
        <div>
          <strong style={{ color: theme.colors.nodeText }}>IP:</strong> {podIP}
        </div>
        <div>
          <strong style={{ color: theme.colors.nodeText }}>Phase:</strong> {phase}
        </div>
      </div>

      {/* Status Badge */}
      <div
        style={{
          marginTop: theme.spacing.sm,
          padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
          borderRadius: '5px',
          fontSize: theme.typography.fontSize.small,
          fontFamily: theme.typography.fontFamily,
          fontWeight: theme.typography.fontWeight.bold,
          textAlign: 'center',
          backgroundColor: ready
            ? theme.colors.statusReadyBg
            : theme.colors.statusNotReadyBg,
          color: ready ? theme.colors.statusReady : theme.colors.statusNotReady,
          letterSpacing: theme.typography.letterSpacing,
        }}
      >
        {ready ? '✓ Ready' : '✗ Not Ready'}
      </div>
    </div>
  );
}

/**
 * Creates a themed group label node for Kafka node pools.
 */
export function createGroupLabel(params: {
  id: string;
  title: string;
  role: string;
  replicas: number;
  parentId: string;
  color: SemanticColor;
}): Node {
  const { id, title, role, replicas, parentId, color } = params;

  return {
    id,
    type: 'kafkaGroupLabel',
    position: { x: 16, y: 16 },
    data: {
      title,
      role,
      replicas,
      color,
    },
    parentId,
    draggable: false,
    style: {
      border: 'none',
      borderRadius: '10px',
      padding: '12px 20px',
      minWidth: '200px',
    },
  };
}

/**
 * React component for rendering a Kafka group label.
 */
export function KafkaGroupLabelNode({ data }: { data: any }) {
  const theme = useTopologyTheme();
  const { title, role, replicas, color } = data;

  return (
    <div
      style={{
        backgroundColor: color.label,
        padding: theme.spacing.md,
        borderRadius: '10px',
        boxShadow: theme.colors.nodeShadow,
      }}
    >
      <div
        style={{
          fontSize: theme.typography.fontSize.large,
          fontWeight: theme.typography.fontWeight.bold,
          fontFamily: theme.typography.fontFamily,
          color: theme.colors.nodeText,
          marginBottom: theme.spacing.xs,
          letterSpacing: theme.typography.letterSpacing,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: theme.typography.fontSize.medium,
          fontFamily: theme.typography.fontFamily,
          color: theme.colors.nodeTextSecondary,
          fontWeight: theme.typography.fontWeight.medium,
          letterSpacing: theme.typography.letterSpacing,
        }}
      >
        {role}
      </div>
      <div
        style={{
          fontSize: theme.typography.fontSize.medium,
          fontFamily: theme.typography.fontFamily,
          color: theme.colors.nodeTextSecondary,
          fontWeight: theme.typography.fontWeight.medium,
          letterSpacing: theme.typography.letterSpacing,
        }}
      >
        Replicas: {replicas}
      </div>
    </div>
  );
}

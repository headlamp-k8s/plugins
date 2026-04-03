import { Icon } from '@iconify/react';
import {
  NameValueTable,
  type NameValueTableRow,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Condition, KubeReference } from '../../resources/common';
/**
 * Maps a resource phase string to a Headlamp StatusLabel style.
 *
 * @param phase - The resource phase (e.g., 'Running', 'Failed').
 * @returns A status string: 'success', 'warning', or 'error'.
 */
export function getPhaseStatus(phase: string | undefined): 'success' | 'warning' | 'error' | '' {
  if (!phase) return '';
  const normalized = phase.toLowerCase();
  if (['running', 'provisioned', 'succeeded', 'ready'].includes(normalized)) {
    return 'success';
  }
  if (['pending', 'provisioning', 'deleting', 'updating', 'draining'].includes(normalized)) {
    return 'warning';
  }
  if (['failed', 'error', 'unknown', 'degraded'].includes(normalized)) {
    return 'error';
  }
  return 'warning';
}

/**
 * Generic input type for name-value rows.
 * Can be a simple Record (dictionary) or an array of { name, value } objects.
 */
export type NameValueInput =
  | Record<string, string | number | boolean | null | undefined>
  | Array<{ name: string; value: string | number | boolean | null | undefined }>
  | undefined
  | null;

/**
 * Normalizes mixed name-value input formats into a consistent row array.
 *
 * @param data - Record, array of objects, or undefined/null.
 * @returns Array of name-value pairs as strings.
 */
export function toNameValueRows(data: NameValueInput): { name: string; value: string }[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.map(({ name, value }) => ({
      name,
      value: value === null ? '' : String(value),
    }));
  }
  return Object.entries(data).map(([name, value]) => ({
    name,
    value: value === null ? '' : String(value),
  }));
}

/**
 * Converts an array of name-value rows back into a object dictionary.
 *
 * @param rows - Array of name-value pairs.
 * @returns A Record object.
 */
export function rowsToDict(rows: Array<{ name: string; value: string }>) {
  return rows.reduce<Record<string, string>>((acc, { name, value }) => {
    acc[name] = value ?? '';
    return acc;
  }, {});
}

/**
 * Renders a Kubernetes reference object as a small information table.
 *
 * @param ref - The KubeReference object.
 * @returns A React component showing the ref details.
 */
export function renderReference(ref?: KubeReference): ReactNode {
  if (!ref) return '-';
  const rows: NameValueTableRow[] = [];
  if (ref.apiVersion) {
    rows.push({ name: 'API Version', value: ref.apiVersion });
  } else {
    rows.push({ name: 'API Group', value: ref.apiGroup ?? '-' });
  }
  rows.push(
    { name: 'Kind', value: ref.kind ?? '-' },
    { name: 'Name', value: ref.name ?? '-' },
    { name: 'Namespace', value: ref.namespace ?? '-', hide: !ref.namespace }
  );
  return <NameValueTable rows={rows} />;
}

/**
 * Renders a condition status as a styled StatusLabel.
 * Supports custom labels and status mappings for different condition states.
 *
 * @param value - Optional string value ('true'/'false').
 * @param condition - Optional Condition object from resource status.
 * @param options - Configuration for labels and color statuses for True, False, and Unknown states.
 * @returns A styled status badge.
 */
export function renderConditionStatus(
  value?: string,
  condition?: Condition,
  options?: {
    trueLabel?: string;
    falseLabel?: string;
    trueStatus?: 'success' | 'warning' | 'error';
    falseStatus?: 'success' | 'warning' | 'error';
    unknownLabel?: string;
    unknownStatus?: 'success' | 'warning' | 'error';
  }
): ReactNode {
  let isTrue: boolean | undefined;
  if (condition) {
    if (condition.status === 'Unknown') {
      return (
        <StatusLabel status={options?.unknownStatus ?? 'warning'}>
          {options?.unknownLabel ?? 'Unknown'}
        </StatusLabel>
      );
    }
    isTrue = condition.status === 'True';
  } else if (value !== undefined) {
    isTrue = value === 'true';
  } else {
    return (
      <StatusLabel status={options?.unknownStatus ?? 'warning'}>
        {options?.unknownLabel ?? 'Unknown'}
      </StatusLabel>
    );
  }
  const label = isTrue ? options?.trueLabel ?? 'True' : options?.falseLabel ?? 'False';

  const status = isTrue ? options?.trueStatus ?? 'success' : options?.falseStatus ?? 'error';

  return <StatusLabel status={status}>{label}</StatusLabel>;
}

/**
 * Chip registered via registerDetailsViewHeaderAction.
 * Indicates that the resource is topology-controlled by ClusterClass.
 * Shows a warning icon and tooltip explaining that manual changes may be overwritten.
 */
export function TopologyControlledAction() {
  return (
    <Tooltip
      title={
        <Box sx={{ p: 0.75, maxWidth: 260 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontSize: '12px',
              color: '#fff',
              mb: 0.5,
            }}
          >
            Topology-controlled (ClusterClass)
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.5,
            }}
          >
            Manual changes like scaling may be automatically overwritten by the topology controller.
          </Typography>
        </Box>
      }
      arrow
      placement="bottom-end"
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: '#1a1a1a',
            border: '1px solid #BA7517',
            borderRadius: '8px',
            p: 0,
            '& .MuiTooltip-arrow': {
              color: '#1a1a1a',
              '&::before': {
                border: '1px solid #BA7517',
              },
            },
          },
        },
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          alignSelf: 'center',
          gap: 0.75,
          px: 1.25,
          py: 0,
          height: '28px',
          borderRadius: '20px',
          border: '1px solid',
          borderColor: 'warning.main',
          backgroundColor: 'transparent',
          cursor: 'default',
          userSelect: 'none',
          verticalAlign: 'middle',
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(186, 117, 23, 0.08)',
          },
        }}
      >
        <Icon
          icon="mdi:alert-outline"
          width="14px"
          height="14px"
          style={{ color: '#BA7517', flexShrink: 0 }}
        />
        <Typography
          variant="body2"
          sx={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'white',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          Topology-controlled
        </Typography>
      </Box>
    </Tooltip>
  );
}
/**
 * Header action component registered to show a topology-controlled badge in resource details views.
 * Checks if the resource has the 'topology.cluster.x-k8s.io/owned' label to determine if it's
 * controlled by ClusterClass topology. If so, renders the TopologyControlledAction badge.
 *
 * @param item - The resource item from the details view context.
 * @returns A header action component or null if not topology-controlled.
 */

export function TopologyHeaderAction({ item }: { item: any }) {
  const labels = item?.jsonData?.metadata?.labels || {};
  const isTopologyControlled = 'topology.cluster.x-k8s.io/owned' in labels;
  const supportedKinds = ['MachineDeployment', 'MachineSet', 'KubeadmControlPlane', 'MachinePool'];

  const isSupportedKind = supportedKinds.includes(item?.kind);

  if (!isTopologyControlled || !isSupportedKind) return null;
  return <TopologyControlledAction />;
}

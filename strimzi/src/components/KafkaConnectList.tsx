import React from 'react';
import { Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ResourceListView,
  type ColumnType,
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KafkaConnect } from '../resources/kafkaConnect';

/**
 * List view for Strimzi `KafkaConnect` resources (Kafka Connect clusters).
 *
 * Read-only at the list level: cluster creation involves many fields
 * (image, version, config, TLS, auth, …) that are best authored as YAML.
 * The detail view exposes the full spec, conditions, and discovered
 * connector plugins.
 */
export function KafkaConnectList() {
  const theme = useTheme();

  const columns: (ColumnType | ResourceTableColumn<KafkaConnect>)[] = [
    'name',
    'namespace',
    {
      id: 'version',
      label: 'Version',
      getValue: (item: KafkaConnect) => item.connectVersion,
    },
    {
      id: 'replicas',
      label: 'Replicas',
      getValue: (item: KafkaConnect) => item.replicas,
    },
    {
      id: 'bootstrap',
      label: 'Bootstrap servers',
      getValue: (item: KafkaConnect) => item.bootstrapServers,
    },
    {
      id: 'plugins',
      label: 'Plugins',
      getValue: (item: KafkaConnect) => item.connectorPlugins.length,
    },
    {
      id: 'status',
      label: 'Status',
      getValue: (item: KafkaConnect) => String(item.readyStatus ?? 'Unknown'),
      render: (item: KafkaConnect) => {
        const status = item.readyStatus;
        const label = status === 'True' ? 'Ready' : status == null ? 'Unknown' : 'Not Ready';
        const chipColor = status === 'True' ? 'success' : status == null ? 'default' : 'warning';
        return (
          <Chip
            label={label}
            variant={theme.palette.mode === 'dark' ? 'outlined' : 'filled'}
            size="medium"
            color={chipColor}
            sx={{ borderRadius: '4px' }}
          />
        );
      },
    },
    'age',
  ];

  return (
    <ResourceListView title="Kafka Connect Clusters" resourceClass={KafkaConnect} columns={columns} />
  );
}

import React from 'react';
import { Button } from '@mui/material';
import {
  ResourceListView,
  type ColumnType,
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Kafka } from '../resources/kafka';
import { KafkaTopologyModal } from './KafkaTopologyModal';
import type { KafkaInterface } from '../resources/kafka';

export function KafkaList() {
  const [selectedKafka, setSelectedKafka] = React.useState<KafkaInterface | null>(null);
  const [isTopologyModalOpen, setIsTopologyModalOpen] = React.useState(false);

  const columns: (ColumnType | ResourceTableColumn<Kafka>)[] = [
    'name',
    'namespace',
    {
      id: 'version',
      label: 'Version',
      getValue: (item: Kafka) => item.kafkaVersion,
    },
    {
      id: 'replicas',
      label: 'Replicas',
      getValue: (item: Kafka) => item.replicasDisplay,
    },
    {
      id: 'status',
      label: 'Status',
      getValue: (item: Kafka) => String(item.readyStatus ?? 'Unknown'),
    },
    {
      id: 'topology',
      label: 'Topology',
      getValue: () => '',
      render: (item: Kafka) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            setSelectedKafka(item.jsonData);
            setIsTopologyModalOpen(true);
          }}
        >
          View
        </Button>
      ),
    },
    'age',
  ];

  return (
    <>
      <ResourceListView
        title="Kafka Clusters"
        resourceClass={Kafka}
        columns={columns}
      />
      <KafkaTopologyModal
        kafka={selectedKafka}
        open={isTopologyModalOpen}
        onClose={() => {
          setIsTopologyModalOpen(false);
          setSelectedKafka(null);
        }}
      />
    </>
  );
}

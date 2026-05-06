import React from 'react';
import { Button } from '@mui/material';
import {
  ResourceListView,
  type ColumnType,
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Kafka, KafkaV1 } from '../resources/kafka';
import { KafkaTopologyModal } from './KafkaTopologyModal';
import type { KafkaInterface } from '../resources/kafka';
import { useStrimziApiVersions } from '../hooks/useStrimziApiVersions';
import { StrimziNotInstalledMessage } from './StrimziNotInstalledMessage';

export function KafkaList() {
  const { ready, installed, kafka: kafkaVersion } = useStrimziApiVersions();
  const KafkaClass = kafkaVersion === 'v1' ? KafkaV1 : Kafka;

  if (ready && !installed) return <StrimziNotInstalledMessage />;

  const [selectedKafka, setSelectedKafka] = React.useState<KafkaInterface | null>(null);
  const [isTopologyModalOpen, setIsTopologyModalOpen] = React.useState(false);

  const columns: (ColumnType | ResourceTableColumn<Kafka>)[] = [
    'name',
    'namespace',
    {
      id: 'mode',
      label: 'Mode',
      getValue: (item: Kafka) => item.clusterMode,
    },
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
        resourceClass={KafkaClass}
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

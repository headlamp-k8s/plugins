import React from 'react';
import { ConditionsSection, DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { KafkaTopic, KafkaTopicV1 } from '../../resources/kafkaTopic';
import { useStrimziApiVersions } from '../../hooks/useStrimziApiVersions';

export function KafkaTopicDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;
  const { kafka: kafkaVersion } = useStrimziApiVersions();
  const KafkaTopicClass = kafkaVersion === 'v1' ? KafkaTopicV1 : KafkaTopic;

  return (
    <DetailsGrid
      resourceType={KafkaTopicClass}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={item =>
        item
          ? [
              { name: 'Partitions', value: item.partitions },
              { name: 'Replicas', value: item.replicas },
              { name: 'Status', value: String(item.readyStatus ?? 'Unknown') },
            ]
          : []
      }
      extraSections={item =>
        item
          ? [
              {
                id: 'conditions',
                section: <ConditionsSection resource={item?.jsonData} />,
              },
            ]
          : []
      }
    />
  );
}

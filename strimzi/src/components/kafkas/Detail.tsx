import React from 'react';
import {
  ConditionsSection,
  DetailsGrid,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { Kafka, KafkaV1 } from '../../resources/kafka';
import { useStrimziApiVersions } from '../../hooks/useStrimziApiVersions';

export function KafkaDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;
  const { kafka: kafkaVersion } = useStrimziApiVersions();
  const KafkaClass = kafkaVersion === 'v1' ? KafkaV1 : Kafka;

  return (
    <DetailsGrid
      resourceType={KafkaClass}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={item =>
        item
          ? [
              { name: 'Mode', value: item.clusterMode },
              { name: 'Kafka Version', value: item.kafkaVersion },
              { name: 'Replicas', value: item.replicasDisplay },
              { name: 'Status', value: String(item.readyStatus ?? 'Unknown') },
            ]
          : []
      }
      extraSections={item =>
        item
          ? [
              {
                id: 'spec',
                section: (
                  <SectionBox title="Spec">
                    <NameValueTable
                      rows={[
                        { name: 'Kafka replicas', value: item.kafkaReplicas ?? '-' },
                        { name: 'ZooKeeper replicas', value: item.zookeeperReplicas ?? '-' },
                      ]}
                    />
                  </SectionBox>
                ),
              },
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

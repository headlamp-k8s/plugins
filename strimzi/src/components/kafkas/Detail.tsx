import React from 'react';
import {
  ConditionsSection,
  DetailsGrid,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { Kafka } from '../../resources/kafka';

export function KafkaDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  return (
    <DetailsGrid
      resourceType={Kafka}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={item =>
        item
          ? [
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

import React from 'react';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';

import { Fleet } from '../../resources';

export function FleetDetail() {
  const params = useParams<{
    namespace: string;
    name: string;
  }>();

  const namespace = params.namespace!;
  const name = params.name!;

  const [fleet] = Fleet.useGet(name, namespace);

  if (!fleet) {
    return <div>Loading Fleet...</div>;
  }

  return (
    <SectionBox title="Fleet Overview">
      <p><strong>Name:</strong> {fleet.metadata?.name}</p>
      <p><strong>Namespace:</strong> {fleet.metadata?.namespace}</p>
      <p><strong>Replicas:</strong> {fleet.replicas}</p>
      <p><strong>Ready:</strong> {fleet.readyReplicas}</p>
      <p><strong>Allocated:</strong> {fleet.allocatedReplicas}</p>
    </SectionBox>
  );
}
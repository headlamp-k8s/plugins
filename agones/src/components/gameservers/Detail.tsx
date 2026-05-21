import React from 'react';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';

import { GameServer } from '../../resources';

export function GameServerDetail() {
  const params = useParams<{
    namespace: string;
    name: string;
  }>();

  const namespace = params.namespace!;
  const name = params.name!;

  const [gameServer] = GameServer.useGet(name, namespace);

  if (!gameServer) {
    return <div>Loading GameServer...</div>;
  }

  return (
    <SectionBox title="GameServer Overview">
      <p><strong>Name:</strong> {gameServer.metadata?.name}</p>
      <p><strong>Namespace:</strong> {gameServer.metadata?.namespace}</p>
      <p><strong>State:</strong> {gameServer.state}</p>
      <p><strong>Address:</strong> {gameServer.address}</p>
      <p><strong>Ports:</strong> {gameServer.ports}</p>
      <p><strong>Node:</strong> {gameServer.nodeName}</p>
    </SectionBox>
  );
}
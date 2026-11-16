import { ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { MongoDBCommunity } from '../resources/mongoDBCommunity';
import { getMongoPhaseStatus } from '../utils/status';
import MongoInstallGuard from './MongoInstallGuard';

/**
 * List view for MongoDBCommunity replica sets.
 * Displays name, namespace, MongoDB version, member count, lifecycle phase, and resource age.
 */
export default function MongoDBCommunityList() {
  return (
    <MongoInstallGuard>
      <ResourceListView
        title="MongoDB Replica Sets"
        resourceClass={MongoDBCommunity}
        columns={[
          'name',
          'namespace',
          {
            id: 'version',
            label: 'Version',
            gridTemplate: 'minmax(100px, 1fr)',
            getValue: (item: MongoDBCommunity) => item.version,
          },
          {
            id: 'members',
            label: 'Members',
            gridTemplate: 'minmax(100px, 1fr)',
            getValue: (item: MongoDBCommunity) => item.membersDisplay,
          },
          {
            id: 'phase',
            label: 'Phase',
            gridTemplate: 'minmax(120px, 1fr)',
            getValue: (item: MongoDBCommunity) => item.phase,
            render: (item: MongoDBCommunity) => (
              <StatusLabel status={getMongoPhaseStatus(item.phase)}>{item.phase}</StatusLabel>
            ),
          },
          'age',
        ]}
      />
    </MongoInstallGuard>
  );
}

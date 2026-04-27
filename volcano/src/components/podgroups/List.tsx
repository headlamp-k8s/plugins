import { Link, ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { VolcanoPodGroup } from '../../resources/podgroup';
import { getPodGroupStatusColor } from '../../utils/status';
import { VolcanoCoreInstallCheck } from '../common/CommonComponents';

/**
 * Renders the Volcano PodGroups list page.
 *
 * @returns PodGroups resource list view.
 */
export default function PodGroupList() {
  return (
    <VolcanoCoreInstallCheck>
      <ResourceListView
        title="Volcano PodGroups"
        resourceClass={VolcanoPodGroup}
        columns={[
          'name',
          'namespace',
          {
            id: 'status',
            label: 'Status',
            getValue: (podGroup: VolcanoPodGroup) => podGroup.phase,
            render: (podGroup: VolcanoPodGroup) => (
              <StatusLabel status={getPodGroupStatusColor(podGroup.phase)}>
                {podGroup.phase}
              </StatusLabel>
            ),
          },
          {
            id: 'min-member',
            label: 'Min Member',
            getValue: (podGroup: VolcanoPodGroup) => podGroup.minMember,
          },
          {
            id: 'running',
            label: 'Running',
            getValue: (podGroup: VolcanoPodGroup) => podGroup.runningCount,
          },
          {
            id: 'queue',
            label: 'Queue',
            getValue: (podGroup: VolcanoPodGroup) => podGroup.queue,
            render: (podGroup: VolcanoPodGroup) => (
              <Link routeName="volcano-queue-detail" params={{ name: podGroup.queue }}>
                {podGroup.queue}
              </Link>
            ),
          },
          'age',
        ]}
      />
    </VolcanoCoreInstallCheck>
  );
}

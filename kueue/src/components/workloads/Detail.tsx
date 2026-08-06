import { DetailsView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Workload } from '../../resources/workload';

export default function WorkloadDetail() {
  return (
    <DetailsView
      title="Workload"
      resourceType="Workload"
      resourceClass={Workload}
      withEvents
    />
  );
}

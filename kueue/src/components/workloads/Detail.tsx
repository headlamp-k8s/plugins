import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { Workload } from '../../resources/workload';

export default function WorkloadDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <DetailsGrid
      resourceType={Workload}
      name={name}
      namespace={namespace}
      withEvents
    />
  );
}

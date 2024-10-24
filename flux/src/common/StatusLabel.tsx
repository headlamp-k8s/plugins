import {
  StatusLabel as HLStatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeCRD } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';

interface StatusLabelProps {
  item: KubeCRD;
}

export default function StatusLabel(props: StatusLabelProps) {
  const { item } = props;
  const ready = item?.jsonData?.status?.conditions?.find(c => c.type === 'Ready');

  if (!ready) {
    return <span>-</span>;
  }

  if (ready.status === 'Unknown') {
    return <HLStatusLabel status="warning">Reconciling…</HLStatusLabel>;
  }

  const isReady = ready.status === 'True';
  return (
    <HLStatusLabel status={isReady ? 'success' : 'error'}>
      {isReady ? 'Ready' : 'Failed'}
    </HLStatusLabel>
  );
}

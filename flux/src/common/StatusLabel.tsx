import { StatusLabel as HLStatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import { Tooltip, Typography } from '@mui/material';

interface StatusLabelProps {
  item: KubeObject;
}

export function getStatusText(item: KubeCRD): string {
  const ready = item?.jsonData?.status?.conditions?.find((c: any) => c.type === 'Ready');
  if (!ready) return '-';
  if (item?.jsonData?.spec?.suspend) return 'Suspended';
  if (ready.status === 'Unknown') return 'Reconciling…';
  if (ready.reason === 'DependencyNotReady') return 'Waiting';
  return ready.status === 'True' ? 'Ready' : 'Failed';
}

export default function StatusLabel(props: StatusLabelProps) {
  const { item } = props;
  const ready = item?.jsonData?.status?.conditions?.find((c: any) => c.type === 'Ready');

  if (!ready) {
    return <span>-</span>;
  }

  const text = getStatusText(item);

  if (item?.jsonData?.spec?.suspend) {
    return <HLStatusLabel status="warning">{text}</HLStatusLabel>;
  }
  if (ready.status === 'Unknown') {
    return <HLStatusLabel status="warning">{text}</HLStatusLabel>;
  }

  if (ready.reason === 'DependencyNotReady') {
    return (
      <HLStatusLabel status={'warning'}>
        <Tooltip title={ready.message}>
          <Typography component="span">{text}</Typography>
        </Tooltip>
      </HLStatusLabel>
    );
  }

  const isReady = ready.status === 'True';
  return (
    <HLStatusLabel status={isReady ? 'success' : 'error'}>
      <Tooltip title={ready.message}>
        <Typography component="span">{text}</Typography>
      </Tooltip>
    </HLStatusLabel>
  );
}

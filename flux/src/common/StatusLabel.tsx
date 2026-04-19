import { StatusLabel as HLStatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import { Tooltip, Typography } from '@mui/material';

interface StatusLabelProps {
  item: KubeObject;
}

export default function StatusLabel(props: StatusLabelProps) {
  const { item } = props;
  const ready = item?.jsonData?.status?.conditions?.find(c => c.type === 'Ready');

  if (!ready) {
    return <span>-</span>;
  }

  if (item?.jsonData?.spec?.suspend) {
    return <HLStatusLabel status="warning">Suspended</HLStatusLabel>;
  }
  if (ready.status === 'Unknown') {
    return <HLStatusLabel status="warning">Reconciling…</HLStatusLabel>;
  }

  if (ready.reason === 'DependencyNotReady') {
    return (
      <HLStatusLabel status={'warning'}>
        <Tooltip title={ready.message}>
          <Typography component="span">Waiting</Typography>
        </Tooltip>
      </HLStatusLabel>
    );
  }

  const isReady = ready.status === 'True';
  return (
    <HLStatusLabel status={isReady ? 'success' : 'error'}>
      <Tooltip title={ready.message}>
        <Typography component="span">{isReady ? 'Ready' : 'Failed'}</Typography>
      </Tooltip>
    </HLStatusLabel>
  );
}

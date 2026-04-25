import { StatusLabel as HLStatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { Tooltip } from '@mui/material';

interface StatusLabelProps {
  item: KubeObject;
  conditionType?: string;
}

export function StatusLabel({ item, conditionType = 'Ready' }: StatusLabelProps) {
  const condition = item?.jsonData?.status?.conditions?.find(c => c.type === conditionType);

  if (!condition) {
    return <span>-</span>;
  }

  if (item?.jsonData?.spec?.suspend) {
    return <HLStatusLabel status="warning">Suspended</HLStatusLabel>;
  }
  if (condition.status === 'Unknown') {
    return <HLStatusLabel status="warning">Reconciling…</HLStatusLabel>;
  }

  if (condition.reason === 'DependencyNotReady') {
    return (
      <HLStatusLabel status={'warning'}>
        <Tooltip title={condition.message}>
          <div>{'Waiting'}</div>
        </Tooltip>
      </HLStatusLabel>
    );
  }

  const isReady = condition.status === 'True';
  return (
    <HLStatusLabel status={isReady ? 'success' : 'error'}>
      <Tooltip title={condition.message}>
        <div>{isReady ? 'Ready' : 'Failed'}</div>
      </Tooltip>
    </HLStatusLabel>
  );
}

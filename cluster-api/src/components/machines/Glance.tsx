import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/system';
import { Machine } from '../../resources/machine';

export function MachineGlance({ node }: { node: any }) {
  if (node.kubeObject?.kind === Machine.kind) {
    const phase = node.kubeObject.status?.phase || 'Unknown';
    const nodeName = node.kubeObject.status?.nodeRef?.name;
    const version = node.kubeObject.spec?.version;

    return (
      <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="machine">
        <StatusLabel status={phase === 'Running' ? 'success' : ''}>
          {phase}
        </StatusLabel>
        {version && (
          <StatusLabel status="">
            {version}
          </StatusLabel>
        )}
        {nodeName && (
          <StatusLabel status="">
            Node: {nodeName}
          </StatusLabel>
        )}
      </Box>
    );
  }

  return null;
}

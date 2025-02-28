import { ActionButton } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Node from '@kinvolk/headlamp-plugin/lib/K8s/node';
import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';
import { useState } from 'react';
import { isEnabled } from '../util';
import { NodeShellTerminal } from './NodeShellTerminal';

export function NodeShellAction({ item }) {
  const [showShell, setShowShell] = useState(false);
  const cluster = getCluster();
  function isLinux(item: Node | null): boolean {
    return item?.status?.nodeInfo?.operatingSystem === 'linux';
  }
  if (!isEnabled(cluster)) {
    return <></>;
  }
  return (
    <>
      <ActionButton
        description={
          isLinux(item)
            ? 'Node Shell'
            : `Node shell is not supported in this OS: ${item?.status?.nodeInfo?.operatingSystem}`
        }
        icon="mdi:console"
        onClick={() => setShowShell(true)}
        iconButtonProps={{
          disabled: !isLinux(item),
        }}
      />
      <NodeShellTerminal
        key="terminal"
        open={showShell}
        title={`Shell: ${item.metadata.name}`}
        item={item}
        onClose={() => {
          setShowShell(false);
        }}
      />
    </>
  );
}

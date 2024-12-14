
import { ActionButton } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Node } from '@kinvolk/headlamp-plugin/lib';
import { useState } from 'react';
import { NodeShellTerminal } from './NodeShellTerminal';

export function NodeShellAction({ item }) {
  const [showShell, setShowShell] = useState(false);
  function isLinux(item: Node | null): boolean {
    return item?.status?.nodeInfo?.operatingSystem === 'linux';
  }
  return (
    <>
      <ActionButton
        description={isLinux(item) ? 'Node Shell' : `Node shell is not supported in this OS: ${item?.status?.nodeInfo?.operatingSystem}`}
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
    </>)
}

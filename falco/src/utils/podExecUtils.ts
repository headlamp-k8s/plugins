export interface PodExecResult {
  cancel?: () => void;
  getSocket?: () => WebSocket | null;
}

export function cancelPodExec(execResult: PodExecResult | null): void {
  execResult?.cancel?.();
}

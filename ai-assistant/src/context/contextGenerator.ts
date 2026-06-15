// Re-export from @headlamp-k8s/ai-common (platform-agnostic implementation)
export {
  minimizeResourceList,
  generateContextDescription,
  generateResourceSummary,
} from '@headlamp-k8s/ai-common/kubernetes/context/buildContextDescription';
export type {
  ClusterWarningEvent,
  ClusterWarnings,
  ContextEventPayload,
} from '@headlamp-k8s/ai-common/kubernetes/context/buildContextDescription';

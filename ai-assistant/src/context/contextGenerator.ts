// Re-export from @headlamp-k8s/ai-common (platform-agnostic implementation)
export {
  minimizeResourceList,
  generateContextDescription,
  generateResourceSummary,
} from '@headlamp-k8s/ai-common/context/contextGenerator';
export type {
  ClusterWarningEvent,
  ClusterWarnings,
  ContextEventPayload,
} from '@headlamp-k8s/ai-common/context/contextGenerator';

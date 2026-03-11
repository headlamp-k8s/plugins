/**
 * Shared types and helpers for Strimzi CRD resources.
 * Used by Kafka, KafkaTopic, KafkaUser and topology components.
 */

export interface StrimziStatus {
  conditions?: Array<{
    type: string;
    status: string;
    lastTransitionTime?: string;
    reason?: string;
    message?: string;
  }>;
  observedGeneration?: number;
  listeners?: Array<{
    type: string;
    addresses: Array<{
      host: string;
      port: number;
    }>;
  }>;
  clusterId?: string;
}

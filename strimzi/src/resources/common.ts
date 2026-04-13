/**
 * Shared types and helpers for Strimzi CRD resources.
 * Used by Kafka, KafkaTopic, KafkaUser and topology components.
 */

/**
 * Status structure common to Strimzi CRDs (conditions, observedGeneration, listeners, etc.).
 * Matches Condition schema and ListenerStatus (host/port in addresses).
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaStatus-reference
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-Condition-reference
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-ListenerStatus-reference
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
    /** Listener name (preferred). `type` is deprecated in favor of `name`. */
    name?: string;
    type?: string;
    addresses: Array<{ host: string; port: number }>;
    bootstrapServers?: string;
  }>;
  clusterId?: string;
}

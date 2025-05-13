/**
 * Interface for a Falco event.
 * @param time - The time the event occurred.
 * @param output_fields - The output fields of the event.
 * @param k8s_ns_name - The name of the namespace the event occurred in.
 * @param k8s_ns - The namespace the event occurred in.
 * @param k8s_pod_name - The name of the pod the event occurred in.
 * @param k8s_pod - The pod the event occurred in.
 * @param k8s_container_name - The name of the container the event occurred in.
 * @param container_name - The container the event occurred in.
 * @param output - The output of the event.
 * @param msg - The message of the event.
 * @param rule - The rule of the event.
 * @param ruleDesc - The description of the rule.
 * @param rule_description - The description of the rule.
 * @param priority - The priority of the event.
 * @param metadata - The metadata of the event.
 * @param status - The status of the event.
 * @param source - The source of the event.
 * @param tags - The tags of the event.
 */
export interface FalcoEvent {
  time?: string;
  output_fields?: Record<string, any>;
  k8s_ns_name?: string;
  k8s_ns?: string;
  k8s_pod_name?: string;
  k8s_pod?: string;
  k8s_container_name?: string;
  container_name?: string;
  output?: string;
  msg?: string;
  rule?: string;
  ruleDesc?: string;
  rule_description?: string;
  priority?: string;
  metadata?: any;
  status?: string;
  source?: string;
  tags?: string[];
}

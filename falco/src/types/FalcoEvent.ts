/**
 * Interface for a Falco event.
 * @property time - The time the event occurred.
 * @property output_fields - The output fields of the event.
 * @property k8s_ns_name - The name of the namespace the event occurred in.
 * @property k8s_ns - The namespace the event occurred in.
 * @property k8s_pod_name - The name of the pod the event occurred in.
 * @property k8s_pod - The pod the event occurred in.
 * @property k8s_container_name - The name of the container the event occurred in.
 * @property container_name - The container the event occurred in.
 * @property output - The output of the event.
 * @property msg - The message of the event.
 * @property rule - The rule of the event.
 * @property ruleDesc - The description of the rule.
 * @property rule_description - The description of the rule.
 * @property priority - The priority of the event.
 * @property metadata - The metadata of the event.
 * @property status - The status of the event.
 * @property source - The source of the event.
 * @property tags - The tags of the event.
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

/**
 * Interface for a Falco rule.
 */
export interface FalcoRule {
  /** Rule name */
  name: string;
  /** Rule description */
  desc: string;
  /** Rule source (pod:file) */
  source: string;
}

/**
 * FalcoRuleWithPodFile extends FalcoRule to include pod and file fields split from the rule's source.
 * Used for filtering and display in the UI.
 */
export interface FalcoRuleWithPodFile extends FalcoRule {
  /** Pod name extracted from source */
  pod: string;
  /** File path extracted from source */
  file: string;
}

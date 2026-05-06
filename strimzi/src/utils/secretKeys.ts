/**
 * Connector configurations frequently inline credentials (DB passwords,
 * cloud access keys, OAuth tokens, …). Strimzi recommends pulling them
 * from `Secret`s via `${secrets:...}`, but plenty of `KafkaConnector`
 * resources in the wild still ship the raw values in `spec.config`.
 *
 * `isSecretLikeKey` returns `true` for config keys that look like they
 * could carry one of those raw secrets, so the UI can mask the value by
 * default and require an explicit reveal step. The patterns are
 * deliberately permissive: a false positive (an extra masked field) is
 * a harmless inconvenience, while a false negative (a leaked password)
 * is the bug we're trying to prevent.
 */
const SECRET_KEY_PATTERNS: RegExp[] = [
  /password/i,
  /passwd/i,
  /secret/i,
  /token/i,
  /credential/i,
  /api[._-]?key/i,
  /access[._-]?key/i,
  /private[._-]?key/i,
  /signing[._-]?key/i,
  /\bauth\b/i,
];

export function isSecretLikeKey(key: string): boolean {
  return SECRET_KEY_PATTERNS.some(re => re.test(key));
}

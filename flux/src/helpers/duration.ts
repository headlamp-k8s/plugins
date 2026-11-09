const DURATION_UNITS_IN_MS = {
  ns: 1e-6,
  us: 1e-3,
  µs: 1e-3,
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
};

// Flux intervals are metav1.Duration, so they are parsed by Go's
// time.ParseDuration. That accepts fractional values and the ns, us, ms, s, m
// and h units. The two character units have to come first in the alternation,
// otherwise "500ms" matches "500m" and is read as 500 minutes.
const DURATION_REGEX = /(\d+(?:\.\d+)?)(ns|us|µs|ms|s|m|h)/g;

/**
 * Converts a Go style duration such as "5m", "1m30s" or "500ms" to milliseconds.
 *
 * @param duration - The duration string to parse.
 * @returns The duration in milliseconds, or NaN if nothing could be parsed.
 */
export function parseDuration(duration) {
  let totalMilliseconds = 0;
  let matched = false;
  let match;

  DURATION_REGEX.lastIndex = 0;

  while ((match = DURATION_REGEX.exec(duration)) !== null) {
    matched = true;
    totalMilliseconds += parseFloat(match[1]) * DURATION_UNITS_IN_MS[match[2]];
  }

  // Returning 0 here would look like a valid interval to callers and make them
  // divide by zero, so report an unparsable duration instead.
  return matched ? totalMilliseconds : NaN;
}

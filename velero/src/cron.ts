import { CronExpressionParser } from 'cron-parser';

/** Optional Velero prefix: `CRON_TZ=<IANA timezone> <cron fields>`. */
const CRON_TZ_PREFIX = /^CRON_TZ=(\S+)\s+(.+)$/;

/** Velero `@every <duration>` (Go time.ParseDuration units). */
const EVERY_PREFIX = /^@every\s+(\S+)$/i;

/** Go-style duration token: number + unit (ns|us|µs|ms|s|m|h). */
const GO_DURATION_TOKEN = /([+-]?(?:\d+(?:\.\d*)?|\.\d+))(ns|us|µs|μs|ms|s|m|h)/gy;

const GO_DURATION_MS: Record<string, number> = {
  ns: 1e-6,
  us: 0.001,
  µs: 0.001,
  μs: 0.001,
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
};

/**
 * Splits an optional CRON_TZ= prefix from a Velero schedule expression.
 * Returns the cron fields and timezone (UTC when no prefix is present).
 */
export function parseVeleroCron(cronSchedule: string): { cron: string; tz: string } {
  const expression = cronSchedule.trim();
  const match = expression.match(CRON_TZ_PREFIX);
  if (match) {
    return { tz: match[1], cron: match[2].trim() };
  }
  return { cron: expression, tz: 'UTC' };
}

/**
 * Parses a Go `time.ParseDuration` string (e.g. `5m`, `1h30m10s`) to milliseconds.
 * Returns undefined when the string is empty or not fully consumed.
 */
export function parseGoDurationMs(duration: string): number | undefined {
  const input = duration.trim();
  if (!input) {
    return undefined;
  }

  let totalMs = 0;
  let matched = false;
  GO_DURATION_TOKEN.lastIndex = 0;

  while (GO_DURATION_TOKEN.lastIndex < input.length) {
    const match = GO_DURATION_TOKEN.exec(input);
    if (!match) {
      return undefined;
    }
    matched = true;
    const amount = Number(match[1]);
    if (!Number.isFinite(amount)) {
      return undefined;
    }
    totalMs += amount * GO_DURATION_MS[match[2]];
  }

  return matched ? totalMs : undefined;
}

/** Next run for `@every <duration>`, measured from `from` (Velero/robfig semantics). */
function getNextEveryRun(expression: string, from: Date): Date | undefined {
  const match = expression.match(EVERY_PREFIX);
  if (!match) {
    return undefined;
  }
  const ms = parseGoDurationMs(match[1]);
  if (ms === undefined || ms <= 0) {
    return undefined;
  }
  return new Date(from.getTime() + ms);
}

/** Returns the next run time for a Velero cron schedule, or undefined when invalid. */
export function getNextScheduledRun(
  cronSchedule: string | undefined,
  from: Date = new Date()
): Date | undefined {
  const expression = cronSchedule?.trim();
  if (!expression) {
    return undefined;
  }

  const { cron, tz } = parseVeleroCron(expression);

  if (EVERY_PREFIX.test(cron)) {
    return getNextEveryRun(cron, from);
  }

  try {
    return CronExpressionParser.parse(cron, {
      currentDate: from,
      tz,
    })
      .next()
      .toDate();
  } catch {
    return undefined;
  }
}

/** Locale-formatted next run time for display in the coverage panel. */
export function formatNextScheduledRun(
  cronSchedule: string | undefined,
  from: Date = new Date()
): string {
  const next = getNextScheduledRun(cronSchedule, from);
  if (!next) {
    return 'N/A';
  }

  return next.toLocaleString();
}

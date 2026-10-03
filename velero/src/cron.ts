import { CronExpressionParser } from 'cron-parser';

/** Optional Velero prefix: `CRON_TZ=<IANA timezone> <cron fields>`. */
const CRON_TZ_PREFIX = /^CRON_TZ=(\S+)\s+(.+)$/;

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

import { CronExpressionParser } from 'cron-parser';

export function getNextScheduledRun(
  cronSchedule: string | undefined,
  from: Date = new Date()
): Date | undefined {
  const expression = cronSchedule?.trim();
  if (!expression) {
    return undefined;
  }

  try {
    return CronExpressionParser.parse(expression, {
      currentDate: from,
      tz: 'UTC',
    })
      .next()
      .toDate();
  } catch {
    return undefined;
  }
}

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

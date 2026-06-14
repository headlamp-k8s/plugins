import { formatDuration } from '@kinvolk/headlamp-plugin/lib/Utils';

export function formatRemainingTime(nextAttempt: number, now: number = Date.now()): string {
  return formatDuration(nextAttempt - now);
}

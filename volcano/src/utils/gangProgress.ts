/**
 * Gang scheduling helpers for Volcano PodGroups.
 * A PodGroup is satisfied when ready members (running + succeeded) reach minMember.
 */

export function getReadyMemberCount(running: number, succeeded: number): number {
  return running + succeeded;
}

export function getGangProgressLabel(minMember: number, ready: number): string {
  if (minMember <= 0) {
    return '-';
  }

  if (ready >= minMember) {
    return 'Gang requirement met';
  }

  return `Gang incomplete (${ready}/${minMember} ready)`;
}

export function getGangProgressPercent(minMember: number, ready: number): number | null {
  if (minMember <= 0) {
    return null;
  }

  if (ready >= minMember) {
    return 100;
  }

  return Math.floor((ready / minMember) * 100);
}

/**
 * Map a Kubernetes `Ready` condition status (`True` / `False` / `Unknown`,
 * or `undefined` if the operator hasn't reported one yet) to a chip
 * label + MUI palette key.
 *
 * Kubernetes' `ConditionStatus` is a tri-state, so we treat the literal
 * string `'Unknown'` the same as a missing condition: both render as
 * the neutral "Unknown" chip rather than silently flipping to "Not Ready".
 * Keeping this in one place stops the production list chips drifting
 * from the Storybook chips that already handled `'Unknown'` correctly.
 */
export type ReadyChipColor = 'success' | 'warning' | 'default';

export interface ReadyChipProps {
  label: 'Ready' | 'Not Ready' | 'Unknown';
  color: ReadyChipColor;
}

export function readyChipProps(status: string | undefined | null): ReadyChipProps {
  if (status === 'True') {
    return { label: 'Ready', color: 'success' };
  }
  if (status == null || status === 'Unknown') {
    return { label: 'Unknown', color: 'default' };
  }
  return { label: 'Not Ready', color: 'warning' };
}

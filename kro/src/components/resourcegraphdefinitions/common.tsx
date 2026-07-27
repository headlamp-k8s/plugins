import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';

/**
 * Map a kro state string onto a Headlamp StatusLabel: Active-ish
 * states show success, Inactive/Failed-ish states error, anything
 * else warning.
 *
 * @param props.state - The state string (any casing); "-" or empty
 *   renders as plain "-".
 * @returns A colored status chip, or plain text when there is no state.
 */
export function KroStateLabel(props: { state?: string }) {
  const { state } = props;
  if (!state || state === '-') {
    return <>-</>;
  }
  const normalized = state.toLowerCase();
  const status =
    normalized === 'active' ? 'success' : normalized === 'inactive' ? 'error' : 'warning';
  return <StatusLabel status={status}>{state}</StatusLabel>;
}

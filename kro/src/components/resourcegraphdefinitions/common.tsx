import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';

/** Map a kro state string onto a Headlamp StatusLabel. */
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

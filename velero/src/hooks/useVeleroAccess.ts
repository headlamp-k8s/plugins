import { useEffect, useState } from 'react';
import { useVeleroNamespace } from '../config';
import { VeleroBackup, VeleroRestore, VeleroSchedule } from '../resources/velero';

async function can(
  resourceClass: typeof VeleroBackup | typeof VeleroRestore | typeof VeleroSchedule,
  verb: string,
  namespace: string
): Promise<boolean> {
  try {
    const result = await resourceClass.getAuthorization(verb, {
      namespace,
      group: 'velero.io',
      version: 'v1',
      resource: resourceClass.apiName,
    });
    return !!result?.status?.allowed;
  } catch {
    // If the review itself fails, show actions and let the API reject — better than hiding forever.
    return true;
  }
}

/**
 * RBAC-aware flags for Phase 4 create / patch actions.
 * @param namespaceOverride — when set (e.g. Schedule detail route ns), check that namespace
 *   instead of the plugin-configured Velero namespace.
 */
export function useVeleroAccess(namespaceOverride?: string) {
  const configuredNamespace = useVeleroNamespace();
  const namespace = namespaceOverride || configuredNamespace;
  // Start denied so write controls stay hidden until SSAR finishes.
  const [canCreateBackup, setCanCreateBackup] = useState(false);
  const [canCreateRestore, setCanCreateRestore] = useState(false);
  const [canCreateSchedule, setCanCreateSchedule] = useState(false);
  const [canPatchSchedule, setCanPatchSchedule] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [backup, restore, scheduleCreate, schedulePatch] = await Promise.all([
        can(VeleroBackup, 'create', namespace),
        can(VeleroRestore, 'create', namespace),
        can(VeleroSchedule, 'create', namespace),
        // Pause/unpause uses schedule.patch — require patch, not update.
        can(VeleroSchedule, 'patch', namespace),
      ]);
      if (!cancelled) {
        setCanCreateBackup(backup);
        setCanCreateRestore(restore);
        setCanCreateSchedule(scheduleCreate);
        setCanPatchSchedule(schedulePatch);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [namespace]);

  return {
    loading,
    canCreateBackup,
    canCreateRestore,
    canCreateSchedule,
    canPatchSchedule,
  };
}

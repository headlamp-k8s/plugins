import { useEffect, useState } from 'react';
import { useVeleroNamespace } from '../config';
import { VeleroBackup, VeleroRestore, VeleroSchedule } from '../resources/velero';

async function can(
  resourceClass: typeof VeleroBackup | typeof VeleroRestore | typeof VeleroSchedule,
  verb: string,
  namespace: string,
  resourceName?: string
): Promise<boolean> {
  try {
    const result = await resourceClass.getAuthorization(verb, {
      namespace,
      group: 'velero.io',
      version: 'v1',
      resource: resourceClass.apiName,
      ...(resourceName ? { name: resourceName } : {}),
    });
    return !!result?.status?.allowed;
  } catch {
    // If the review itself fails, show actions and let the API reject — better than hiding forever.
    return true;
  }
}

export type VeleroAccessOptions = {
  /** Schedule/Backup route namespace (defaults to plugin Velero namespace). */
  namespace?: string;
  /** Named resource for patch reviews (e.g. Schedule detail Pause). */
  name?: string;
};

/**
 * RBAC-aware flags for Phase 4 create / patch actions.
 * Create reviews stay unnamed; patch can include a resource name for resourceNames RBAC.
 */
export function useVeleroAccess(options: VeleroAccessOptions | string = {}) {
  // Back-compat: earlier call sites passed a bare namespace string.
  const opts: VeleroAccessOptions = typeof options === 'string' ? { namespace: options } : options;
  const configuredNamespace = useVeleroNamespace();
  const namespace = opts.namespace || configuredNamespace;
  const resourceName = opts.name;
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
        // Pause/unpause uses schedule.patch — require patch, with name when known.
        can(VeleroSchedule, 'patch', namespace, resourceName),
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
  }, [namespace, resourceName]);

  return {
    loading,
    canCreateBackup,
    canCreateRestore,
    canCreateSchedule,
    canPatchSchedule,
  };
}

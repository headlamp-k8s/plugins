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

/** RBAC-aware flags for Phase 4 create / update actions. */
export function useVeleroAccess() {
  const veleroNamespace = useVeleroNamespace();
  const [canCreateBackup, setCanCreateBackup] = useState(true);
  const [canCreateRestore, setCanCreateRestore] = useState(true);
  const [canCreateSchedule, setCanCreateSchedule] = useState(true);
  const [canUpdateSchedule, setCanUpdateSchedule] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [backup, restore, scheduleCreate, scheduleUpdate] = await Promise.all([
        can(VeleroBackup, 'create', veleroNamespace),
        can(VeleroRestore, 'create', veleroNamespace),
        can(VeleroSchedule, 'create', veleroNamespace),
        can(VeleroSchedule, 'update', veleroNamespace),
      ]);
      if (!cancelled) {
        setCanCreateBackup(backup);
        setCanCreateRestore(restore);
        setCanCreateSchedule(scheduleCreate);
        setCanUpdateSchedule(scheduleUpdate);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [veleroNamespace]);

  return {
    loading,
    canCreateBackup,
    canCreateRestore,
    canCreateSchedule,
    canUpdateSchedule,
  };
}

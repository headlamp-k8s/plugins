import { useCallback, useEffect, useState } from 'react';
import { DiagnosisResult, proactiveDiagnosisManager } from './ProactiveDiagnosisManager';

/** Reactive proactive-diagnosis state exposed to UI consumers. */
export interface UseProactiveDiagnosisResult {
  /** Cached diagnosis results ordered by the manager. */
  diagnoses: DiagnosisResult[];
  /** Whether a diagnosis cycle or single-event diagnosis is active. */
  isCycleRunning: boolean;
  /** Event UID that the UI should scroll into view. */
  scrollToEventUid: string | null;
  /** Clears the pending scroll target in both React and manager state. */
  clearScrollTarget: () => void;
}

/**
 * Subscribes to proactive diagnosis state and exposes diagnosis results plus scroll controls.
 *
 * @returns Current manager snapshots and a scroll-target clearing callback.
 */
export function useProactiveDiagnosis(): UseProactiveDiagnosisResult {
  const [diagnoses, setDiagnoses] = useState<DiagnosisResult[]>(
    proactiveDiagnosisManager.getAllDiagnoses()
  );
  const [isCycleRunning, setIsCycleRunning] = useState(proactiveDiagnosisManager.isRunning());
  const [scrollToEventUid, setScrollToEventUid] = useState<string | null>(
    proactiveDiagnosisManager.getScrollToEventUid()
  );

  useEffect(() => {
    const handleUpdate = () => {
      setDiagnoses(proactiveDiagnosisManager.getAllDiagnoses());
    };

    const handleCycleStart = () => setIsCycleRunning(true);
    const handleCycleEnd = () => {
      setIsCycleRunning(false);
      handleUpdate();
    };
    const handleCacheCleared = () => handleUpdate();
    const handleScrollTo = (uid: string) => setScrollToEventUid(uid);

    proactiveDiagnosisManager.on('diagnosis-update', handleUpdate);
    proactiveDiagnosisManager.on('cycle-start', handleCycleStart);
    proactiveDiagnosisManager.on('cycle-end', handleCycleEnd);
    proactiveDiagnosisManager.on('cache-cleared', handleCacheCleared);
    proactiveDiagnosisManager.on('scroll-to-event', handleScrollTo);

    // Close the render-to-subscribe gap by refreshing snapshots after listeners exist.
    handleUpdate();
    setIsCycleRunning(proactiveDiagnosisManager.isRunning());
    setScrollToEventUid(proactiveDiagnosisManager.getScrollToEventUid());

    return () => {
      proactiveDiagnosisManager.removeListener('diagnosis-update', handleUpdate);
      proactiveDiagnosisManager.removeListener('cycle-start', handleCycleStart);
      proactiveDiagnosisManager.removeListener('cycle-end', handleCycleEnd);
      proactiveDiagnosisManager.removeListener('cache-cleared', handleCacheCleared);
      proactiveDiagnosisManager.removeListener('scroll-to-event', handleScrollTo);
    };
  }, []);

  const clearScrollTarget = useCallback(() => {
    setScrollToEventUid(null);
    proactiveDiagnosisManager.clearScrollToEventUid();
  }, []);

  return {
    diagnoses,
    isCycleRunning,
    scrollToEventUid,
    clearScrollTarget,
  };
}

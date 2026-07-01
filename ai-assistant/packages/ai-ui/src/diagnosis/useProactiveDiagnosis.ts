import { useCallback, useEffect, useState } from 'react';
import { DiagnosisResult, proactiveDiagnosisManager } from './ProactiveDiagnosisManager';

/** Subscribes to proactive diagnosis state and exposes diagnosis results plus scroll controls. */
export function useProactiveDiagnosis() {
  const [diagnoses, setDiagnoses] = useState<DiagnosisResult[]>(
    proactiveDiagnosisManager.getAllDiagnoses()
  );
  const [isCycleRunning, setIsCycleRunning] = useState(false);
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

/**
 * useProactiveDiagnosis hook
 *
 * Provides React state bindings for the ProactiveDiagnosisManager singleton.
 * - Subscribes to manager events and keeps local state in sync.
 * - Returns the list of diagnoses, loading state, and control functions.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DiagnosisResult,
  proactiveDiagnosisManager,
} from '../utils/ProactiveDiagnosisManager';

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

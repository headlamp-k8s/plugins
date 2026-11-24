import { useRef, useState } from 'react';
import { commitPendingValue, normalizeFreeSoloValues } from './freeSolo';

/**
 * Multi-value free-solo state that still includes text left in the input
 * when the user submits without pressing Enter.
 */
export function useFreeSoloMulti() {
  const [value, setValueState] = useState<string[]>([]);
  const valueRef = useRef<string[]>([]);
  const pendingRef = useRef('');

  const setValue = (next: string[]) => {
    const normalized = normalizeFreeSoloValues(next);
    valueRef.current = normalized;
    pendingRef.current = '';
    setValueState(normalized);
  };

  const onInputChange = (text: string, reason: string) => {
    if (reason === 'input') {
      pendingRef.current = text;
    }
    if (reason === 'clear') {
      pendingRef.current = '';
    }
  };

  const commit = () => {
    const next = commitPendingValue(valueRef.current, pendingRef.current);
    valueRef.current = next;
    pendingRef.current = '';
    setValueState(next);
    return next;
  };

  return { value, setValue, onInputChange, commit };
}

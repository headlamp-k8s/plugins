/*
 * Copyright 2026 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useCallback, useEffect, useState } from 'react';
import { AccessErrorKind, accessErrorKind } from '../helm/releaseStore';

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; kind: AccessErrorKind };

/**
 * Runs a read and follows its outcome. The read runs again when `load` changes or when `reload`
 * is called; the answer of an outdated read is ignored.
 *
 * @param load - The read, memoized by the caller on what it depends on.
 */
export function useLoad<T>(load: () => Promise<T>): { state: LoadState<T>; reload: () => void } {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    let outdated = false;
    setState({ status: 'loading' });
    load().then(
      data => {
        if (!outdated) setState({ status: 'ready', data });
      },
      error => {
        // Only the kind of the failure is kept: the body of an API error is never displayed.
        if (!outdated) setState({ status: 'error', kind: accessErrorKind(error) });
      }
    );
    return () => {
      outdated = true;
    };
  }, [load, generation]);

  const reload = useCallback(() => setGeneration(value => value + 1), []);

  return { state, reload };
}

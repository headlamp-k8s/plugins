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

import type { FilterState } from '@kinvolk/headlamp-plugin/lib/redux/filterSlice';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

/** The part of Headlamp's Redux state that holds the namespace filter. */
type State = {
  /** Headlamp's list filters; `namespaces` is empty when every namespace is shown. */
  filter: FilterState;
};

/**
 * Reads the namespaces selected in Headlamp's namespace filter, for lists that load their items
 * themselves instead of through `ResourceListView`'s `resourceClass`.
 *
 * @returns The selected namespaces, or undefined when none are selected, which means every
 * namespace.
 */
export function useSelectedNamespaces(): string[] | undefined {
  const namespaces = useSelector((state: State) => state.filter.namespaces);
  return useMemo(() => (namespaces.size === 0 ? undefined : [...namespaces]), [namespaces]);
}

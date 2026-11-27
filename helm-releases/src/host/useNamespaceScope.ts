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

import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

interface HeadlampState {
  filter?: { namespaces?: Set<string> };
}

function allowedNamespaces(cluster: string | null): string[] {
  // Namespaces the user declared in the cluster settings, for clusters they cannot list entirely.
  const read = K8s.cluster?.getAllowedNamespaces;
  return cluster && typeof read === 'function' ? read(cluster) ?? [] : [];
}

/**
 * Namespaces to read, following Headlamp's own lists: the ones picked in the namespace filter,
 * else the allowed namespaces of the cluster settings, else none, which means the whole cluster.
 */
export function useNamespaceScope(cluster: string | null): string[] {
  const selected = useSelector((state: HeadlampState) => state.filter?.namespaces);
  const names = selected && selected.size > 0 ? [...selected] : allowedNamespaces(cluster);
  // The filter hands over a new Set on every change: the key keeps the scope referentially stable.
  const key = [...new Set(names)].sort().join(',');

  return useMemo(() => (key === '' ? [] : key.split(',')), [key]);
}

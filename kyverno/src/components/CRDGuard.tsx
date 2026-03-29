/*
 * Copyright 2025 The Kubernetes Authors
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

import { ReactNode } from 'react';
import { KyvernoCRDStatus, useKyvernoCRDs } from '../hooks/useKyvernoCRDs';
import { NotInstalledBanner } from './common';

type CRDGroup = keyof Omit<KyvernoCRDStatus, 'loading'>;

interface CRDGuardProps {
  requires: CRDGroup;
  children: ReactNode;
  message?: string;
}

const defaultMessages: Record<CRDGroup, string> = {
  legacy: 'Kyverno (kyverno.io/v1) was not detected on this cluster.',
  cel: 'Kyverno CEL policies (policies.kyverno.io/v1) were not detected on this cluster. Kyverno 1.14+ is required.',
  cleanup: 'Kyverno cleanup policies (kyverno.io/v2) were not detected on this cluster.',
  reports: 'Policy Reports (wgpolicyk8s.io/v1alpha2) were not detected on this cluster.',
  exceptions: 'Policy Exceptions (kyverno.io/v2) were not detected on this cluster.',
};

export function CRDGuard({ requires, children, message }: CRDGuardProps) {
  const status = useKyvernoCRDs();

  if (status.loading) {
    return <NotInstalledBanner loading message="" />;
  }

  if (!status[requires]) {
    return <NotInstalledBanner message={message || defaultMessages[requires]} />;
  }

  return <>{children}</>;
}

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

import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ReactNode } from 'react';
import { KyvernoCRDStatus, useKyvernoCRDs } from '../hooks/useKyvernoCRDs';
import { NotInstalledBanner } from './common';

export type CRDGroup = keyof Omit<KyvernoCRDStatus, 'loading'>;

interface CRDGuardProps {
  requires: CRDGroup;
  children: ReactNode;
  message?: string;
}

export function CRDGuard({ requires, children, message }: CRDGuardProps) {
  const { t } = useTranslation();
  const status = useKyvernoCRDs();

  const defaultMessages: Record<CRDGroup, string> = {
    legacy: t('Kyverno (kyverno.io/v1) was not detected on this cluster.'),
    cel: t(
      'Kyverno CEL policies (policies.kyverno.io/v1) were not detected on this cluster. Kyverno 1.14+ is required.'
    ),
    cleanup: t('Kyverno cleanup policies (kyverno.io/v2) were not detected on this cluster.'),
    reports: t('Policy Reports (wgpolicyk8s.io/v1alpha2) were not detected on this cluster.'),
    exceptions: t('Policy Exceptions (kyverno.io/v2) were not detected on this cluster.'),
    kyvernoV2Reports: t(
      'Kyverno admission/background-scan reports (kyverno.io/v2) were not detected on this cluster.'
    ),
    ephemeralReports: t(
      'Kyverno ephemeral reports (reports.kyverno.io/v1) were not detected on this cluster. Kyverno 1.11+ is required.'
    ),
  };

  if (status.loading) {
    return <NotInstalledBanner loading />;
  }

  if (!status[requires]) {
    return <NotInstalledBanner message={message || defaultMessages[requires]} />;
  }

  return <>{children}</>;
}

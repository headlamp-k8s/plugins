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

import { Link, type ResourceTableColumn } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Typography } from '@mui/material';
import { getSafeUrl } from '../../utils/url';
import { ReadyStatusLabel } from './ReadyStatusLabel';

export function EmptyValue() {
  return (
    <Typography variant="body2" color="text.secondary">
      -
    </Typography>
  );
}

export function TextValue({ value, title }: { value?: string | number; title?: string }) {
  if (value === undefined || value === null || value === '') return <EmptyValue />;

  return (
    <Typography variant="body2" color="text.secondary" noWrap title={title || String(value)}>
      {value}
    </Typography>
  );
}

export function NamespacedResourceLink({
  routeName,
  name,
  namespace,
  cluster,
  title,
}: {
  routeName: string;
  name?: string;
  namespace?: string;
  cluster?: string;
  title?: string;
}) {
  if (!name) return <EmptyValue />;

  return (
    <Link
      routeName={routeName}
      params={{ namespace: namespace || 'default', name }}
      activeCluster={cluster}
      title={title}
    >
      {name}
    </Link>
  );
}

export function ExternalUrl({ url }: { url?: string }) {
  const safeUrl = getSafeUrl(url);
  if (!safeUrl) return <EmptyValue />;

  return (
    <Typography
      component="a"
      variant="body2"
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      noWrap
      title={safeUrl}
    >
      {safeUrl}
    </Typography>
  );
}

export function ReadyCell({
  condition,
}: {
  condition?: { status: 'True' | 'False' | 'Unknown'; reason?: string; message?: string };
}) {
  return (
    <ReadyStatusLabel
      status={condition?.status ?? 'Unknown'}
      reason={condition?.reason}
      message={condition?.message}
    />
  );
}

type ReadinessItem = {
  readyCondition?: {
    status: 'True' | 'False' | 'Unknown';
    reason?: string;
    message?: string;
  };
};

export function getReadinessColumns<T extends ReadinessItem>(): ResourceTableColumn<T>[] {
  return [
    {
      id: 'ready',
      label: 'Ready',
      filterVariant: 'multi-select',
      filterSelectOptions: [
        { label: 'True', value: 'True' },
        { label: 'False', value: 'False' },
        { label: 'Unknown', value: 'Unknown' },
      ],
      getValue: item => item.readyCondition?.status || 'Unknown',
      render: item => <ReadyCell condition={item.readyCondition} />,
    },
    {
      id: 'reason',
      label: 'Reason',
      getValue: item => item.readyCondition?.reason || '',
      render: item => <TextValue value={item.readyCondition?.reason} />,
    },
  ];
}

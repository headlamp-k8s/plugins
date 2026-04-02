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

import {
  Link,
  ResourceListView,
  ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Chip, Stack, Typography } from '@mui/material';
import React from 'react';
import { useClusters } from '../../hooks/useClusters';
import { useKnativeInstalled } from '../../hooks/useKnativeInstalled';
import { KRevision, KService } from '../../resources/knative';
import { getSafeUrl } from '../../utils/url';
import { NotInstalledBanner } from '../common/NotInstalledBanner';
import { ReadyStatusLabel } from '../common/ReadyStatusLabel';

function RevisionNameDisplay({
  revision,
  kservice,
}: {
  revision: KRevision;
  kservice: KService | null;
}) {
  const {
    metadata: { namespace, name },
    cluster,
  } = revision;

  const isLatestReady = kservice?.status?.latestReadyRevisionName === name;

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Link
        routeName="revisionDetails"
        params={{ namespace: namespace!, name: name! }}
        activeCluster={cluster}
      >
        {name}
      </Link>
      {isLatestReady && <Chip label="Latest Ready" color="info" size="small" variant="outlined" />}
    </Stack>
  );
}

function RevisionTrafficDisplay({
  revision,
  kservice,
}: {
  revision: KRevision;
  kservice: KService | null;
}) {
  const myTraffic = kservice ? revision.getTrafficInService(kservice) : [];

  if (!kservice)
    return (
      <Typography variant="body2" color="text.secondary">
        -
      </Typography>
    );

  const trafficWithPercent = myTraffic.filter(t => t.percent !== undefined && t.percent > 0);

  if (trafficWithPercent.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        0%
      </Typography>
    );
  }

  return (
    <Stack direction="column" spacing={1} sx={{ flexWrap: 'wrap' }}>
      {trafficWithPercent.map((t, idx) => (
        <Chip
          key={idx}
          label={`${t.percent}%${t.latestRevision ? ' (Latest)' : ''}`}
          size="small"
          color="success"
          variant="filled"
        />
      ))}
    </Stack>
  );
}

function RevisionTagDisplay({
  revision,
  kservice,
}: {
  revision: KRevision;
  kservice: KService | null;
}) {
  const myTraffic = kservice ? revision.getTrafficInService(kservice) : [];

  if (!kservice)
    return (
      <Typography variant="body2" color="text.secondary">
        -
      </Typography>
    );

  const tags = myTraffic.filter(t => !!t.tag);

  if (tags.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        -
      </Typography>
    );
  }

  return (
    <Stack direction="column" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
      {tags.map(tag => {
        const url = getSafeUrl(tag.url);
        return url ? (
          <Chip
            key={tag.tag}
            label={tag.tag}
            size="small"
            component="a"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            clickable
            color="primary"
          />
        ) : (
          <Chip key={tag.tag} label={tag.tag} size="small" />
        );
      })}
    </Stack>
  );
}

export function RevisionsList() {
  const clusters = useClusters();
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled(clusters);
  const showClusterColumn = clusters.length > 1;

  const kserviceResult = KService.useList({ clusters });
  const kserviceMap = React.useMemo(() => {
    const map = new Map<string, KService>();
    for (const svc of kserviceResult.items || []) {
      const key = `${svc.cluster}/${svc.metadata.namespace}/${svc.metadata.name}`;
      map.set(key, svc);
    }
    return map;
  }, [kserviceResult.items]);

  const columns = React.useMemo<
    (ResourceTableColumn<KRevision> | 'namespace' | 'cluster' | 'age')[]
  >(() => {
    const cols: (ResourceTableColumn<KRevision> | 'namespace' | 'cluster' | 'age')[] = [
      {
        id: 'name',
        label: 'Name',
        gridTemplate: 'auto',
        getValue: rev => rev.metadata.name ?? '',
        render: rev => {
          let kservice: KService | null = null;
          if (rev.parentService) {
            const key = `${rev.cluster}/${rev.metadata.namespace}/${rev.parentService}`;
            kservice = kserviceMap.get(key) ?? null;
          }
          return <RevisionNameDisplay revision={rev} kservice={kservice} />;
        },
      },
      'namespace',
    ];

    if (showClusterColumn) cols.push('cluster');

    cols.push(
      {
        id: 'service',
        label: 'Service',
        gridTemplate: 'auto',
        getValue: rev => rev.parentService ?? '',
        render: rev =>
          rev.parentService ? (
            <Link
              routeName="kserviceDetails"
              params={{ namespace: rev.metadata.namespace, name: rev.parentService }}
              activeCluster={rev.cluster}
            >
              {rev.parentService}
            </Link>
          ) : (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          ),
      },
      {
        id: 'ready',
        label: 'Ready',
        gridTemplate: 'auto',
        getValue: rev => rev.readyCondition?.status || 'Unknown',
        render: rev => (
          <ReadyStatusLabel
            status={rev.readyCondition?.status ?? 'Unknown'}
            reason={rev.readyCondition?.reason}
            message={rev.readyCondition?.message}
          />
        ),
      },
      {
        id: 'image',
        label: 'Image',
        gridTemplate: 'auto',
        getValue: rev => rev.primaryImage ?? '',
        render: rev => (
          <Typography variant="body2" color="text.secondary" noWrap title={rev.primaryImage}>
            {rev.primaryImage?.split('@')[0] || '-'}
          </Typography>
        ),
      },
      {
        id: 'traffic',
        label: 'Traffic',
        gridTemplate: 'auto',
        getValue: rev => {
          let kservice: KService | null = null;
          if (rev.parentService) {
            const key = `${rev.cluster}/${rev.metadata.namespace}/${rev.parentService}`;
            kservice = kserviceMap.get(key) ?? null;
          }
          const traffic = kservice ? rev.getTrafficInService(kservice) : [];
          return traffic.reduce((acc, t) => acc + (t.percent || 0), 0);
        },
        render: rev => {
          if (!rev.parentService) return <Typography variant="body2">-</Typography>;
          const key = `${rev.cluster}/${rev.metadata.namespace}/${rev.parentService}`;
          const kservice = kserviceMap.get(key) ?? null;
          return <RevisionTrafficDisplay revision={rev} kservice={kservice} />;
        },
      },
      {
        id: 'tags',
        label: 'Tags',
        gridTemplate: 'auto',
        getValue: () => '',
        render: rev => {
          if (!rev.parentService) return <Typography variant="body2">-</Typography>;
          const key = `${rev.cluster}/${rev.metadata.namespace}/${rev.parentService}`;
          const kservice = kserviceMap.get(key) ?? null;
          return <RevisionTagDisplay revision={rev} kservice={kservice} />;
        },
      },
      'age'
    );
    return cols;
  }, [showClusterColumn, kserviceMap]);

  if (!isKnativeInstalled) {
    return <NotInstalledBanner isLoading={isKnativeCheckLoading} />;
  }

  return (
    <ResourceListView
      title="Revisions"
      resourceClass={KRevision}
      columns={columns}
      reflectInURL="knative-revisions"
      id="knative-revisions"
      enableRowActions={false}
      enableRowSelection={false}
      headerProps={{
        titleSideActions: [],
      }}
    />
  );
}

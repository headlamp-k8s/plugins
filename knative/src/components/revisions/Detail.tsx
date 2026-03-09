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

import { DetailsGrid, Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useClusters } from '../../hooks/useClusters';
import { useKnativeInstalled } from '../../hooks/useKnativeInstalled';
import { KRevision, KService } from '../../resources/knative';
import {
  ActivitiesProvider,
  ActivitiesRenderer,
  KNATIVE_ACTIVITY_CONTAINER_ID,
} from '../common/activity/Activity';
import ConditionsSection from '../common/ConditionsSection';
import { NotInstalledBanner } from '../common/NotInstalledBanner';
import { RevisionDeleteHeaderButton } from './detail/header/RevisionDeleteHeaderButton';
import { RevisionViewYamlHeaderButton } from './detail/header/RevisionViewYamlHeaderButton';
import { RevisionPermissionsProvider } from './detail/permissions/RevisionPermissionsProvider';
import { ContainerSection } from './detail/sections/containers/ContainerSection';

function TrafficDisplay({ revision }: { revision: KRevision }) {
  const { parentService } = revision;

  if (!parentService) {
    return <Typography variant="body2">-</Typography>;
  }

  return <TrafficDisplayWithService revision={revision} />;
}

function TrafficDisplayWithService({ revision }: { revision: KRevision }) {
  const {
    parentService,
    metadata: { namespace },
    cluster,
  } = revision;
  const [kservice, error] = KService.useGet(parentService, namespace || '', { cluster });

  if (error) {
    return (
      <Typography variant="body2" color="error">
        Error loading traffic
      </Typography>
    );
  }

  const traffic = kservice ? revision.getTrafficInService(kservice) : undefined;

  if (!traffic || traffic.length === 0) {
    return <Typography variant="body2">0%</Typography>;
  }

  return (
    <Box display="flex" gap={1} flexWrap="wrap">
      {traffic.map(t => {
        const isTagOnly = t.percent === 0 && t.tag;
        const latestSuffix = t.latestRevision ? ' (Latest)' : '';
        let label: string;
        if (isTagOnly) {
          label = `Tag: ${t.tag}`;
        } else {
          label = `${t.percent || 0}%${t.tag ? ` (Tag: ${t.tag})` : ''}${latestSuffix}`;
        }
        const key = `${t.revisionName || revision.metadata.name}-${t.tag || 'untagged'}-${
          t.url || 'no-url'
        }-${t.percent ?? '0'}`;
        return (
          <Chip
            key={key}
            label={label}
            size="small"
            color={t.percent && t.percent > 0 ? 'success' : 'default'}
            variant={t.percent && t.percent > 0 ? 'filled' : 'outlined'}
          />
        );
      })}
    </Box>
  );
}

export function RevisionDetail() {
  const { name, namespace } = useParams<{ namespace: string; name: string }>();
  const clusters = useClusters();
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled(clusters);

  if (!isKnativeInstalled) {
    return <NotInstalledBanner isLoading={isKnativeCheckLoading} />;
  }

  return (
    <ActivitiesProvider>
      <Box
        sx={{
          display: 'grid',
          overflow: 'hidden',
          flexGrow: 1,
          height: '100%',
          position: 'relative',
          gridTemplateRows: '1fr min-content',
          gridTemplateColumns: '1fr',
          minHeight: 0,
        }}
      >
        <Box
          id={KNATIVE_ACTIVITY_CONTAINER_ID}
          sx={{
            overflow: 'auto',
            position: 'relative',
            height: '100%',
            minHeight: 0,
            gridColumn: '1 / 2',
            gridRow: '1 / 2',
          }}
        >
          <DetailsGrid
            resourceType={KRevision}
            name={name}
            namespace={namespace}
            withEvents
            noDefaultActions
            actions={rev => {
              if (!rev) return [];
              return [
                {
                  id: 'knative.revision-view-yaml',
                  action: <RevisionViewYamlHeaderButton revision={rev} />,
                },
                {
                  id: 'knative.revision-delete',
                  action: (
                    <RevisionPermissionsProvider revision={rev}>
                      <RevisionDeleteHeaderButton revision={rev} />
                    </RevisionPermissionsProvider>
                  ),
                },
              ];
            }}
            extraInfo={rev => {
              if (!rev) return null;
              return [
                {
                  name: 'Parent Service',
                  value: rev.parentService ? (
                    <Link
                      routeName="kserviceDetails"
                      params={{ namespace: rev.metadata.namespace, name: rev.parentService }}
                      activeCluster={rev.cluster}
                    >
                      {rev.parentService}
                    </Link>
                  ) : (
                    '-'
                  ),
                },
                {
                  name: 'Traffic',
                  value: <TrafficDisplay revision={rev} />,
                },
                {
                  name: 'Container Concurrency',
                  value: rev.spec?.containerConcurrency ?? 'Default',
                },
                {
                  name: 'Timeout (Seconds)',
                  value: rev.spec?.timeoutSeconds ?? 'Default',
                },
                {
                  name: 'Image Digest',
                  value: (
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                    >
                      {rev.status?.imageDigest || '-'}
                    </Typography>
                  ),
                },
              ];
            }}
            extraSections={rev => {
              if (!rev) return [];
              const sections = [];

              if (rev.status?.conditions) {
                sections.push({
                  id: 'knative.revision-conditions',
                  section: <ConditionsSection conditions={rev.status.conditions} />,
                });
              }

              if (rev.containers && rev.containers.length > 0) {
                sections.push({
                  id: 'knative.revision-containers',
                  section: <ContainerSection revision={rev} />,
                });
              }

              return sections;
            }}
          />
        </Box>
        <ActivitiesRenderer />
      </Box>
    </ActivitiesProvider>
  );
}

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

import { Icon } from '@iconify/react';
import {
  Link,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Typography } from '@mui/material';
import type { ComponentProps } from 'react';
import { ArgoApplication } from '../../resources/application';
import { getHealthStatus, getSyncStatus } from '../applications/statusHelpers';

type HeadlampStatus = ComponentProps<typeof StatusLabel>['status'];

interface NamespaceResource {
  kind?: string;
  metadata?: {
    name?: string;
  };
  getName?: () => string;
}

/**
 * Adds Argo CD context to Headlamp's built-in Namespace detail page.
 *
 * The section shows Applications that are either stored in this namespace or
 * deploy workloads into it. That distinction matters for Argo CD because the
 * Application CR usually lives in the Argo CD control-plane namespace, while
 * its destination namespace can be somewhere else.
 */
export default function ArgoNamespaceInsights(props: { resource: NamespaceResource }) {
  const resource = props.resource;

  if (resource?.kind !== 'Namespace') {
    return null;
  }

  const namespaceName = resource.metadata?.name ?? resource.getName?.();
  if (!namespaceName) {
    return null;
  }

  return <NamespaceInsights namespaceName={namespaceName} />;
}

function NamespaceInsights(props: { namespaceName: string }) {
  const [applications, error] = ArgoApplication.useList();
  const apps = applications ?? [];
  const relatedApps = getNamespaceApplications(apps, props.namespaceName);
  const storedApps = relatedApps.filter(app => app.metadata.namespace === props.namespaceName);
  const targetApps = relatedApps.filter(app => app.destinationNamespace === props.namespaceName);
  const attentionApps = relatedApps.filter(
    app => app.syncStatus !== 'Synced' || app.healthStatus !== 'Healthy'
  );

  return (
    <SectionBox title="Namespace GitOps Insights">
      {error ? (
        <InsightsEmptyState message="Unable to load Argo CD Applications for this namespace." />
      ) : !applications ? (
        <InsightsEmptyState message="Loading Argo CD Applications..." />
      ) : relatedApps.length === 0 ? (
        <InsightsEmptyState message="No Argo CD Applications are stored in or targeting this namespace." />
      ) : (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
              gap: 2,
              mb: 2,
            }}
          >
            <InsightCard
              icon="mdi:folder-outline"
              title="Stored Here"
              value={storedApps.length}
              caption="Application CRs in this namespace"
            />
            <InsightCard
              icon="mdi:target"
              title="Deploying Here"
              value={targetApps.length}
              caption="Applications targeting this namespace"
            />
            <InsightCard
              icon={
                attentionApps.length > 0 ? 'mdi:alert-circle-outline' : 'mdi:check-circle-outline'
              }
              title={attentionApps.length > 0 ? 'Needs Attention' : 'All Healthy'}
              value={attentionApps.length}
              caption={
                attentionApps.length > 0 ? 'Not synced or not healthy' : 'No sync or health issues'
              }
              status={attentionApps.length > 0 ? 'warning' : 'success'}
            />
          </Box>

          <SimpleTable
            data={relatedApps}
            columns={[
              {
                label: 'Application',
                getter: (app: ArgoApplication) => (
                  <Link
                    routeName="argocd-application-detail"
                    params={{ namespace: app.metadata.namespace, name: app.metadata.name }}
                  >
                    {app.metadata.name}
                  </Link>
                ),
                sort: true,
              },
              {
                label: 'Scope',
                getter: (app: ArgoApplication) => getAppNamespaceScope(app, props.namespaceName),
                sort: true,
              },
              {
                label: 'Project',
                getter: (app: ArgoApplication) => app.project,
                sort: true,
              },
              {
                label: 'Target Namespace',
                getter: (app: ArgoApplication) => app.destinationNamespace,
                sort: true,
              },
              {
                label: 'Sync',
                getter: (app: ArgoApplication) => (
                  <StatusLabel status={getSyncStatus(app.syncStatus)}>{app.syncStatus}</StatusLabel>
                ),
                sort: (a: ArgoApplication, b: ArgoApplication) =>
                  a.syncStatus.localeCompare(b.syncStatus),
              },
              {
                label: 'Health',
                getter: (app: ArgoApplication) => (
                  <StatusLabel status={getHealthStatus(app.healthStatus)}>
                    {app.healthStatus}
                  </StatusLabel>
                ),
                sort: (a: ArgoApplication, b: ArgoApplication) =>
                  a.healthStatus.localeCompare(b.healthStatus),
              },
            ]}
          />
        </>
      )}
    </SectionBox>
  );
}

function InsightCard(props: {
  icon: string;
  title: string;
  value: number;
  caption: string;
  status?: HeadlampStatus;
}) {
  return (
    <Box
      sx={theme => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
      })}
    >
      <Box
        sx={theme => ({
          width: 38,
          height: 38,
          borderRadius: 1,
          display: 'grid',
          placeItems: 'center',
          bgcolor:
            props.status === 'success'
              ? theme.palette.success.main
              : props.status === 'warning'
              ? theme.palette.warning.main
              : theme.palette.action.selected,
          color: props.status ? theme.palette.common.white : theme.palette.text.secondary,
          flex: '0 0 auto',
        })}
      >
        <Icon icon={props.icon} width={22} height={22} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
          {props.value}
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {props.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {props.caption}
        </Typography>
      </Box>
    </Box>
  );
}

function InsightsEmptyState(props: { message: string }) {
  return (
    <Box
      sx={theme => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        color: 'text.secondary',
        p: 2,
        textAlign: 'center',
      })}
    >
      {props.message}
    </Box>
  );
}

function getNamespaceApplications(apps: ArgoApplication[], namespaceName: string) {
  const byKey: Record<string, ArgoApplication> = {};

  apps.forEach(app => {
    const isStoredHere = app.metadata.namespace === namespaceName;
    const deploysHere = app.destinationNamespace === namespaceName;

    if (isStoredHere || deploysHere) {
      byKey[`${app.metadata.namespace}/${app.metadata.name}`] = app;
    }
  });

  return Object.values(byKey).sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
}

function getAppNamespaceScope(app: ArgoApplication, namespaceName: string) {
  const isStoredHere = app.metadata.namespace === namespaceName;
  const deploysHere = app.destinationNamespace === namespaceName;

  if (isStoredHere && deploysHere) {
    return 'Stored and deploys here';
  }
  if (isStoredHere) {
    return 'Stored here';
  }
  return 'Deploys here';
}

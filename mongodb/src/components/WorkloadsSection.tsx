import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  EmptyContent,
  Loader,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import React from 'react';
import type { MongoDBCommunity } from '../resources/mongoDBCommunity';

const Pod = K8s.ResourceClasses.Pod;
const StatefulSet = K8s.ResourceClasses.StatefulSet;

/**
 * Section displaying the underlying StatefulSet and Pods managed by the MongoDB operator.
 */
export function WorkloadsSection({ item }: { item: MongoDBCommunity }) {
  const namespace = item.metadata?.namespace;
  const name = item.metadata?.name;

  // The operator creates a StatefulSet named identically to the MongoDBCommunity resource
  const [statefulSet, ssetErr] = StatefulSet.useGet(name, namespace);

  // The operator labels pods with app=<name>-svc
  const [pods, podsErr] = Pod.useList({
    namespace,
    labelSelector: name ? `app=${name}-svc` : undefined,
  });

  const isLoading = pods === null && !podsErr;

  return (
    <SectionBox title="Underlying Workloads">
      {/* StatefulSet summary */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
          StatefulSet
        </Typography>
        {statefulSet ? (
          <SimpleTable
            columns={[
              {
                label: 'Name',
                getter: (s: any) => s.metadata?.name,
              },
              {
                label: 'Replicas (Ready / Desired)',
                getter: (s: any) => `${s.status?.readyReplicas ?? 0} / ${s.spec?.replicas ?? 0}`,
              },
              {
                label: 'Current Replicas',
                getter: (s: any) => s.status?.currentReplicas ?? 0,
              },
              {
                label: 'Updated Replicas',
                getter: (s: any) => s.status?.updatedReplicas ?? 0,
              },
              {
                label: 'Age',
                getter: (s: any) => s.age,
              },
            ]}
            data={[statefulSet]}
          />
        ) : ssetErr ? (
          <Typography variant="body2" color="text.secondary">
            StatefulSet information unavailable (insufficient RBAC permissions or not found).
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Waiting for StatefulSet to be created by operator...
          </Typography>
        )}
      </Box>

      {/* Member Pods table */}
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
          Member Pods
        </Typography>
        {isLoading ? (
          <Loader title="Loading member pods..." />
        ) : podsErr ? (
          <Typography variant="body2" color="text.secondary">
            Member pod information unavailable (insufficient RBAC permissions or request failed).
          </Typography>
        ) : !pods || pods.length === 0 ? (
          <EmptyContent>No member pods found for this replica set.</EmptyContent>
        ) : (
          <SimpleTable
            columns={[
              {
                label: 'Pod Name',
                getter: (pod: any) => pod.metadata?.name,
              },
              {
                label: 'Ready Containers',
                getter: (pod: any) => {
                  const status = pod.getDetailedStatus?.();
                  if (!status) return '-';
                  return `${status.readyContainers}/${status.totalContainers}`;
                },
              },
              {
                label: 'Status',
                getter: (pod: any) => {
                  const phase = pod.status?.phase ?? 'Unknown';
                  const isReady = pod.status?.conditions?.some(
                    (condition: { type: string; status: string }) =>
                      condition.type === 'Ready' && condition.status === 'True'
                  );
                  const statusType =
                    phase === 'Running'
                      ? isReady
                        ? 'success'
                        : 'warning'
                      : phase === 'Pending'
                      ? 'warning'
                      : phase === 'Failed'
                      ? 'error'
                      : '';
                  return <StatusLabel status={statusType}>{phase}</StatusLabel>;
                },
              },
              {
                label: 'Restarts',
                getter: (pod: any) => {
                  const statuses = pod.status?.containerStatuses ?? [];
                  return statuses.reduce(
                    (acc: number, c: { restartCount?: number }) => acc + (c.restartCount ?? 0),
                    0
                  );
                },
              },
              {
                label: 'Age',
                getter: (pod: any) => pod.age,
              },
            ]}
            data={pods}
          />
        )}
      </Box>
    </SectionBox>
  );
}

import {
  DetailsGrid,
  EmptyContent,
  NameValueTable,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useParams } from 'react-router-dom';
import { MongoDBCommunity } from '../resources/mongoDBCommunity';
import type { MongoUser } from '../resources/types';
import { getMongoPhaseStatus } from '../utils/status';
import MongoInstallGuard from './MongoInstallGuard';
import { WorkloadsSection } from './WorkloadsSection';

/**
 * Detail view for a MongoDBCommunity replica set.
 * Displays resource metadata, spec highlights, database users, security settings, and member workloads.
 */
export default function MongoDBCommunityDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <MongoInstallGuard>
      <DetailsGrid
        resourceType={MongoDBCommunity}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={(item: MongoDBCommunity | null) =>
          item
            ? [
                {
                  name: 'Phase',
                  value: (
                    <StatusLabel status={getMongoPhaseStatus(item.phase)}>{item.phase}</StatusLabel>
                  ),
                },
                {
                  name: 'Target Version',
                  value: item.spec?.version || '-',
                },
                {
                  name: 'Running Version',
                  value: item.status?.version || '-',
                },
                {
                  name: 'Members (Active / Desired)',
                  value: item.membersDisplay,
                },
                {
                  name: 'Topology Type',
                  value: item.spec?.type || 'ReplicaSet',
                },
                {
                  name: 'Feature Compatibility',
                  value: item.spec?.featureCompatibilityVersion || '-',
                },
                {
                  name: 'Mongo URI',
                  value: item.mongoUri,
                },
              ]
            : []
        }
        extraSections={(item: MongoDBCommunity | null) =>
          item
            ? [
                {
                  id: 'mongo-status-health',
                  section: (
                    <SectionBox title="Status & Health">
                      <NameValueTable
                        rows={[
                          {
                            name: 'Lifecycle Phase',
                            value: (
                              <StatusLabel status={getMongoPhaseStatus(item.phase)}>
                                {item.phase}
                              </StatusLabel>
                            ),
                          },
                          {
                            name: 'Running MongoDB Version',
                            value: item.status?.version || '-',
                          },
                          {
                            name: 'Active MongoDB Members',
                            value:
                              item.status?.currentMongoDBMembers !== undefined
                                ? item.status.currentMongoDBMembers
                                : '-',
                          },
                          {
                            name: 'Active Arbiters',
                            value:
                              item.status?.currentMongoDBArbiters !== undefined
                                ? item.status.currentMongoDBArbiters
                                : '-',
                          },
                          {
                            name: 'StatefulSet Replicas',
                            value:
                              item.status?.currentStatefulSetReplicas !== undefined
                                ? item.status.currentStatefulSetReplicas
                                : '-',
                          },
                          {
                            name: 'Operator Message',
                            value: item.message || '-',
                          },
                          {
                            name: 'Connection String URI',
                            value: item.mongoUri,
                          },
                        ]}
                      />
                    </SectionBox>
                  ),
                },
                {
                  id: 'mongo-security-auth',
                  section: (
                    <SectionBox title="Security & Authentication">
                      <NameValueTable
                        rows={[
                          {
                            name: 'Authentication Modes',
                            value:
                              item.spec.security?.authentication?.modes?.join(', ') ||
                              'SCRAM-SHA-256 (default)',
                          },
                          {
                            name: 'Agent Mode',
                            value: item.spec.security?.authentication?.agentMode || '-',
                          },
                          {
                            name: 'TLS Enabled',
                            value: item.spec.security?.tls?.enabled ? 'Yes' : 'No',
                          },
                          {
                            name: 'TLS Optional',
                            value: item.spec.security?.tls?.optional ? 'Yes' : 'No',
                          },
                          {
                            name: 'Server Certificate Secret',
                            value: item.spec.security?.tls?.certificateKeySecretRef?.name || 'None',
                          },
                          {
                            name: 'CA Certificate Secret / ConfigMap',
                            value:
                              item.spec.security?.tls?.caCertificateSecretRef?.name ||
                              item.spec.security?.tls?.caConfigMapRef?.name ||
                              'None',
                          },
                          {
                            name: 'Agent Certificate Secret',
                            value: item.agentCertificateSecret,
                          },
                        ]}
                      />
                    </SectionBox>
                  ),
                },
                {
                  id: 'mongo-users',
                  section: (
                    <SectionBox title="Database Users">
                      {item.users.length === 0 ? (
                        <EmptyContent>
                          <Typography variant="body2" color="text.secondary">
                            No database users defined in the specification.
                          </Typography>
                        </EmptyContent>
                      ) : (
                        <SimpleTable
                          columns={[
                            {
                              label: 'Username',
                              getter: (user: MongoUser) => user.name,
                            },
                            {
                              label: 'Database',
                              getter: (user: MongoUser) => user.db || 'admin',
                            },
                            {
                              label: 'Roles',
                              getter: (user: MongoUser) =>
                                user.roles && user.roles.length > 0
                                  ? user.roles.map(r => `${r.name}@${r.db}`).join(', ')
                                  : 'None',
                            },
                            {
                              label: 'Password Secret',
                              getter: (user: MongoUser) => user.passwordSecretRef?.name || '-',
                            },
                            {
                              label: 'SCRAM Secret',
                              getter: (user: MongoUser) =>
                                user.scramCredentialsSecretName
                                  ? `${user.scramCredentialsSecretName}-scram-credentials`
                                  : '-',
                            },
                            {
                              label: 'Connection String Secret',
                              getter: (user: MongoUser) => item.getConnectionStringSecretName(user),
                            },
                          ]}
                          data={item.users}
                        />
                      )}
                    </SectionBox>
                  ),
                },
                {
                  id: 'mongo-workloads',
                  section: <WorkloadsSection item={item} />,
                },
              ]
            : []
        }
      />
    </MongoInstallGuard>
  );
}

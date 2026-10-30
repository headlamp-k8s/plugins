import { describe, expect, it, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib/lib/k8s/crd', () => ({
  makeCustomResourceClass: () =>
    class MockCRD {
      jsonData: any;
      constructor(jsonData: any) {
        this.jsonData = jsonData;
      }
    },
}));

import {
  MONGODB_COMMUNITY_CRD,
  MONGODB_COMMUNITY_GROUP,
  MONGODB_COMMUNITY_PLURAL,
  MONGODB_COMMUNITY_VERSION,
  MongoDBCommunity,
} from './mongoDBCommunity';
import type { MongoDBCommunityObject } from './types';

describe('MongoDBCommunity KubeObject Class', () => {
  it('has correct CRD constants', () => {
    expect(MONGODB_COMMUNITY_CRD).toBe('mongodbcommunity.mongodbcommunity.mongodb.com');
    expect(MONGODB_COMMUNITY_GROUP).toBe('mongodbcommunity.mongodb.com');
    expect(MONGODB_COMMUNITY_VERSION).toBe('v1');
    expect(MONGODB_COMMUNITY_PLURAL).toBe('mongodbcommunity');
  });

  it('exposes correct detailsRoute', () => {
    expect(MongoDBCommunity.detailsRoute).toBe('mongodb-community-detail');
  });

  it('correctly reads spec and status getters from valid manifest', () => {
    const rawData: MongoDBCommunityObject = {
      apiVersion: 'mongodbcommunity.mongodb.com/v1',
      kind: 'MongoDBCommunity',
      metadata: {
        name: 'test-mongodb',
        namespace: 'default',
        uid: 'uid-12345',
        creationTimestamp: '2026-10-24T12:00:00Z',
      },
      spec: {
        members: 3,
        type: 'ReplicaSet',
        version: '7.0.5',
        featureCompatibilityVersion: '7.0',
        security: {
          authentication: {
            modes: ['SCRAM'],
          },
          tls: {
            enabled: true,
          },
        },
        users: [
          {
            name: 'admin-user',
            db: 'admin',
            roles: [{ name: 'clusterAdmin', db: 'admin' }],
            passwordSecretRef: { name: 'admin-password' },
          },
        ],
      },
      status: {
        phase: 'Running',
        version: '7.0.5',
        currentMongoDBMembers: 3,
        currentStatefulSetReplicas: 3,
        mongoUri: 'mongodb://test-mongodb-0.test-mongodb-svc.default.svc.cluster.local:27017',
      },
    };

    const instance = new MongoDBCommunity(rawData as any);

    expect(instance.phase).toBe('Running');
    expect(instance.version).toBe('7.0.5');
    expect(instance.members).toBe(3);
    expect(instance.currentMembers).toBe(3);
    expect(instance.membersDisplay).toBe('3 / 3');
    expect(instance.users).toHaveLength(1);
    expect(instance.users[0].name).toBe('admin-user');
    expect(instance.users[0].passwordSecretRef?.name).toBe('admin-password');
    expect(instance.mongoUri).toContain('test-mongodb-0');
    expect(instance.message).toBeUndefined();
  });

  it('handles empty or missing status gracefully', () => {
    const rawData: MongoDBCommunityObject = {
      apiVersion: 'mongodbcommunity.mongodb.com/v1',
      kind: 'MongoDBCommunity',
      metadata: {
        name: 'pending-mongodb',
        namespace: 'default',
        uid: 'uid-67890',
        creationTimestamp: '2026-10-24T12:00:00Z',
      },
      spec: {
        members: 3,
        version: '6.0.5',
      },
    };

    const instance = new MongoDBCommunity(rawData as any);

    expect(instance.phase).toBe('Pending');
    expect(instance.version).toBe('6.0.5');
    expect(instance.members).toBe(3);
    expect(instance.currentMembers).toBe(0);
    expect(instance.membersDisplay).toBe('3');
    expect(instance.users).toEqual([]);
    expect(instance.mongoUri).toBe('-');
    expect(instance.message).toBeUndefined();
  });

  it('handles undefined spec gracefully', () => {
    const rawData = {
      apiVersion: 'mongodbcommunity.mongodb.com/v1',
      kind: 'MongoDBCommunity',
      metadata: {
        name: 'bare-mongodb',
        namespace: 'default',
        uid: 'uid-11111',
        creationTimestamp: '2026-10-24T12:00:00Z',
      },
    };

    const instance = new MongoDBCommunity(rawData as any);

    expect(instance.phase).toBe('Pending');
    expect(instance.version).toBe('-');
    expect(instance.members).toBe(0);
    expect(instance.membersDisplay).toBe('-');
    expect(instance.users).toEqual([]);
    expect(instance.agentCertificateSecret).toBe('None');
  });

  describe('agentCertificateSecret', () => {
    it('returns explicitly configured agentCertificateSecretRef name', () => {
      const instance = new MongoDBCommunity({
        metadata: { name: 'mongo' },
        spec: {
          security: {
            authentication: {
              modes: ['SCRAM'],
              agentCertificateSecretRef: { name: 'custom-agent-secret' },
            },
          },
        },
      } as any);

      expect(instance.agentCertificateSecret).toBe('custom-agent-secret');
    });

    it('returns agent-certs default when agentMode is explicitly X509', () => {
      const instance = new MongoDBCommunity({
        metadata: { name: 'mongo' },
        spec: {
          security: {
            authentication: {
              modes: ['SCRAM', 'X509'],
              agentMode: 'X509',
            },
          },
        },
      } as any);

      expect(instance.agentCertificateSecret).toBe('agent-certs');
    });

    it('returns agent-certs default when X509 is inherited from the sole authentication mode', () => {
      const instance = new MongoDBCommunity({
        metadata: { name: 'mongo' },
        spec: {
          security: {
            authentication: {
              modes: ['X509'],
            },
          },
        },
      } as any);

      expect(instance.agentCertificateSecret).toBe('agent-certs');
    });

    it('returns None when authentication is not X509 and secret is omitted', () => {
      const instance = new MongoDBCommunity({
        metadata: { name: 'mongo' },
        spec: {
          security: {
            authentication: {
              modes: ['SCRAM-SHA-256'],
            },
          },
        },
      } as any);

      expect(instance.agentCertificateSecret).toBe('None');
    });
  });

  describe('serviceName', () => {
    it('returns configured serviceName from spec.statefulSet.spec.serviceName', () => {
      const instance = new MongoDBCommunity({
        metadata: { name: 'my-mongo' },
        spec: {
          statefulSet: {
            spec: {
              serviceName: 'custom-svc-name',
            },
          },
        },
      } as any);

      expect(instance.serviceName).toBe('custom-svc-name');
    });

    it('defaults to <name>-svc when serviceName is not configured', () => {
      const instance = new MongoDBCommunity({
        metadata: { name: 'my-mongo' },
      } as any);

      expect(instance.serviceName).toBe('my-mongo-svc');
    });

    it('returns empty string when neither configured nor name is present', () => {
      const instance = new MongoDBCommunity({} as any);
      expect(instance.serviceName).toBe('');
    });
  });

  describe('getConnectionStringSecretName', () => {
    it('returns explicit connectionStringSecretName when specified', () => {
      const instance = new MongoDBCommunity({
        metadata: { name: 'my-mongo' },
      } as any);

      const secret = instance.getConnectionStringSecretName({
        name: 'app-user',
        db: 'app',
        connectionStringSecretName: 'custom-conn-secret',
      });

      expect(secret).toBe('custom-conn-secret');
    });

    it('derives normalized default secret name when connectionStringSecretName is omitted', () => {
      const instance = new MongoDBCommunity({
        metadata: { name: 'my-mongo' },
      } as any);

      const secret = instance.getConnectionStringSecretName({
        name: 'app-user',
        db: 'app_db',
      });

      expect(secret).toBe('my-mongo-app-db-app-user');
    });

    it('collapses consecutive hyphens matching upstream MCK pkg/util.NormalizeName', () => {
      const instance = new MongoDBCommunity({
        metadata: { name: 'my-mongo' },
      } as any);

      const secret = instance.getConnectionStringSecretName({
        name: 'app__user',
      });

      expect(secret).toBe('my-mongo-admin-app-user');
    });

    it('defaults database to admin, replaces invalid characters including dots, and collapses hyphens', () => {
      const instance = new MongoDBCommunity({
        metadata: { name: 'TestCluster' },
      } as any);

      const secret = instance.getConnectionStringSecretName({
        name: 'Admin_User.Special!',
      });

      expect(secret).toBe('testcluster-admin-admin-user-special');
    });

    it('preserves valid DNS names with dots', () => {
      const instance = new MongoDBCommunity({
        metadata: { name: 'my-mongo' },
      } as any);

      const secret = instance.getConnectionStringSecretName({
        name: 'db.valid-user',
        db: 'admin',
      });

      expect(secret).toBe('my-mongo-admin-db.valid-user');
    });

    it('truncates names exceeding 253 characters', () => {
      const instance = new MongoDBCommunity({
        metadata: { name: 'long-mongo' },
      } as any);

      const secret = instance.getConnectionStringSecretName({
        name: 'a'.repeat(300),
      });

      expect(secret.length).toBeLessThanOrEqual(253);
      expect(secret.startsWith('long-mongo-admin-')).toBe(true);
      expect(secret.endsWith('-')).toBe(false);
    });
  });
});

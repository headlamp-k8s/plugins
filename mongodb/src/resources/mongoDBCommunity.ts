import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import { mongoRouteNames } from '../utils/routes';
import type {
  MongoDBCommunityObject,
  MongoDBCommunitySpec,
  MongoDBCommunityStatus,
  MongoUser,
} from './types';

export const MONGODB_COMMUNITY_CRD = 'mongodbcommunity.mongodbcommunity.mongodb.com';
export const MONGODB_COMMUNITY_GROUP = 'mongodbcommunity.mongodb.com';
export const MONGODB_COMMUNITY_VERSION = 'v1';
export const MONGODB_COMMUNITY_PLURAL = 'mongodbcommunity';

const BaseMongoDBCommunity = makeCustomResourceClass({
  apiInfo: [{ group: MONGODB_COMMUNITY_GROUP, version: MONGODB_COMMUNITY_VERSION }],
  isNamespaced: true,
  kind: 'MongoDBCommunity',
  singularName: 'mongodbcommunity',
  pluralName: MONGODB_COMMUNITY_PLURAL,
});

/**
 * Headlamp KubeObject class representing a MongoDBCommunity custom resource.
 * Managed by the MongoDB Controllers for Kubernetes (MCK) operator.
 */
export class MongoDBCommunity extends BaseMongoDBCommunity {
  declare jsonData: MongoDBCommunityObject;

  static get detailsRoute(): string {
    return mongoRouteNames.communityDetail;
  }

  get spec(): MongoDBCommunitySpec {
    return this.jsonData?.spec ?? {};
  }

  get status(): MongoDBCommunityStatus | undefined {
    return this.jsonData?.status;
  }

  get phase(): string {
    return this.status?.phase ?? 'Pending';
  }

  get version(): string {
    return this.status?.version || this.spec?.version || '-';
  }

  get members(): number {
    return this.spec?.members ?? 0;
  }

  get currentMembers(): number {
    return this.status?.currentMongoDBMembers ?? 0;
  }

  get membersDisplay(): string {
    const desired = this.members;
    const current = this.status?.currentMongoDBMembers;
    if (current !== undefined) {
      return `${current} / ${desired}`;
    }
    return desired > 0 ? `${desired}` : '-';
  }

  get users(): MongoUser[] {
    return this.spec?.users ?? [];
  }

  get mongoUri(): string {
    return this.status?.mongoUri ?? '-';
  }

  get message(): string | undefined {
    return this.status?.message;
  }

  /**
   * Resolves the effective agent certificate Secret name.
   * In MCK 1.14.0, when agent authentication mode is X509 (explicit or inherited from sole mode),
   * omitting agentCertificateSecretRef defaults to 'agent-certs'.
   */
  get agentCertificateSecret(): string {
    const auth = this.spec.security?.authentication;
    if (auth?.agentCertificateSecretRef?.name) {
      return auth.agentCertificateSecretRef.name;
    }

    const effectiveAgentMode =
      auth?.agentMode || (auth?.modes?.length === 1 ? auth.modes[0] : undefined);

    if (effectiveAgentMode?.toUpperCase() === 'X509') {
      return 'agent-certs';
    }

    return 'None';
  }

  /**
   * Resolves the effective connection string Secret name for a database user.
   * When connectionStringSecretName is omitted, MCK 1.14.0 derives it by normalizing
   * `<resource-name>-<database>-<username>`.
   */
  getConnectionStringSecretName(user: MongoUser): string {
    if (user.connectionStringSecretName) {
      return user.connectionStringSecretName;
    }
    const resourceName = this.metadata?.name || this.jsonData?.metadata?.name || '';
    const db = user.db || 'admin';
    const raw = `${resourceName}-${db}-${user.name}`;
    return (
      raw
        .toLowerCase()
        .replace(/[^a-z0-9-.]/g, '-')
        .replace(/^-+|-+$/g, '') || '-'
    );
  }
}

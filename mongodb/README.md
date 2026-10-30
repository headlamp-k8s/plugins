# Headlamp MongoDB Plugin

A Headlamp plugin for viewing and monitoring MongoDB resources managed by the [MongoDB Controllers for Kubernetes](https://github.com/mongodb/mongodb-kubernetes) (MCK) operator.

It adds a dedicated MongoDB sidebar section with list and detail views for Community Edition replica sets (`MongoDBCommunity`). The sidebar section automatically hides itself on clusters where the operator CRDs are not installed.

## Features

- **Replica Sets List View**: Overview of all `MongoDBCommunity` resources across namespaces, displaying name, namespace, MongoDB version, member replica counts (active vs desired), lifecycle phase, and age.
- **Detailed Resource View**:
  - **Overview & Spec**: Running vs target MongoDB version, topology type, feature compatibility version, and connection string URI.
  - **Status & Diagnostics**: Current phase, member counts, underlying StatefulSet replicas, arbiters, and operator diagnostic messages.
  - **Security & Authentication**: Authentication modes (SCRAM, X509), automation agent mode, TLS configuration, and secret references (names only).
  - **Database Users**: List of users configured in the specification, their database scopes, assigned roles, and credentials secret references.
  - **Underlying Workloads**: Status of the operator-created StatefulSet and individual member pods with container readiness and restart counts.
- **Security Safeguards**: Only secret reference names are displayed. Secret values and passwords are never read or exposed.
- **Clean Degradation**: Hides itself completely if the CRD is absent on the active cluster. If navigated to directly, displays a helpful installation guide.

## Tested Operator Versions

- Verified against **MongoDB Controllers for Kubernetes (MCK)** Helm chart `mongodb/mongodb-kubernetes` version `1.14.0`, controller image `quay.io/mongodb/mongodb-kubernetes:1.14.0` (CRD `mongodbcommunity.mongodb.com/v1`).

## Scope & Roadmap

### v1 (Current Scope)

- `MongoDBCommunity` custom resource (Community Edition replica sets).

### Planned for Future PRs

- Enterprise replica sets and standalone deployments (`MongoDB`).
- Enterprise users (`MongoDBUser`).
- Ops Manager and Cloud Manager integration (`MongoDBOpsManager`).
- Atlas Search nodes (`MongoDBSearch`).
- Multi-cluster deployments (`MongoDBMultiCluster`).

## Screenshots

| View                                         | Screenshot File (`./pr-screenshots/`)                               |
| -------------------------------------------- | ------------------------------------------------------------------- |
| Replica Sets List                            | `01-list-view.png` <!-- Screenshot placeholder: list view -->       |
| Replica Set Detail                           | `02-detail-view.png` <!-- Screenshot placeholder: detail view -->   |
| Empty State (Filtered Namespace)             | `03-empty-state.png` <!-- Screenshot placeholder: empty state -->   |
| Resource Without Status (Pre-Reconciliation) | `04-no-status.png` <!-- Screenshot placeholder: no status -->       |
| Missing CRD / Graceful Degradation           | `05-crd-missing.png` <!-- Screenshot placeholder: missing crd -->   |
| Limited RBAC (Forbidden on CRD)              | `06-limited-rbac.png` <!-- Screenshot placeholder: limited rbac --> |

## Installation & Development

### Prerequisites

- Node.js (v20+ or v22+)
- A Kubernetes cluster with the MongoDB operator installed

### Local Development

1. Navigate to the plugin directory:

   ```bash
   cd mongodb
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the plugin development server:

   ```bash
   npm start
   ```

4. Start or open Headlamp. The plugin will be loaded automatically into the development environment.

### Verification Commands

Run the repository test, lint, and format checks:

```bash
npm run build
npm run tsc
npm run lint
npm run format -- --check
CI=true npm test
```

# Kafka Security Configurations

This directory contains Kafka cluster configurations organized by security level.

## 📁 Directory Structure

```
configurations/
├── no-security/           # No authentication, no authorization (development)
├── auth-only/             # Authentication only (staging/testing)
├── auth-and-authz/        # Full security with ACLs (production)
├── single-node/           # DEPRECATED - see no-security/
├── dual-role-3-nodes/     # DEPRECATED - see no-security/ or auth-and-authz/
├── 3-controllers-3-brokers/  # DEPRECATED
└── ephemeral-single-node/ # DEPRECATED
```

## 🔒 Security Levels

### 1️⃣ No Security (`no-security/`)

**Use for**: Local development, testing, non-sensitive data

- ❌ No authentication
- ❌ No authorization
- ✅ Anyone can connect
- ✅ Full access to all resources

**Configurations:**
- `kafka-single-node.yaml` - 1 node, 20Gi storage
- `kafka-3-nodes.yaml` - 3 nodes, 100Gi/node storage

[📖 Read more](./no-security/README.md)

---

### 2️⃣ Authentication Only (`auth-only/`)

**Use for**: Staging, user tracking, audit logging

- ✅ Authentication required (SCRAM or TLS)
- ❌ No authorization (authenticated users have full access)
- ✅ Identity verification
- ✅ Connection encryption (TLS variants)

**Configurations:**
- `kafka-single-node-scram.yaml` - SCRAM-SHA-512 authentication
- `kafka-single-node-tls.yaml` - TLS mutual authentication

[📖 Read more](./auth-only/README.md)

---

### 3️⃣ Full Security (`auth-and-authz/`)

**Use for**: Production, multi-tenant, compliance

- ✅ Authentication required
- ✅ Authorization with ACLs
- ✅ Fine-grained access control
- ✅ Principle of least privilege

**Configurations:**
- `kafka-single-node-secure.yaml` - 1 node, SCRAM + ACLs
- `kafka-3-nodes-secure.yaml` - 3 nodes, SCRAM/TLS + ACLs

[📖 Read more](./auth-and-authz/README.md)

---

## 🚀 Quick Start

### Choose Based on Environment

| Environment | Security Level | Configuration |
|------------|---------------|---------------|
| Local Dev | None | `no-security/kafka-single-node.yaml` |
| Staging | Auth Only | `auth-only/kafka-single-node-scram.yaml` |
| Production | Full | `auth-and-authz/kafka-3-nodes-secure.yaml` |

### Deploy

```bash
# Example: Deploy production-ready secure cluster
kubectl apply -f auth-and-authz/kafka-3-nodes-secure.yaml -n kafka

# Wait for cluster to be ready
kubectl wait kafka/my-cluster --for=condition=Ready --timeout=600s -n kafka
```

## 📊 Security Comparison

| Feature | No Security | Auth Only | Auth + Authz |
|---------|------------|-----------|--------------|
| **Authentication** | ❌ No | ✅ Yes | ✅ Yes |
| **Authorization** | ❌ No | ❌ No | ✅ Yes (ACLs) |
| **User Required** | ❌ No | ✅ Yes | ✅ Yes |
| **ACLs Required** | ❌ No | ❌ No | ✅ Yes |
| **Production Ready** | ❌ No | ⚠️ Limited | ✅ Yes |
| **Compliance** | ❌ No | ⚠️ Partial | ✅ Yes |

## 🔐 Authentication Types

### SCRAM-SHA-512
- Username/password authentication
- Credentials stored in Kubernetes secrets
- Easy to rotate
- Good for service accounts

### TLS (Mutual TLS)
- Certificate-based authentication
- Strong cryptographic identity
- More complex setup
- Best for service-to-service

## 📝 Creating Users

### No Security
No users needed - anyone can connect.

### Authentication Only
Create users without ACLs:

```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaUser
metadata:
  name: my-user
  labels:
    strimzi.io/cluster: my-cluster
spec:
  authentication:
    type: scram-sha-512
  # No authorization - user has full access once authenticated
```

### Authentication + Authorization
Create users WITH ACLs:

```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaUser
metadata:
  name: my-user
  labels:
    strimzi.io/cluster: my-cluster
spec:
  authentication:
    type: scram-sha-512
  authorization:
    type: simple
    acls:
      - resource:
          type: topic
          name: my-topic
          patternType: literal
        operations:
          - Read
          - Write
        host: "*"
```

## ⚠️ Important Notes

1. **Authorization Requires Cluster Config**: ACLs only work if the Kafka cluster has `authorization: type: simple` configured
2. **Default Deny**: With authorization enabled, users without ACLs have NO access
3. **Cannot Mix**: You cannot use "auth-only" users (no ACLs) with "auth-and-authz" clusters - they will be denied access
4. **Migration Path**: Start with no-security → add authentication → add authorization

## 🔄 Migration Guide

### From No Security to Auth Only

1. Deploy new cluster with authentication
2. Create users for all applications
3. Update application configurations with credentials
4. Switch applications to new cluster

### From Auth Only to Full Security

1. Update Kafka cluster with `authorization: type: simple`
2. Add ACLs to all existing KafkaUser resources
3. Cluster will restart automatically
4. Users without ACLs will be denied access

## 📚 Additional Resources

- [Strimzi Security Documentation](https://strimzi.io/docs/operators/latest/configuring.html#assembly-securing-kafka-str)
- [Example Users](../examples/users/)
- [Example Topics](../examples/topics/)

## 🗑️ Deprecated Configurations

Old configurations (single-node/, dual-role-3-nodes/, etc.) are deprecated. Use the new organized structure above for better clarity on security levels.

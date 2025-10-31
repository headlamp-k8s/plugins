# Kafka User Examples

Example KafkaUser configurations organized by security scenario.

## 📁 Directory Structure

```
users/
├── auth-only/              # Users for authentication-only clusters
└── auth-and-authz/         # Users for clusters with ACLs
```

## 🔒 User Types by Security Level

### Authentication Only (`auth-only/`)

**Use with**: Clusters that have authentication but NO authorization configured

Users in this directory:
- Have authentication configured (SCRAM or TLS)
- Do NOT have authorization/ACLs
- Get full access to all topics/groups once authenticated

**Files:**
- `simple-user-scram.yaml` - User with SCRAM-SHA-512 authentication
- `simple-user-tls.yaml` - User with TLS certificate authentication

**Example:**
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
  # No authorization - full access
```

---

### Authentication + Authorization (`auth-and-authz/`)

**Use with**: Clusters that have `authorization: type: simple` configured

Users in this directory:
- Have authentication configured
- Have ACLs defined for specific permissions
- Follow principle of least privilege

**Files:**
- `simple-user-scram.yaml` - Basic user with read/write ACLs for one topic
- `producer-user.yaml` - Producer with write permissions to topics with prefix
- `consumer-user.yaml` - Consumer with read permissions from topics with prefix
- `admin-user-tls.yaml` - Admin user with full cluster access

**Example:**
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

---

## 🚀 Quick Start

### 1. Identify Your Cluster Type

Check if your cluster has authorization:

```bash
kubectl get kafka my-cluster -n kafka -o jsonpath='{.spec.kafka.authorization.type}'
```

- **No output or empty**: Use `auth-only/` users (or no users for no-security)
- **Output "simple"**: Use `auth-and-authz/` users

### 2. Apply User Configuration

```bash
# For authentication-only clusters
kubectl apply -f auth-only/simple-user-scram.yaml -n kafka

# For clusters with authorization
kubectl apply -f auth-and-authz/producer-user.yaml -n kafka
```

### 3. Get User Credentials

```bash
# For SCRAM users (get password)
kubectl get secret my-user -n kafka -o jsonpath='{.data.password}' | base64 -d

# For TLS users (get certificate and key)
kubectl get secret my-user -n kafka -o jsonpath='{.data.user\.crt}' | base64 -d > user.crt
kubectl get secret my-user -n kafka -o jsonpath='{.data.user\.key}' | base64 -d > user.key
```

## ⚠️ Important Notes

### Matching Users to Clusters

| Cluster Type | User Directory | Works? |
|-------------|----------------|--------|
| No Security | (no users needed) | ✅ Yes |
| Auth Only | `auth-only/` | ✅ Yes |
| Auth Only | `auth-and-authz/` | ❌ No - ACLs ignored |
| Auth + Authz | `auth-only/` | ❌ No - User denied (no ACLs) |
| Auth + Authz | `auth-and-authz/` | ✅ Yes |

### Common Mistakes

1. **Using ACL users with auth-only clusters**: The ACLs will be ignored, user gets full access
2. **Using no-ACL users with auth-and-authz clusters**: User will be denied all access
3. **Forgetting to add authorization to cluster**: KafkaUsers with ACLs will fail to reconcile

## 📝 ACL Operations

Available operations for ACLs (auth-and-authz users):

- **Read**: Consume messages from topics
- **Write**: Produce messages to topics
- **Create**: Create new topics
- **Delete**: Delete topics
- **Describe**: View topic metadata
- **Alter**: Modify topic configuration
- **AlterConfigs**: Change topic configs
- **All**: All of the above

## 🔄 Pattern Types

- **literal**: Exact resource name match
- **prefix**: Match resources starting with name

Example:
```yaml
# Literal - matches only "my-topic"
name: my-topic
patternType: literal

# Prefix - matches "app-orders", "app-users", etc.
name: app-
patternType: prefix
```

## 📚 Additional Resources

- [Strimzi User Documentation](https://strimzi.io/docs/operators/latest/configuring.html#type-KafkaUser-reference)
- [Kafka ACL Documentation](https://kafka.apache.org/documentation/#security_authz)
- [Cluster Configurations](../../configurations/README.md)

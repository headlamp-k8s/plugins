# Full Security - Authentication + Authorization

These configurations require **authentication AND authorization** with ACL-based access control.

## ✅ Use Cases
- **Production environments**
- **Multi-tenant clusters**
- **Compliance requirements (SOC2, GDPR, etc.)**
- **Fine-grained access control**

## Security Level: Maximum
- ✅ Authentication required (users must identify themselves)
- ✅ Authorization enforced (ACLs control access)
- ✅ Fine-grained permissions (per-topic, per-group)
- ✅ Principle of least privilege

## Available Configurations

### kafka-single-node-secure.yaml
- **Authentication**: SCRAM-SHA-512
- **Authorization**: Simple ACLs
- **Nodes**: 1 dual-role node
- **Storage**: 20Gi persistent
- **Listener**: Plain with SCRAM auth (port 9092)

### kafka-3-nodes-secure.yaml
- **Authentication**: SCRAM-SHA-512 + TLS
- **Authorization**: Simple ACLs
- **Nodes**: 3 dual-role nodes
- **Storage**: 100Gi persistent per node
- **Listeners**:
  - Plain with SCRAM (port 9092)
  - TLS with certificates (port 9093)

## How to Deploy

```bash
# Single node with full security
kubectl apply -f kafka-single-node-secure.yaml -n kafka

# 3 nodes with full security
kubectl apply -f kafka-3-nodes-secure.yaml -n kafka
```

## Creating Users with ACLs

Users MUST specify authorization ACLs. Without ACLs, users cannot access any resources.

### Producer User Example:

```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaUser
metadata:
  name: producer-user
  labels:
    strimzi.io/cluster: my-cluster
spec:
  authentication:
    type: scram-sha-512
  authorization:
    type: simple
    acls:
      # Write to topics with prefix "app-"
      - resource:
          type: topic
          name: app-
          patternType: prefix
        operations:
          - Write
          - Create
          - Describe
        host: "*"
```

### Consumer User Example:

```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaUser
metadata:
  name: consumer-user
  labels:
    strimzi.io/cluster: my-cluster
spec:
  authentication:
    type: scram-sha-512
  authorization:
    type: simple
    acls:
      # Read from topics with prefix "app-"
      - resource:
          type: topic
          name: app-
          patternType: prefix
        operations:
          - Read
          - Describe
        host: "*"
      # Access consumer group
      - resource:
          type: group
          name: my-consumer-group
          patternType: literal
        operations:
          - Read
        host: "*"
```

### Admin User Example:

```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaUser
metadata:
  name: admin-user
  labels:
    strimzi.io/cluster: my-cluster
spec:
  authentication:
    type: tls
  authorization:
    type: simple
    acls:
      # Full access to all resources
      - resource:
          type: topic
          name: "*"
          patternType: literal
        operations:
          - All
        host: "*"
      - resource:
          type: group
          name: "*"
          patternType: literal
        operations:
          - All
        host: "*"
      - resource:
          type: cluster
        operations:
          - All
        host: "*"
```

## ACL Operations

Available operations for ACLs:
- **Read**: Consume messages
- **Write**: Produce messages
- **Create**: Create topics
- **Delete**: Delete topics
- **Describe**: View topic metadata
- **Alter**: Modify topic configuration
- **All**: All operations

## Connecting Clients

Clients need authentication credentials AND must have ACLs configured:

```properties
bootstrap.servers=my-cluster-kafka-bootstrap:9092
security.protocol=SASL_PLAINTEXT
sasl.mechanism=SCRAM-SHA-512
sasl.jaas.config=org.apache.kafka.common.security.scram.ScramLoginModule required \
  username="my-user" \
  password="<password-from-secret>";
```

## Important Notes

1. **Default Deny**: Without ACLs, users have NO access
2. **Explicit ACLs Required**: Every user needs specific ACLs defined
3. **Pattern Matching**: Use `prefix` for multiple topics, `literal` for exact match
4. **Super Users**: Cluster operators bypass ACLs (configured separately)
5. **ACL Updates**: Changes to ACLs take effect immediately

## Troubleshooting

If users cannot access topics:
1. Check user has authentication configured
2. Verify ACLs are defined in KafkaUser spec
3. Check Entity Operator logs for reconciliation errors
4. Verify cluster has `authorization: type: simple` configured

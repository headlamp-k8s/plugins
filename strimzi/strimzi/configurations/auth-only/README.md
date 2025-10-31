# Authentication Only - Verified Identity

These configurations require **authentication** but do NOT enforce authorization (ACLs).

## ✅ Use Cases
- **Development with user tracking**
- **Staging environments**
- **Audit logging requirements**
- **Transition from no-security to full-security**

## Security Level: Authentication
- ✅ Authentication required (users must identify themselves)
- ❌ No authorization checks (authenticated users have full access)
- ✅ Connection encryption available (TLS variants)
- ✅ Audit trail of user actions

## Available Configurations

### kafka-single-node-scram.yaml
- **Authentication**: SCRAM-SHA-512
- **Nodes**: 1 dual-role node
- **Storage**: 20Gi persistent
- **Listener**: Plain with SCRAM auth (port 9092)

### kafka-single-node-tls.yaml
- **Authentication**: TLS mutual authentication
- **Nodes**: 1 dual-role node
- **Storage**: 20Gi persistent
- **Listener**: TLS with client certificates (port 9093)

## How to Deploy

```bash
# SCRAM authentication
kubectl apply -f kafka-single-node-scram.yaml -n kafka

# TLS authentication
kubectl apply -f kafka-single-node-tls.yaml -n kafka
```

## Creating Users

### For SCRAM authentication:

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
  # No authorization section - user has full access
```

### For TLS authentication:

```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaUser
metadata:
  name: my-user
  labels:
    strimzi.io/cluster: my-cluster
spec:
  authentication:
    type: tls
  # No authorization section - user has full access
```

## Connecting Clients

### SCRAM:
```properties
bootstrap.servers=my-cluster-kafka-bootstrap:9092
security.protocol=SASL_PLAINTEXT
sasl.mechanism=SCRAM-SHA-512
sasl.jaas.config=org.apache.kafka.common.security.scram.ScramLoginModule required \
  username="my-user" \
  password="<password-from-secret>";
```

### TLS:
```properties
bootstrap.servers=my-cluster-kafka-bootstrap:9093
security.protocol=SSL
ssl.truststore.location=/path/to/truststore.jks
ssl.truststore.password=<password>
ssl.keystore.location=/path/to/keystore.jks
ssl.keystore.password=<password>
```

## Security Note

These configurations verify WHO is connecting, but do NOT restrict WHAT they can do. All authenticated users have full access to:
- Read/write all topics
- Create/delete topics
- Join any consumer group

For production with access control, use auth-and-authz configurations.

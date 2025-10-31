# No Security - Open Access Configurations

These configurations deploy Kafka clusters **without authentication or authorization**.

## ⚠️ Use Cases
- **Local development**
- **Testing environments**
- **Non-sensitive data**
- **Trusted network only**

## Security Level: None
- ❌ No authentication required
- ❌ No authorization checks
- ✅ All clients can connect
- ✅ All clients have full access to all topics

## Available Configurations

### kafka-single-node.yaml
- **Nodes**: 1 dual-role node
- **Storage**: 20Gi persistent
- **Replication**: 1
- **Listener**: Plain (port 9092, no TLS, no auth)

### kafka-3-nodes.yaml
- **Nodes**: 3 dual-role nodes
- **Storage**: 100Gi persistent per node
- **Replication**: 3 (min ISR: 2)
- **Listener**: Plain (port 9092, no TLS, no auth)

## How to Deploy

```bash
# Single node
kubectl apply -f kafka-single-node.yaml -n kafka

# 3 nodes
kubectl apply -f kafka-3-nodes.yaml -n kafka
```

## Connecting Clients

Since there's no security, clients connect with minimal configuration:

```properties
bootstrap.servers=my-cluster-kafka-bootstrap:9092
```

## ⚠️ Security Warning

**DO NOT use these configurations in production!** They provide no security and anyone with network access can:
- Read all topics
- Write to all topics
- Create/delete topics
- Modify cluster configuration

Use authentication and authorization for production deployments.

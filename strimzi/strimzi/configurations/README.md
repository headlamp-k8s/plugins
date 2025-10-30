# Kafka Configurations

This directory contains various Kafka cluster configurations for different use cases.

## Available Configurations

### 1. Ephemeral Single Node
**Directory**: `ephemeral-single-node/`

Perfect for quick testing and development where data persistence is not required.

- 1 dual-role node (controller + broker)
- Ephemeral storage (no persistence)
- Replication factor: 1
- Fast to deploy, no storage requirements

```bash
kubectl apply -f ephemeral-single-node/kafka-ephemeral-single.yaml -n kafka
```

### 2. Single Node (Persistent)
**Directory**: `single-node/`

Suitable for development environments where you need data persistence.

- 1 dual-role node (controller + broker)
- 20Gi persistent storage
- Replication factor: 1
- Data survives pod restarts

```bash
kubectl apply -f single-node/kafka-single-node.yaml -n kafka
```

### 3. 3 Dual-Role Nodes
**Directory**: `dual-role-3-nodes/`

Best balance between high availability and resource efficiency for small to medium production workloads.

- 3 dual-role nodes (controller + broker)
- 100Gi persistent storage per node (300Gi total)
- Replication factor: 3, min ISR: 2
- Can tolerate 1 node failure

```bash
kubectl apply -f dual-role-3-nodes/kafka-dual-role-3.yaml -n kafka
```

### 4. 3 Controllers + 3 Brokers
**Directory**: `3-controllers-3-brokers/`

Production-grade configuration with separated controller and broker roles for maximum performance and isolation.

- 3 dedicated controller nodes (20Gi each)
- 3 broker nodes (100Gi each)
- Replication factor: 3, min ISR: 2
- Better resource isolation and scaling flexibility

```bash
kubectl apply -f 3-controllers-3-brokers/kafka-3c-3b.yaml -n kafka
```

## Configuration Matrix

| Feature | Ephemeral Single | Single Node | 3 Dual-Role | 3C + 3B |
|---------|-----------------|-------------|-------------|---------|
| **Total Nodes** | 1 | 1 | 3 | 6 |
| **Controllers** | 1 | 1 | 3 | 3 |
| **Brokers** | 1 | 1 | 3 | 3 |
| **Storage Type** | Ephemeral | Persistent | Persistent | Persistent |
| **Total Storage** | - | 20Gi | 300Gi | 360Gi |
| **Replication** | 1 | 1 | 3 | 3 |
| **Min ISR** | 1 | 1 | 2 | 2 |
| **HA** | ❌ | ❌ | ✅ | ✅ |
| **Data Persistence** | ❌ | ✅ | ✅ | ✅ |
| **Use Case** | Testing | Development | Small Prod | Production |

## Choosing the Right Configuration

### Use Ephemeral Single Node when:
- Running integration tests in CI/CD
- Learning Kafka and Strimzi
- Quick prototyping
- Data persistence is not needed

### Use Single Node (Persistent) when:
- Developing applications locally
- Need data to persist across restarts
- Working with small datasets
- Testing data persistence features

### Use 3 Dual-Role Nodes when:
- Running in production with moderate load
- Want high availability with minimal resources
- Don't need to scale controllers and brokers independently
- Cost optimization is important

### Use 3 Controllers + 3 Brokers when:
- Running high-performance production workloads
- Need to scale brokers independently from controllers
- Maximum resource isolation is required
- Running large-scale Kafka deployments

## Common Customizations

### Change Kafka Version

Edit the `version` field in the Kafka spec:

```yaml
spec:
  kafka:
    version: 4.1.0  # Change to desired version
    metadataVersion: 3.9-IV0  # Update accordingly
```

### Adjust Storage Size

For persistent configurations, edit the storage size:

```yaml
storage:
  type: jbod
  volumes:
    - id: 0
      type: persistent-claim
      size: 200Gi  # Change to desired size
```

### Add External Access

Add a LoadBalancer listener for external access:

```yaml
listeners:
  - name: plain
    port: 9092
    type: internal
    tls: false
  - name: external
    port: 9094
    type: loadbalancer
    tls: false
```

### Configure Resource Limits

Add resource requests and limits:

```yaml
spec:
  replicas: 3
  roles:
    - broker
  resources:
    requests:
      memory: 2Gi
      cpu: 500m
    limits:
      memory: 4Gi
      cpu: 2000m
```

## Verification

After deploying any configuration:

```bash
# Check Kafka resource
kubectl get kafka my-cluster -n kafka

# Check node pools
kubectl get kafkanodepool -n kafka

# Check pods
kubectl get pods -n kafka -l strimzi.io/cluster=my-cluster

# Wait for ready state
kubectl wait kafka/my-cluster --for=condition=Ready --timeout=600s -n kafka
```

## Next Steps

After deploying a configuration:

1. Create topics using the Kafka Admin API or KafkaTopic CRDs
2. Configure users and ACLs if using authentication
3. Set up monitoring (see `../monitoring/` directory)
4. Configure TLS and authentication (see `../security/` directory)

For detailed information about each configuration, refer to the README.md file in each subdirectory.

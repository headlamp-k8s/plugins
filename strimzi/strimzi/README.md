# Strimzi Kafka Deployment Configurations

This repository contains various configurations for deploying Apache Kafka using the Strimzi Operator on Kubernetes.

## Overview

Strimzi provides a way to run Apache Kafka on Kubernetes in various configurations. This repository includes ready-to-use configurations for different deployment scenarios.

## Prerequisites

- Kubernetes cluster (1.23+)
- kubectl configured to access your cluster
- Sufficient storage provisioned (for persistent configurations)

## Quick Start

### 1. Install Strimzi Operator

```bash
cd operator
./install.sh
```

This will install the Strimzi operator in the `kafka` namespace.

### 2. Deploy a Kafka Cluster

Choose one of the available configurations based on your needs:

```bash
# For testing/development - ephemeral single node
kubectl apply -f configurations/ephemeral-single-node/kafka-ephemeral-single.yaml -n kafka

# For development - single node with persistence
kubectl apply -f configurations/single-node/kafka-single-node.yaml -n kafka

# For small production - 3 dual-role nodes
kubectl apply -f configurations/dual-role-3-nodes/kafka-dual-role-3.yaml -n kafka

# For production - 3 controllers + 3 brokers
kubectl apply -f configurations/3-controllers-3-brokers/kafka-3c-3b.yaml -n kafka
```

### 3. Verify Deployment

```bash
kubectl get kafka my-cluster -n kafka
kubectl get pods -n kafka -l strimzi.io/cluster=my-cluster
```

Wait for the cluster to be ready:

```bash
kubectl wait kafka/my-cluster --for=condition=Ready --timeout=600s -n kafka
```

## Available Configurations

### 1. Ephemeral Single Node
- **Path**: `configurations/ephemeral-single-node/`
- **Use case**: Testing, CI/CD, development
- **Resources**: 1 node (dual-role), ephemeral storage
- **HA**: None
- **Data persistence**: No

### 2. Single Node (Persistent)
- **Path**: `configurations/single-node/`
- **Use case**: Development, small testing environments
- **Resources**: 1 node (dual-role), 20Gi persistent storage
- **HA**: None
- **Data persistence**: Yes

### 3. 3 Dual-Role Nodes
- **Path**: `configurations/dual-role-3-nodes/`
- **Use case**: Small to medium production, cost-optimized HA
- **Resources**: 3 nodes (dual-role), 100Gi per node
- **HA**: Can tolerate 1 node failure
- **Data persistence**: Yes

### 4. 3 Controllers + 3 Brokers
- **Path**: `configurations/3-controllers-3-brokers/`
- **Use case**: Production, high-performance workloads
- **Resources**: 3 controllers (20Gi each) + 3 brokers (100Gi each)
- **HA**: Can tolerate 1 controller and 1 broker failure
- **Data persistence**: Yes

## Configuration Comparison

| Configuration | Nodes | Storage | Replication | Min ISR | Use Case |
|--------------|-------|---------|-------------|---------|----------|
| Ephemeral Single | 1 | Ephemeral | 1 | 1 | Testing/Dev |
| Single Node | 1 | 20Gi | 1 | 1 | Development |
| 3 Dual-Role | 3 | 300Gi | 3 | 2 | Small Prod |
| 3C + 3B | 6 | 360Gi | 3 | 2 | Production |

## Example Resources

The `examples/` directory contains ready-to-use YAML files for common Kafka resources:

### 📝 Topics

Located in `examples/topics/`:

- **simple-topic.yaml**: Basic topic with 1 partition and 1 replica (for single-node setups)
- **multi-partition-topic.yaml**: Multi-partition topic with 3 replicas (for production)
- **compacted-topic.yaml**: Log-compacted topic for state storage
- **high-throughput-topic.yaml**: Optimized for high-throughput scenarios

Apply a topic:
```bash
kubectl apply -f examples/topics/simple-topic.yaml -n kafka
```

### 👥 Users

Located in `examples/users/`:

- **simple-user-scram.yaml**: Basic user with SCRAM-SHA-512 authentication and read/write ACLs
- **admin-user-tls.yaml**: Admin user with TLS authentication and full cluster access
- **producer-user.yaml**: Producer-only user with write permissions
- **consumer-user.yaml**: Consumer-only user with read permissions

Apply a user:
```bash
kubectl apply -f examples/users/simple-user-scram.yaml -n kafka
```

After creating a user, retrieve the password:
```bash
# For SCRAM-SHA-512 users
kubectl get secret my-user -n kafka -o jsonpath='{.data.password}' | base64 -d
```

## Common Operations

### Check Cluster Status

```bash
kubectl get kafka -n kafka
kubectl describe kafka my-cluster -n kafka
```

### List Kafka Pods

```bash
kubectl get pods -n kafka -l strimzi.io/cluster=my-cluster
```

### View Kafka Logs

```bash
# For single node or dual-role
kubectl logs -n kafka my-cluster-dual-role-0 -c kafka

# For separated topology
kubectl logs -n kafka my-cluster-broker-0 -c kafka
kubectl logs -n kafka my-cluster-controller-0 -c kafka
```

### Create a Topic (kubectl apply)

```bash
# Use example configurations
kubectl apply -f examples/topics/simple-topic.yaml -n kafka

# Verify topic was created
kubectl get kafkatopic -n kafka
```

### Create a Topic (kafka-topics.sh)

```bash
kubectl run kafka-admin -ti --image=quay.io/strimzi/kafka:0.44.0-kafka-4.1.0 --rm=true --restart=Never -n kafka -- bin/kafka-topics.sh --bootstrap-server my-cluster-kafka-bootstrap:9092 --create --topic my-topic --partitions 3 --replication-factor 3
```

### List Topics

```bash
kubectl run kafka-admin -ti --image=quay.io/strimzi/kafka:0.44.0-kafka-4.1.0 --rm=true --restart=Never -n kafka -- bin/kafka-topics.sh --bootstrap-server my-cluster-kafka-bootstrap:9092 --list
```

### Produce Messages

```bash
kubectl run kafka-producer -ti --image=quay.io/strimzi/kafka:0.44.0-kafka-4.1.0 --rm=true --restart=Never -n kafka -- bin/kafka-console-producer.sh --bootstrap-server my-cluster-kafka-bootstrap:9092 --topic my-topic
```

### Consume Messages

```bash
kubectl run kafka-consumer -ti --image=quay.io/strimzi/kafka:0.44.0-kafka-4.1.0 --rm=true --restart=Never -n kafka -- bin/kafka-console-consumer.sh --bootstrap-server my-cluster-kafka-bootstrap:9092 --topic my-topic --from-beginning
```

## Scaling

### Scale Brokers (Separated Topology)

Edit the KafkaNodePool for brokers:

```bash
kubectl edit kafkanodepool broker -n kafka
```

Change `replicas` to desired number.

### Scale Dual-Role Nodes

Edit the KafkaNodePool:

```bash
kubectl edit kafkanodepool dual-role -n kafka
```

Change `replicas` to desired number (must be odd for KRaft: 1, 3, 5, 7, etc.).

## Cleanup

### Delete Kafka Cluster

```bash
kubectl delete kafka my-cluster -n kafka
kubectl delete kafkanodepool --all -n kafka
```

### Delete Persistent Storage

```bash
kubectl delete pvc -l strimzi.io/cluster=my-cluster -n kafka
```

### Uninstall Strimzi Operator

```bash
cd operator
./uninstall.sh
```

## Advanced Features

### Monitoring

The `monitoring/` directory contains configurations for:
- Prometheus metrics
- Grafana dashboards
- ServiceMonitor resources

### Security

The `security/` directory contains configurations for:
- TLS encryption
- SASL authentication
- ACL authorization
- User management

## Customization

Each configuration can be customized by editing the YAML files. Common customizations:

- **Storage size**: Adjust `size` in storage configuration
- **Kafka version**: Change `version` in Kafka spec
- **Listeners**: Add external listeners for outside cluster access
- **Resources**: Add CPU/memory limits and requests
- **JVM options**: Configure heap size and other JVM parameters

## Troubleshooting

### Cluster Not Ready

```bash
kubectl describe kafka my-cluster -n kafka
kubectl get events -n kafka --sort-by='.lastTimestamp'
```

### Pod Failures

```bash
kubectl describe pod <pod-name> -n kafka
kubectl logs <pod-name> -n kafka -c kafka
```

### Storage Issues

```bash
kubectl get pvc -n kafka
kubectl describe pvc <pvc-name> -n kafka
```

## Architecture: KRaft Mode

All configurations use KRaft mode (KIP-500), which removes the dependency on ZooKeeper:

- **Controllers**: Manage cluster metadata and leader election
- **Brokers**: Handle data storage and client requests
- **Dual-role nodes**: Perform both functions (suitable for smaller deployments)

## Resources

- [Strimzi Documentation](https://strimzi.io/docs/operators/latest/overview.html)
- [Strimzi GitHub Repository](https://github.com/strimzi/strimzi-kafka-operator)
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [KRaft (KIP-500)](https://cwiki.apache.org/confluence/display/KAFKA/KIP-500%3A+Replace+ZooKeeper+with+a+Self-Managed+Metadata+Quorum)

## License

This repository contains configuration examples for use with Strimzi, which is licensed under the Apache License 2.0.

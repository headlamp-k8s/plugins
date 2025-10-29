# 3 Dual-Role Nodes Configuration

This configuration deploys a Kafka cluster with 3 nodes, each performing both controller and broker roles.

## Architecture

- 3 nodes with dual role (controller + broker)
- Persistent storage: 100Gi per node
- KRaft mode (no ZooKeeper)
- Replication factor: 3
- Min in-sync replicas: 2

## When to Use This Configuration

This configuration is ideal when:
- You want a simpler topology with fewer pods
- You need high availability but want to minimize resource usage
- Your workload doesn't require the separation of controller and broker functions
- You're running a small to medium-sized production cluster

## Deployment

```bash
kubectl apply -f kafka-dual-role-3.yaml -n kafka
```

## Verification

Check the Kafka cluster status:

```bash
kubectl get kafka my-cluster -n kafka
kubectl get kafkanodepool -n kafka
kubectl get pods -n kafka -l strimzi.io/cluster=my-cluster
```

You should see 3 pods (my-cluster-dual-role-*), each acting as both controller and broker.

Wait for the cluster to be ready:

```bash
kubectl wait kafka/my-cluster --for=condition=Ready --timeout=600s -n kafka
```

## Storage Requirements

This configuration requires:
- 3 x 100Gi PVs = 300Gi total persistent storage

## Testing

Create a test topic with replication factor 3:

```bash
kubectl run kafka-producer -ti --image=quay.io/strimzi/kafka:0.44.0-kafka-3.9.0 --rm=true --restart=Never -n kafka -- bin/kafka-topics.sh --bootstrap-server my-cluster-kafka-bootstrap:9092 --create --topic test-topic --partitions 3 --replication-factor 3
```

Produce messages:

```bash
kubectl run kafka-producer -ti --image=quay.io/strimzi/kafka:0.44.0-kafka-3.9.0 --rm=true --restart=Never -n kafka -- bin/kafka-console-producer.sh --bootstrap-server my-cluster-kafka-bootstrap:9092 --topic test-topic
```

Consume messages:

```bash
kubectl run kafka-consumer -ti --image=quay.io/strimzi/kafka:0.44.0-kafka-3.9.0 --rm=true --restart=Never -n kafka -- bin/kafka-console-consumer.sh --bootstrap-server my-cluster-kafka-bootstrap:9092 --topic test-topic --from-beginning
```

## High Availability

This configuration provides high availability:
- Can tolerate 1 node failure
- Data is replicated across 3 nodes
- min.insync.replicas=2 ensures data durability

## Comparison with Separated Controllers/Brokers

**Dual-Role (this configuration):**
- Pros: Fewer pods, simpler management, lower resource overhead
- Cons: Controller and broker processes share resources

**Separated Controllers/Brokers:**
- Pros: Better isolation, easier to scale brokers independently
- Cons: More pods to manage, higher resource requirements

## Cleanup

```bash
kubectl delete -f kafka-dual-role-3.yaml -n kafka
```

Note: By default, PersistentVolumeClaims are retained. To delete them:

```bash
kubectl delete pvc -l strimzi.io/cluster=my-cluster -n kafka
```

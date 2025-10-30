# 3 Controllers + 3 Brokers Configuration

This configuration deploys a production-ready Kafka cluster with separate controller and broker nodes.

## Architecture

- 3 dedicated controller nodes (20Gi storage each)
- 3 broker nodes (100Gi storage each)
- Persistent storage
- KRaft mode (no ZooKeeper)
- Replication factor: 3
- Min in-sync replicas: 2

## Deployment

```bash
kubectl apply -f kafka-3c-3b.yaml -n kafka
```

## Verification

Check the Kafka cluster status:

```bash
kubectl get kafka my-cluster -n kafka
kubectl get kafkanodepool -n kafka
kubectl get pods -n kafka -l strimzi.io/cluster=my-cluster
```

You should see 6 pods total:
- 3 controller pods (my-cluster-controller-*)
- 3 broker pods (my-cluster-broker-*)

Wait for the cluster to be ready:

```bash
kubectl wait kafka/my-cluster --for=condition=Ready --timeout=600s -n kafka
```

## Storage Requirements

This configuration requires:
- 3 x 20Gi PVs for controllers = 60Gi
- 3 x 100Gi PVs for brokers = 300Gi
- Total: 360Gi of persistent storage

Ensure your Kubernetes cluster has sufficient storage capacity and a storage class configured.

## Testing

Create a test topic with replication factor 3:

```bash
kubectl run kafka-producer -ti --image=quay.io/strimzi/kafka:0.44.0-kafka-4.1.0 --rm=true --restart=Never -n kafka -- bin/kafka-topics.sh --bootstrap-server my-cluster-kafka-bootstrap:9092 --create --topic test-topic --partitions 3 --replication-factor 3
```

Produce messages:

```bash
kubectl run kafka-producer -ti --image=quay.io/strimzi/kafka:0.44.0-kafka-4.1.0 --rm=true --restart=Never -n kafka -- bin/kafka-console-producer.sh --bootstrap-server my-cluster-kafka-bootstrap:9092 --topic test-topic
```

Consume messages:

```bash
kubectl run kafka-consumer -ti --image=quay.io/strimzi/kafka:0.44.0-kafka-4.1.0 --rm=true --restart=Never -n kafka -- bin/kafka-console-consumer.sh --bootstrap-server my-cluster-kafka-bootstrap:9092 --topic test-topic --from-beginning
```

## High Availability

This configuration provides high availability:
- Controllers: Can tolerate 1 controller failure
- Brokers: Can tolerate 1 broker failure with min.insync.replicas=2
- Data is replicated across 3 brokers

## Cleanup

```bash
kubectl delete -f kafka-3c-3b.yaml -n kafka
```

Note: By default, PersistentVolumeClaims are retained. To delete them:

```bash
kubectl delete pvc -l strimzi.io/cluster=my-cluster -n kafka
```

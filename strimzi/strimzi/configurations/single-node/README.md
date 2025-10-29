# Single Node Kafka Configuration

This configuration deploys a minimal Kafka cluster with a single node that performs both controller and broker roles.

## Architecture

- 1 node with dual role (controller + broker)
- Persistent storage: 20Gi
- KRaft mode (no ZooKeeper)
- Replication factor: 1 (suitable for development/testing only)

## Deployment

```bash
kubectl apply -f kafka-single-node.yaml -n kafka
```

## Verification

Check the Kafka cluster status:

```bash
kubectl get kafka my-cluster -n kafka
kubectl get kafkanodepool -n kafka
kubectl get pods -n kafka -l strimzi.io/cluster=my-cluster
```

Wait for the cluster to be ready:

```bash
kubectl wait kafka/my-cluster --for=condition=Ready --timeout=300s -n kafka
```

## Testing

Create a test topic:

```bash
kubectl run kafka-producer -ti --image=quay.io/strimzi/kafka:0.44.0-kafka-3.9.0 --rm=true --restart=Never -n kafka -- bin/kafka-console-producer.sh --bootstrap-server my-cluster-kafka-bootstrap:9092 --topic test-topic
```

Consume messages:

```bash
kubectl run kafka-consumer -ti --image=quay.io/strimzi/kafka:0.44.0-kafka-3.9.0 --rm=true --restart=Never -n kafka -- bin/kafka-console-consumer.sh --bootstrap-server my-cluster-kafka-bootstrap:9092 --topic test-topic --from-beginning
```

## Cleanup

```bash
kubectl delete -f kafka-single-node.yaml -n kafka
```

## Note

This configuration is suitable for development and testing purposes only. For production environments, use configurations with higher replication factors and multiple nodes.

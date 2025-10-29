# Ephemeral Single Node Kafka Configuration

This configuration deploys a minimal Kafka cluster with a single node using ephemeral storage (no persistence).

## Architecture

- 1 node with dual role (controller + broker)
- Ephemeral storage (data is lost when pod restarts)
- KRaft mode (no ZooKeeper)
- Replication factor: 1

## When to Use This Configuration

This configuration is ideal for:
- Quick testing and experimentation
- CI/CD pipelines
- Development environments
- Scenarios where data persistence is not required
- Learning Kafka and Strimzi

## ⚠️ Important Warning

**DATA WILL BE LOST** when:
- The pod is restarted
- The pod is deleted
- The node fails
- Kubernetes reschedules the pod

**DO NOT USE IN PRODUCTION!**

## Deployment

```bash
kubectl apply -f kafka-ephemeral-single.yaml -n kafka
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

## Storage Requirements

None - uses ephemeral storage (emptyDir volumes).

## Testing

Create a test topic:

```bash
kubectl run kafka-producer -ti --image=quay.io/strimzi/kafka:0.44.0-kafka-3.9.0 --rm=true --restart=Never -n kafka -- bin/kafka-topics.sh --bootstrap-server my-cluster-kafka-bootstrap:9092 --create --topic test-topic --partitions 1 --replication-factor 1
```

Produce messages:

```bash
kubectl run kafka-producer -ti --image=quay.io/strimzi/kafka:0.44.0-kafka-3.9.0 --rm=true --restart=Never -n kafka -- bin/kafka-console-producer.sh --bootstrap-server my-cluster-kafka-bootstrap:9092 --topic test-topic
```

Consume messages:

```bash
kubectl run kafka-consumer -ti --image=quay.io/strimzi/kafka:0.44.0-kafka-3.9.0 --rm=true --restart=Never -n kafka -- bin/kafka-console-consumer.sh --bootstrap-server my-cluster-kafka-bootstrap:9092 --topic test-topic --from-beginning
```

## Advantages

- Fast deployment (no PV provisioning needed)
- No storage costs
- Clean slate on every restart
- Perfect for testing

## Cleanup

```bash
kubectl delete -f kafka-ephemeral-single.yaml -n kafka
```

All data will be removed automatically.

# Strimzi sample manifests for Headlamp testing

YAML samples to deploy Kafka clusters, topics, and users so you can exercise the Strimzi Headlamp plugin against a **real cluster**.

## Prerequisites

- A Kubernetes cluster you can `kubectl apply` to
- [Strimzi Cluster Operator](https://strimzi.io/docs/operators/latest/deploying.html) installed (version that supports `kafka.strimzi.io/v1beta2`)
- Enough resources for ephemeral Kafka (or edit storage to use your `StorageClass`)

## Layout

| Path | Purpose |
|------|---------|
| `namespace.yaml` | Namespace `strimzi-headlamp-test` |
| `kafka/kraft-ephemeral.yaml` | KRaft Kafka + `KafkaNodePool` (single broker+controller) |
| `kafka/zookeeper-ephemeral.yaml` | Classic Kafka + ZooKeeper (ephemeral) |
| `kafka/kafka-invalid-version.yaml` | Same shape as ZK cluster but **invalid Kafka version** → expect **Not Ready** in UI |
| `topics/` | `KafkaTopic` CRs — label must match the Kafka **metadata.name** you deploy |
| `users/` | `KafkaUser` CRs (SCRAM, TLS, ACLs) |

## Apply order

1. **Namespace** (once):

   ```bash
   kubectl apply -f namespace.yaml
   ```

2. **Exactly one** full Kafka stack in the test namespace (pick one):

   **KRaft** (Strimzi with node pools + KRaft; common on recent operators):

   ```bash
   kubectl apply -f kafka/kraft-ephemeral.yaml
   ```

   **ZooKeeper**:

   ```bash
   kubectl apply -f kafka/zookeeper-ephemeral.yaml
   ```

3. Wait until the Kafka custom resource is **Ready** (except for the invalid-version sample):

   ```bash
   kubectl get kafka -n strimzi-headlamp-test -w
   ```

4. **Topics** — use the file whose `strimzi.io/cluster` label matches your cluster name:

   - KRaft sample cluster name: **`strimzi-demo-kraft`**
   - ZK sample cluster name: **`strimzi-demo-zk`**

   ```bash
   kubectl apply -f topics/topic-basic-kraft.yaml   # if you applied kraft-ephemeral.yaml
   # or
   kubectl apply -f topics/topic-basic-zk.yaml      # if you applied zookeeper-ephemeral.yaml
   ```

   Optional high-partition topic (KRaft cluster name):

   ```bash
   kubectl apply -f topics/topic-high-partitions-kraft.yaml
   ```

5. **Users** — same label rule as topics:

   ```bash
   kubectl apply -f users/user-scram-kraft.yaml
   # or
   kubectl apply -f users/user-scram-zk.yaml
   ```

   Optional:

   ```bash
   kubectl apply -f users/user-tls-kraft.yaml
   kubectl apply -f users/user-with-acls-kraft.yaml
   ```

### Invalid-version cluster (Not Ready)

Do **not** apply topics/users against this cluster (Entity Operator / cluster will not be healthy).

```bash
kubectl apply -f kafka/kafka-invalid-version.yaml
```

In Headlamp, open **Strimzi → Kafka** and confirm the cluster shows a non-ready status.

## What to verify in Headlamp

- **Kafka**: list shows **KRaft** vs **ZooKeeper** mode; detail page listeners, storage, status
- **KafkaTopic**: list filters; create/edit/delete (against a **Ready** cluster)
- **KafkaUser**: SCRAM / TLS types; **View secret** for password; ACLs on detail
- **Cluster topology** (if enabled): graph for a ready cluster

## Cleanup

```bash
kubectl delete -f users/ --ignore-not-found -n strimzi-headlamp-test
kubectl delete -f topics/ --ignore-not-found -n strimzi-headlamp-test
kubectl delete -f kafka/ --ignore-not-found -n strimzi-headlamp-test
kubectl delete -f namespace.yaml
```

If you applied only some files, delete by resource name:

```bash
kubectl delete kafka strimzi-demo-kraft -n strimzi-headlamp-test
kubectl delete kafkanodepool brokers -n strimzi-headlamp-test
```

## Customization

- **Storage**: replace `ephemeral` with `persistent-claim` and set `size` / `class` per [Strimzi docs](https://strimzi.io/docs/operators/latest/full/configuring.html).
- **Versions**: align `spec.kafka.version` and `metadataVersion` (KRaft) with your operator’s supported images.

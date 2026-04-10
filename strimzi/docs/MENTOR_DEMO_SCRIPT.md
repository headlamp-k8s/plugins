# Strimzi Headlamp plugin — demo

Step-by-step demo: cluster prep → apply `test-files/` → Headlamp UI.

---

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| Kubernetes cluster | e.g. minikube, kind, or cloud |
| `kubectl` | Context points at that cluster |
| Strimzi Cluster Operator | [Install](https://strimzi.io/docs/operators/latest/deploying.html#deploying-cluster-operator-helm) |
| Headlamp + Strimzi plugin | Same kube context as `kubectl` — [plugin README](../README.md) |

**Minikube example**

```bash
minikube start --cpus=4 --memory=8192
kubectl cluster-info
```

**Operator / CRDs**

```bash
kubectl get crd | grep kafka.strimzi.io
```

---

## 1. Deploy test stack

Paths: `plugins/strimzi/test-files/` (from this repo).

**Commands**

```bash
cd /path/to/plugins/strimzi/test-files

kubectl apply -f namespace.yaml
kubectl apply -f kafka/zookeeper-ephemeral.yaml
kubectl wait kafka/strimzi-demo-zk -n strimzi-headlamp-test --for=condition=Ready --timeout=15m
kubectl apply -f topics/topic-basic-zk.yaml
kubectl apply -f users/user-scram-zk.yaml
```

**Or** from repo root:

```bash
bash plugins/strimzi/docs/demo-apply-test-stack.sh
```

**If wait fails**

```bash
kubectl get kafka,pods -n strimzi-headlamp-test
kubectl describe kafka strimzi-demo-zk -n strimzi-headlamp-test
kubectl get events -n strimzi-headlamp-test --sort-by='.lastTimestamp' | tail -25
```

---

## 2. Headlamp

1. Open Headlamp → cluster context matches `kubectl`.
2. **Strimzi** → **Kafka Clusters** — row **`strimzi-demo-zk`**, status Ready when Strimzi is Ready.
3. **Kafka Clusters** — search / **Filters** (optional).
4. Click cluster **name** — detail (listeners, storage, status).
5. **Topology** — graph from list row action.
6. **Strimzi** → **Kafka Topics** — open **`headlamp-demo-basic`** (partitions, replicas, config).
7. **Strimzi** → **Kafka Users** — open **`headlamp-demo-scram`** — **View secret** (password material).

---

## 3. Verify

```bash
kubectl get kafka,kafkatopic,kafkauser -n strimzi-headlamp-test
```

UI names and **Status** should match Strimzi (`kubectl describe kafka strimzi-demo-zk -n strimzi-headlamp-test`).

**Plugin scope:** Kafka, KafkaTopic, KafkaUser, topology — not Kafka Connect.

---

## 4. Cleanup

```bash
kubectl delete namespace strimzi-headlamp-test
```

---

## References

- [Plugin README](../README.md)
- [test-files README](../test-files/README.md)
- [Headlamp](https://headlamp.dev/)
- [Strimzi docs](https://strimzi.io/documentation/)

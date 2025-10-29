# Kafka Monitoring with Prometheus

This directory contains configurations for monitoring Kafka clusters with Prometheus.

## Prerequisites

- Prometheus Operator installed in your cluster
- Kafka cluster deployed with Strimzi

## Setup

### 1. Apply Metrics ConfigMap

```bash
kubectl apply -f prometheus-metrics.yaml -n kafka
```

### 2. Enable Metrics in Kafka Configuration

Add the following to your Kafka resource:

```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: my-cluster
spec:
  kafka:
    metricsConfig:
      type: jmxPrometheusExporter
      valueFrom:
        configMapKeyRef:
          name: kafka-metrics
          key: kafka-metrics-config.yml
```

### 3. Create ServiceMonitor (Optional)

If you're using Prometheus Operator:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: kafka-metrics
  labels:
    app: strimzi
spec:
  selector:
    matchLabels:
      strimzi.io/kind: Kafka
  endpoints:
  - port: tcp-prometheus
    interval: 30s
```

## Available Metrics

The configuration exposes standard Kafka JMX metrics including:

- Broker metrics (requests, bytes in/out, etc.)
- Topic metrics (partition count, replication status)
- Consumer group metrics (lag, offsets)
- Network metrics (connections, throughput)
- Log metrics (size, segments)

## Accessing Metrics

Metrics are exposed on port 9404 of each Kafka pod:

```bash
kubectl port-forward my-cluster-broker-0 9404:9404 -n kafka
curl http://localhost:9404/metrics
```

## Grafana Dashboards

For pre-built Grafana dashboards for Strimzi:

- [Strimzi Kafka Dashboard](https://github.com/strimzi/strimzi-kafka-operator/tree/main/examples/metrics/grafana-dashboards)
- Import dashboard ID: 11962 (Strimzi Kafka)

## Useful Queries

### Topics with highest incoming rate
```promql
rate(kafka_server_brokertopicmetrics_messagesinpersec_total[5m])
```

### Consumer group lag
```promql
kafka_consumergroup_lag
```

### Broker CPU usage
```promql
process_cpu_seconds_total{job="kafka"}
```

## Resources

- [Strimzi Metrics Documentation](https://strimzi.io/docs/operators/latest/deploying.html#assembly-metrics-str)
- [Kafka Monitoring with Prometheus](https://kafka.apache.org/documentation/#monitoring)

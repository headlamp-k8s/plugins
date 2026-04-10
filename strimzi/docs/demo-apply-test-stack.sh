#!/usr/bin/env bash
# Apply the Strimzi test stack from test-files/ (ZooKeeper ephemeral sample).
# Run from anywhere; resolves paths relative to this script.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_FILES="${SCRIPT_DIR}/../test-files"
NS="strimzi-headlamp-test"
KAFKA_NAME="strimzi-demo-zk"
WAIT_TIMEOUT="${WAIT_TIMEOUT:-15m}"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "error: kubectl not found in PATH" >&2
  exit 1
fi

if [[ ! -d "${TEST_FILES}" ]]; then
  echo "error: test-files not found at ${TEST_FILES}" >&2
  exit 1
fi

echo "==> Applying namespace"
kubectl apply -f "${TEST_FILES}/namespace.yaml"

echo "==> Applying Kafka (ZooKeeper ephemeral): ${KAFKA_NAME}"
kubectl apply -f "${TEST_FILES}/kafka/zookeeper-ephemeral.yaml"

echo "==> Waiting for Kafka Ready (timeout ${WAIT_TIMEOUT}) ..."
if kubectl wait "kafka/${KAFKA_NAME}" -n "${NS}" --for=condition=Ready --timeout="${WAIT_TIMEOUT}"; then
  echo "    Kafka is Ready."
else
  echo "error: Kafka did not become Ready in time." >&2
  echo "    kubectl get kafka,pods -n ${NS}" >&2
  echo "    kubectl describe kafka ${KAFKA_NAME} -n ${NS}" >&2
  exit 1
fi

echo "==> Applying KafkaTopic + KafkaUser (ZK cluster label)"
kubectl apply -f "${TEST_FILES}/topics/topic-basic-zk.yaml"
kubectl apply -f "${TEST_FILES}/users/user-scram-zk.yaml"

echo ""
echo "Done. Next steps:"
echo "  - kubectl get kafka,kafkatopic,kafkauser -n ${NS}"
echo "  - Open Headlamp → Strimzi → Kafka Clusters (same kube context)"
echo "  - Cleanup: kubectl delete namespace ${NS}"

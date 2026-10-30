#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EVENTING_DIR="${SCRIPT_DIR}/eventing"
TEST_NAMESPACE="knative-eventing-test"
WAIT_TIMEOUT="${WAIT_TIMEOUT:-300s}"
NATS_CHANNEL_RELEASE="${NATS_CHANNEL_RELEASE:-knative-v1.23.3}"
KAFKA_CHANNEL_RELEASE="${KAFKA_CHANNEL_RELEASE:-knative-v1.23.2}"
NATS_RELEASE_URL="https://github.com/knative-extensions/eventing-natss/releases/download/${NATS_CHANNEL_RELEASE}"
KAFKA_RELEASE_URL="https://github.com/knative-extensions/eventing-kafka-broker/releases/download/${KAFKA_CHANNEL_RELEASE}"

wait_for_rollout() {
  local namespace="$1"
  local resource="$2"
  echo "Waiting up to ${WAIT_TIMEOUT} for ${resource} in ${namespace}"
  kubectl rollout status --timeout="${WAIT_TIMEOUT}" --namespace="${namespace}" "${resource}"
}

wait_for_ready() {
  local resource="$1"
  echo "Waiting up to ${WAIT_TIMEOUT} for ${resource} to become Ready"
  kubectl wait \
    --for=condition=Ready \
    --timeout="${WAIT_TIMEOUT}" \
    --namespace="${TEST_NAMESPACE}" \
    "${resource}"
}

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl is required but was not found in PATH." >&2
  exit 1
fi

if ! kubectl get namespace "${TEST_NAMESPACE}" >/dev/null 2>&1; then
  echo "Run ./test-files/setup-eventing.sh first; namespace ${TEST_NAMESPACE} was not found." >&2
  exit 1
fi

echo "Using kubectl context: $(kubectl config current-context)"

echo "Installing a single-node NATS JetStream server and the NatsJetStreamChannel"
kubectl apply -f "${EVENTING_DIR}/channel-implementations/nats-server.yaml"
wait_for_rollout nats-io deployment/nats
kubectl apply -f "${NATS_RELEASE_URL}/eventing-jsm.yaml"
kubectl apply -f "https://raw.githubusercontent.com/knative-extensions/eventing-natss/${NATS_CHANNEL_RELEASE}/examples/config-nats.yaml"
wait_for_rollout knative-eventing deployment/jetstream-ch-controller

echo "Installing a single-node Kafka broker and the KafkaChannel"
kubectl apply -f "${EVENTING_DIR}/channel-implementations/kafka-server.yaml"
wait_for_rollout kafka deployment/kafka
kubectl apply -f "${KAFKA_RELEASE_URL}/eventing-kafka-controller.yaml"
kubectl apply -f "${KAFKA_RELEASE_URL}/eventing-kafka-channel.yaml"
wait_for_rollout knative-eventing deployment/kafka-controller
wait_for_rollout knative-eventing deployment/kafka-webhook-eventing
kubectl apply -f "${KAFKA_RELEASE_URL}/eventing-kafka-post-install.yaml"

echo "Applying 04-channel-implementations.yaml"
kubectl apply -f "${EVENTING_DIR}/04-channel-implementations.yaml"

wait_for_ready "kafkachannel.messaging.knative.dev/orders-kafka"
wait_for_ready "kafkachannel.messaging.knative.dev/payments-kafka"
wait_for_ready "natsjetstreamchannel.messaging.knative.dev/orders-nats"
wait_for_ready "subscription.messaging.knative.dev/kafka-to-display"
wait_for_ready "subscription.messaging.knative.dev/nats-to-display"

echo
echo "KafkaChannel and NatsJetStreamChannel test resources are ready in namespace ${TEST_NAMESPACE}."
echo "See ${SCRIPT_DIR}/README.md for the channel implementation checks."

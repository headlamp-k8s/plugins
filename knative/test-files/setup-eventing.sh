#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EVENTING_DIR="${SCRIPT_DIR}/eventing"
TEST_NAMESPACE="knative-eventing-test"
WAIT_TIMEOUT="${WAIT_TIMEOUT:-180s}"

apply_manifest() {
  local manifest_name="$1"
  echo "Applying ${manifest_name}"
  kubectl apply -f "${EVENTING_DIR}/${manifest_name}"
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

required_crds=(
  "brokers.eventing.knative.dev"
  "triggers.eventing.knative.dev"
  "inmemorychannels.messaging.knative.dev"
  "channels.messaging.knative.dev"
  "subscriptions.messaging.knative.dev"
  "pingsources.sources.knative.dev"
  "apiserversources.sources.knative.dev"
  "sinkbindings.sources.knative.dev"
)
for crd_name in "${required_crds[@]}"; do
  if ! kubectl get crd "${crd_name}" >/dev/null 2>&1; then
    echo "Required Knative CRD ${crd_name} is not installed in the current context." >&2
    exit 1
  fi
done

echo "Using kubectl context: $(kubectl config current-context)"
apply_manifest "00-namespace-and-sink.yaml"
apply_manifest "01-broker-and-triggers.yaml"
apply_manifest "02-channel-and-subscriptions.yaml"
apply_manifest "03-sources.yaml"

wait_for_ready "broker.eventing.knative.dev/default"
wait_for_ready "trigger.eventing.knative.dev/catch-all"
wait_for_ready "trigger.eventing.knative.dev/uri-subscriber"
wait_for_ready "trigger.eventing.knative.dev/order-created"
wait_for_ready "channel.messaging.knative.dev/orders"
wait_for_ready "subscription.messaging.knative.dev/orders-to-display"
wait_for_ready "pingsource.sources.knative.dev/heartbeat"
wait_for_ready "apiserversource.sources.knative.dev/k8s-events"
wait_for_ready "sinkbinding.sources.knative.dev/bind-heartbeat"

echo
echo "Knative Eventing test resources are ready in namespace ${TEST_NAMESPACE}."
echo "See ${SCRIPT_DIR}/README.md for the Eventing checks."

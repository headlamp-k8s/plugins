#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_NAMESPACE="knative-map-test"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl is required but was not found in PATH." >&2
  exit 1
fi

echo "Using kubectl context: $(kubectl config current-context)"

# Delete the cluster-scoped claim even if the test namespace has already been removed.
if kubectl get crd clusterdomainclaims.networking.internal.knative.dev >/dev/null 2>&1; then
  kubectl delete \
    --ignore-not-found=true \
    clusterdomainclaim.networking.internal.knative.dev \
    "healthy.knative-map-test.local"
fi

if kubectl get crd podmonitors.monitoring.coreos.com >/dev/null 2>&1; then
  kubectl delete --ignore-not-found=true -f "${SCRIPT_DIR}/podmonitor.yaml"
fi

kubectl delete --ignore-not-found=true namespace "${TEST_NAMESPACE}"

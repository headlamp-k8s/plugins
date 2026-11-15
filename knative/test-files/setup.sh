#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="${SCRIPT_DIR}/deploy"
TEST_NAMESPACE="knative-map-test"
WAIT_TIMEOUT="${WAIT_TIMEOUT:-180s}"

apply_manifest() {
  local manifest_name="$1"
  echo "Applying ${manifest_name}"
  kubectl apply -f "${DEPLOY_DIR}/${manifest_name}"
}

wait_for_service() {
  local service_name="$1"
  echo "Waiting up to ${WAIT_TIMEOUT} for ${service_name} to become Ready"
  kubectl wait \
    --for=condition=Ready \
    --timeout="${WAIT_TIMEOUT}" \
    --namespace="${TEST_NAMESPACE}" \
    "service.serving.knative.dev/${service_name}"
}

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl is required but was not found in PATH." >&2
  exit 1
fi

required_crds=(
  "services.serving.knative.dev"
  "domainmappings.serving.knative.dev"
  "clusterdomainclaims.networking.internal.knative.dev"
)
for crd_name in "${required_crds[@]}"; do
  if ! kubectl get crd "${crd_name}" >/dev/null 2>&1; then
    echo "Required Knative CRD ${crd_name} is not installed in the current context." >&2
    exit 1
  fi
done

echo "Using kubectl context: $(kubectl config current-context)"
apply_manifest "00-namespace.yaml"

# These services each need only one apply to reach their intended state.
apply_manifest "01-service-healthy.yaml"
apply_manifest "01-service-metrics-demo.yaml"
apply_manifest "01-service-scaled-to-zero.yaml"
apply_manifest "01-service-serving-internals.yaml"

wait_for_service "healthy-service"
wait_for_service "metrics-demo-service"
wait_for_service "scaled-to-zero-service"
wait_for_service "serving-internals-service"

# Wait for the named v1 revisions before manifests refer to them by revisionName.
apply_manifest "01-service-traffic-split-v1.yaml"
wait_for_service "traffic-split-service"
apply_manifest "02-service-traffic-split-v2.yaml"
wait_for_service "traffic-split-service"

apply_manifest "01-service-rollback-v1.yaml"
wait_for_service "rollback-service"
apply_manifest "02-service-rollback-v2.yaml"
wait_for_service "rollback-service"

# These fixtures are intentionally not Ready and must not block setup.
apply_manifest "01-service-failed-revision.yaml"
apply_manifest "01-service-image-resolution-failure.yaml"

# The healthy mapping target is now Ready. Mapping readiness still depends on the cluster's
# domain and TLS configuration, which is part of what these fixtures are intended to expose.
apply_manifest "03-domainmapping-core-svc.yaml"
apply_manifest "03-domainmapping-broken-ref.yaml"
apply_manifest "03-domainmapping-healthy.yaml"

echo
echo "Knative test resources are ready in namespace ${TEST_NAMESPACE}."
echo "See ${SCRIPT_DIR}/README.md for UI checks and optional metrics setup."

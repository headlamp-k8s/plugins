#!/bin/bash
# run-all-traffic.sh
# Master script: sets up two revisions with a traffic split, then runs all
# traffic generators to populate all chart views (Request Rate, By Revision,
# Latency, Resources).
#
# Usage:
#   ./run-all-traffic.sh [namespace] [service-name]
#
# Examples:
#   ./run-all-traffic.sh
#   ./run-all-traffic.sh knative-map-test metrics-demo-service

set -e
NAMESPACE="${1:-knative-map-test}"
SERVICE_NAME="${2:-metrics-demo-service}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=============================================="
echo "  Knative Metrics — Full Traffic Generator"
echo "=============================================="
echo "Namespace: $NAMESPACE"
echo "Service:   $SERVICE_NAME"
echo ""

# ── Prerequisites ──────────────────────────────────────────────────────────────

if ! kubectl get ksvc "$SERVICE_NAME" -n "$NAMESPACE" &>/dev/null; then
  echo "ERROR: KService '$SERVICE_NAME' not found in namespace '$NAMESPACE'."
  echo ""
  echo "To deploy the test service, run:"
  echo "  kubectl apply -f ${SCRIPT_DIR}/../deploy/00-namespace.yaml"
  echo "  kubectl apply -f ${SCRIPT_DIR}/../deploy/01-service-metrics-demo.yaml"
  echo "  kubectl apply -f ${SCRIPT_DIR}/../podmonitor.yaml"
  exit 1
fi

# ── Step 1: Deploy two revisions with a 70/30 traffic split ───────────────────

echo ""
echo "--- Step 1/5: Deploying two revisions with 70/30 traffic split ---"

# Tag the current revision as 'v1'
kubectl label ksvc "$SERVICE_NAME" -n "$NAMESPACE" app.kubernetes.io/version=test --overwrite &>/dev/null || true

# Apply a traffic-split update: v1 (current) gets 70%, v2 (new) gets 30%.
# We force a new revision by changing an env var.
cat <<EOF | kubectl apply -f -
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: ${SERVICE_NAME}
  namespace: ${NAMESPACE}
spec:
  template:
    metadata:
      annotations:
        # Force a new revision
        autoscaling.knative.dev/minScale: "1"
        metrics-demo/run-id: "$(date +%s)"
    spec:
      containers:
        - image: mccutchen/go-httpbin
          env:
            - name: REVISION_LABEL
              value: "v2"
  traffic:
    - latestRevision: true
      percent: 30
      tag: v2
    - revisionName: $(kubectl get ksvc "$SERVICE_NAME" -n "$NAMESPACE" -o jsonpath='{.status.latestReadyRevisionName}')
      percent: 70
      tag: v1
EOF

echo "Waiting for new revision to become ready..."
kubectl wait ksvc "$SERVICE_NAME" -n "$NAMESPACE" --for=condition=Ready --timeout=120s

LATEST_REV=$(kubectl get ksvc "$SERVICE_NAME" -n "$NAMESPACE" -o jsonpath='{.status.latestReadyRevisionName}')
echo "Active revisions:"
kubectl get revisions -n "$NAMESPACE" -l "serving.knative.dev/service=$SERVICE_NAME" \
  -o custom-columns="NAME:.metadata.name,READY:.status.conditions[?(@.type=='Ready')].status" 2>/dev/null || true
echo ""

# ── Helper ────────────────────────────────────────────────────────────────────

run_script() {
  local script_name="$1"
  local script_path="$SCRIPT_DIR/$script_name"

  if [ ! -f "$script_path" ]; then
    echo "WARNING: $script_name not found, skipping."
    return
  fi

  echo ""
  echo "----------------------------------------------"
  echo "  Running: $script_name"
  echo "----------------------------------------------"
  bash "$script_path" "$NAMESPACE" "$SERVICE_NAME"
  echo "Pausing 10s before next script..."
  sleep 10
}

# ── Traffic phases ────────────────────────────────────────────────────────────

echo "--- Step 2/5: Mixed traffic (success + 4xx + 5xx) ---"
run_script "generate-traffic.sh"

echo "--- Step 3/5: Error code breakdown ---"
run_script "generate-error-traffic.sh"

echo "--- Step 4/5: Latency patterns ---"
run_script "generate-latency-traffic.sh"

echo "--- Step 5/5: Resource stress ---"
run_script "generate-resource-stress.sh"

echo ""
echo "=============================================="
echo "  All traffic generators completed!"
echo "=============================================="
echo ""
echo "Open Headlamp and check:"
echo "  KService '$SERVICE_NAME':  Request Rate | By Revision | Latency | Resources"
echo "  Revision '${LATEST_REV}': Request Rate | Latency | Resources"
echo ""
echo "Tip: The 'By Revision' tab should show two separate lines for v1/v2."
echo "     If charts show 'No Data', wait ~30s for the first Prometheus scrape."

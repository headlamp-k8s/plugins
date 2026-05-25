#!/bin/bash
# generate-resource-stress.sh
# Generates CPU and memory stress on the Knative service to test the Resources chart.
# Uses go-httpbin's /bytes endpoint to allocate memory and /delay to use CPU time.

NAMESPACE="${1:-knative-map-test}"
SERVICE_NAME="${2:-metrics-demo-service}"

echo "=== Knative Resource Stress Generator ==="
echo "Namespace: $NAMESPACE"
echo "Service:   $SERVICE_NAME"
echo ""

echo "Waiting for $SERVICE_NAME to be ready..."
kubectl wait ksvc $SERVICE_NAME -n $NAMESPACE --for=condition=Ready --timeout=60s

echo "Deploying resource-stress-generator pod..."
kubectl delete pod resource-stress-generator -n $NAMESPACE --ignore-not-found 2>/dev/null

kubectl run resource-stress-generator -n $NAMESPACE --image=alpine/curl --restart=Never -- /bin/sh -c '
  SERVICE_URL="http://'"$SERVICE_NAME"'.'"$NAMESPACE"'.svc.cluster.local"

  echo "=== Phase 1: Baseline (light load) ==="
  echo "Sending light requests to establish a baseline..."
  for i in $(seq 1 20); do
    curl -s -o /dev/null "${SERVICE_URL}/status/200" &
    sleep 0.5
  done
  wait
  echo "Baseline phase completed."

  sleep 5

  echo "=== Phase 2: Memory pressure (large response bodies) ==="
  echo "Requesting large response bodies to increase memory usage..."
  for i in $(seq 1 15); do
    # Request 100KB response bodies
    curl -s -o /dev/null "${SERVICE_URL}/bytes/102400" &
    sleep 0.3
  done
  wait
  echo "Memory pressure phase completed."

  sleep 5

  echo "=== Phase 3: CPU pressure (concurrent delayed requests) ==="
  echo "Sending many concurrent requests to increase CPU usage..."
  for i in $(seq 1 30); do
    curl -s -o /dev/null "${SERVICE_URL}/delay/1" &
    sleep 0.1
  done
  wait
  echo "CPU pressure phase completed."

  sleep 5

  echo "=== Phase 4: Burst traffic ==="
  echo "Sending a burst of 50 concurrent requests..."
  for i in $(seq 1 50); do
    curl -s -o /dev/null "${SERVICE_URL}/bytes/10240" &
  done
  wait
  echo "Burst phase completed."

  echo ""
  echo "=== Resource stress test complete! ==="
'

echo "Following logs from the cluster..."
kubectl wait pod resource-stress-generator -n $NAMESPACE --for=condition=Ready --timeout=30s 2>/dev/null
kubectl logs -f resource-stress-generator -n $NAMESPACE

echo "Cleaning up..."
kubectl delete pod resource-stress-generator -n $NAMESPACE

#!/bin/bash
# generate-error-traffic.sh
# Generates traffic with various HTTP error codes to test the Request Rate chart.
# Tests 2xx/4xx/5xx response_code_class breakdown.

NAMESPACE="${1:-knative-map-test}"
SERVICE_NAME="${2:-metrics-demo-service}"

echo "=== Knative Error Traffic Generator ==="
echo "Namespace: $NAMESPACE"
echo "Service:   $SERVICE_NAME"
echo ""

echo "Waiting for $SERVICE_NAME to be ready..."
kubectl wait ksvc $SERVICE_NAME -n $NAMESPACE --for=condition=Ready --timeout=60s

echo "Deploying error-traffic-generator pod..."
kubectl delete pod error-traffic-generator -n $NAMESPACE --ignore-not-found 2>/dev/null

kubectl run error-traffic-generator -n $NAMESPACE --image=alpine/curl --restart=Never -- /bin/sh -c '
  SERVICE_URL="http://'"$SERVICE_NAME"'.'"$NAMESPACE"'.svc.cluster.local"

  send_requests() {
    status_code=$1
    count=$2
    
    echo "Sending $count requests that return HTTP $status_code..."
    for i in $(seq 1 $count); do
      curl -s -o /dev/null -w "status=%{http_code}\n" "${SERVICE_URL}/status/${status_code}" &
      sleep 0.15
    done
    wait
  }

  # Phase 1: Only 200s (healthy baseline)
  echo "=== Phase 1: Healthy traffic (100% 200) ==="
  send_requests 200 40

  sleep 5

  # Phase 2: Mix of 200 and 404 (client errors)
  echo "=== Phase 2: Client errors (200 + 404) ==="
  send_requests 200 20
  send_requests 404 10

  sleep 5

  # Phase 3: Mix of 200 and 500 (server errors)
  echo "=== Phase 3: Server errors (200 + 500) ==="
  send_requests 200 20
  send_requests 500 10

  sleep 5

  # Phase 4: All error codes mixed
  echo "=== Phase 4: Mixed error codes ==="
  send_requests 200 30
  send_requests 400 5
  send_requests 403 5
  send_requests 404 5
  send_requests 500 5
  send_requests 502 3
  send_requests 503 3

  echo ""
  echo "=== Error traffic generation complete! ==="
'

echo "Following logs from the cluster..."
kubectl wait pod error-traffic-generator -n $NAMESPACE --for=condition=Ready --timeout=30s 2>/dev/null
kubectl logs -f error-traffic-generator -n $NAMESPACE

echo "Cleaning up..."
kubectl delete pod error-traffic-generator -n $NAMESPACE

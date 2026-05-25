#!/bin/bash
# generate-latency-traffic.sh
# Generates traffic with varying latency patterns to test the Latency chart.
# Uses go-httpbin's /delay endpoint to create real latency.

NAMESPACE="${1:-knative-map-test}"
SERVICE_NAME="${2:-metrics-demo-service}"

echo "=== Knative Latency Traffic Generator ==="
echo "Namespace: $NAMESPACE"
echo "Service:   $SERVICE_NAME"
echo ""

echo "Waiting for $SERVICE_NAME to be ready..."
kubectl wait ksvc $SERVICE_NAME -n $NAMESPACE --for=condition=Ready --timeout=60s

echo "Deploying latency-traffic-generator pod..."
kubectl delete pod latency-traffic-generator -n $NAMESPACE --ignore-not-found 2>/dev/null

kubectl run latency-traffic-generator -n $NAMESPACE --image=alpine/curl --restart=Never -- /bin/sh -c '
  SERVICE_URL="http://'"$SERVICE_NAME"'.'"$NAMESPACE"'.svc.cluster.local"

  send_latency_traffic() {
    delay=$1
    count=$2
    
    echo "------------------------------------------------------"
    echo "Phase: Sending $count requests with ~${delay}s delay"
    
    for i in $(seq 1 $count); do
      curl -s -o /dev/null -w "delay=${delay}s status=%{http_code} time=%{time_total}s\n" \
        "${SERVICE_URL}/delay/${delay}" &
      
      # Small stagger to avoid thundering herd
      sleep 0.3
    done
    
    wait
    echo "Phase completed."
  }

  # Phase 1: Fast requests (low latency baseline)
  echo "=== Phase 1: Low latency (0.1s delay) ==="
  send_latency_traffic 0.1 30

  # Phase 2: Medium latency
  echo "=== Phase 2: Medium latency (0.5s delay) ==="
  send_latency_traffic 0.5 20

  # Phase 3: High latency (simulates slow requests)
  echo "=== Phase 3: High latency (2s delay) ==="
  send_latency_traffic 2 10

  # Phase 4: Mixed latency (realistic pattern)
  echo "=== Phase 4: Mixed latency pattern ==="
  for i in $(seq 1 30); do
    RAND=$(awk "BEGIN{srand(); print int(rand()*100)}")
    if [ "$RAND" -lt 70 ]; then
      curl -s -o /dev/null -w "mixed: delay=0.1s status=%{http_code}\n" "${SERVICE_URL}/delay/0.1" &
    elif [ "$RAND" -lt 90 ]; then
      curl -s -o /dev/null -w "mixed: delay=0.5s status=%{http_code}\n" "${SERVICE_URL}/delay/0.5" &
    else
      curl -s -o /dev/null -w "mixed: delay=2s status=%{http_code}\n" "${SERVICE_URL}/delay/2" &
    fi
    sleep 0.2
  done
  wait

  echo ""
  echo "=== Latency traffic generation complete! ==="
'

echo "Following logs from the cluster..."
kubectl wait pod latency-traffic-generator -n $NAMESPACE --for=condition=Ready --timeout=30s 2>/dev/null
kubectl logs -f latency-traffic-generator -n $NAMESPACE

echo "Cleaning up..."
kubectl delete pod latency-traffic-generator -n $NAMESPACE

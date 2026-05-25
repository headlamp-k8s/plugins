#!/bin/bash
# generate-sustained-traffic.sh
# Generates sustained low-rate traffic for a long period.
# This keeps the service alive and generates continuous metrics for 
# all 3 charts (Request Rate, Latency, Resources).

NAMESPACE="${1:-knative-map-test}"
SERVICE_NAME="${2:-metrics-demo-service}"
DURATION="${3:-300}" # Default: 5 minutes

echo "=== Knative Sustained Traffic Generator ==="
echo "Namespace: $NAMESPACE"
echo "Service:   $SERVICE_NAME"
echo "Duration:  ${DURATION}s"
echo ""

echo "Waiting for $SERVICE_NAME to be ready..."
kubectl wait ksvc $SERVICE_NAME -n $NAMESPACE --for=condition=Ready --timeout=60s

echo "Deploying sustained-traffic-generator pod..."
kubectl delete pod sustained-traffic-generator -n $NAMESPACE --ignore-not-found 2>/dev/null

kubectl run sustained-traffic-generator -n $NAMESPACE --image=alpine/curl --restart=Never -- /bin/sh -c '
  SERVICE_URL="http://'"$SERVICE_NAME"'.'"$NAMESPACE"'.svc.cluster.local"
  DURATION='"$DURATION"'
  END_TIME=$(( $(date +%s) + DURATION ))
  REQUEST_COUNT=0
  
  echo "Sending sustained traffic for ${DURATION}s..."
  echo "Start time: $(date)"
  
  while [ $(date +%s) -lt $END_TIME ]; do
    REMAINING=$(( END_TIME - $(date +%s) ))
    
    # Mix of request types to generate diverse metrics
    RAND=$(awk "BEGIN{srand(); print int(rand()*100)}")
    
    if [ "$RAND" -lt 70 ]; then
      # 70% - Normal fast requests
      curl -s -o /dev/null "${SERVICE_URL}/status/200" &
    elif [ "$RAND" -lt 80 ]; then
      # 10% - Slow requests (latency)
      curl -s -o /dev/null "${SERVICE_URL}/delay/0.5" &
    elif [ "$RAND" -lt 90 ]; then
      # 10% - Client errors
      curl -s -o /dev/null "${SERVICE_URL}/status/404" &
    else
      # 10% - Server errors
      curl -s -o /dev/null "${SERVICE_URL}/status/500" &
    fi
    
    REQUEST_COUNT=$((REQUEST_COUNT + 1))
    
    # Print progress every 50 requests
    if [ $((REQUEST_COUNT % 50)) -eq 0 ]; then
      echo "[${REMAINING}s remaining] Sent $REQUEST_COUNT requests so far..."
    fi
    
    sleep 1
  done
  
  wait
  echo ""
  echo "End time: $(date)"
  echo "Total requests sent: $REQUEST_COUNT"
  echo "=== Sustained traffic generation complete! ==="
'

echo "Following logs from the cluster..."
kubectl wait pod sustained-traffic-generator -n $NAMESPACE --for=condition=Ready --timeout=30s 2>/dev/null
kubectl logs -f sustained-traffic-generator -n $NAMESPACE

echo "Cleaning up..."
kubectl delete pod sustained-traffic-generator -n $NAMESPACE

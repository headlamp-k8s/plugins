#!/bin/bash

NAMESPACE="${1:-knative-map-test}"
SERVICE_NAME="${2:-metrics-demo-service}"

echo "Wait for $SERVICE_NAME to be ready..."
kubectl wait ksvc $SERVICE_NAME -n $NAMESPACE --for=condition=Ready --timeout=60s

echo "Deploying traffic-generator pod into the cluster to bypass local DNS..."
kubectl delete pod traffic-generator -n $NAMESPACE --ignore-not-found 2>/dev/null

kubectl run traffic-generator -n $NAMESPACE --image=alpine/curl --restart=Never \
  --env="SERVICE_URL=http://${SERVICE_NAME}.${NAMESPACE}.svc.cluster.local" -- /bin/sh -c '
  
  send_traffic() {
    duration=$1
    error_rate=$2
    end_time=$(( $(date +%s) + duration ))
    
    echo "------------------------------------------------------"
    echo "Starting Phase: ${error_rate}% errors for ${duration} seconds."
    
    while [ $(date +%s) -lt $end_time ]; do
      # Derive a true random seed from urandom to avoid awk srand() repeating within the same second
      SEED=$(cat /dev/urandom | tr -dc '0-9' | head -c 8)
      RAND=$(awk -v min=1 -v max=100 -v seed="$SEED" "BEGIN{srand(seed); print int(min+rand()*(max-min+1))}")
      
      if [ "$RAND" -le "$error_rate" ]; then
        # Split errors: half 400 (client), half 500 (server)
        ERR_SEED=$(cat /dev/urandom | tr -dc '0-9' | head -c 8)
        ERR_RAND=$(awk -v min=1 -v max=100 -v seed="$ERR_SEED" "BEGIN{srand(seed); print int(min+rand()*(max-min+1))}")
        if [ "$ERR_RAND" -le 50 ]; then
          curl -s -o /dev/null -w "Sent request: %{http_code} Client Error\n" "${SERVICE_URL}/status/400" &
        else
          curl -s -o /dev/null -w "Sent request: %{http_code} Server Error\n" "${SERVICE_URL}/status/500" &
        fi
      else
        curl -s -o /dev/null -w "Sent request: %{http_code} OK\n" "${SERVICE_URL}/status/200" &
      fi
      
      sleep 0.2
    done
    
    wait
    echo "Phase completed."
  }

  send_traffic 20 0
  send_traffic 60 5
  send_traffic 60 40
  
  echo "Traffic generation complete!"
'

echo "Following logs from the cluster..."
# Wait for pod to start
sleep 3
kubectl logs -f traffic-generator -n $NAMESPACE

echo "Cleaning up..."
kubectl delete pod traffic-generator -n $NAMESPACE


#!/bin/bash
set -e

# Strimzi Operator Uninstallation Script
# This script removes the Strimzi Kafka Operator from the specified namespace
#
# Usage:
#   ./uninstall.sh                    # Keep PVCs (data preserved)
#   DELETE_PVCS=true ./uninstall.sh   # Delete PVCs (data lost)

NAMESPACE="${NAMESPACE:-kafka}"
DELETE_PVCS="${DELETE_PVCS:-false}"

echo "Uninstalling Strimzi Kafka Operator from namespace '${NAMESPACE}'"

# Delete all Kafka resources first
echo "Deleting Kafka clusters..."
kubectl delete kafka --all -n ${NAMESPACE} --ignore-not-found=true

echo "Deleting KafkaNodePools..."
kubectl delete kafkanodepool --all -n ${NAMESPACE} --ignore-not-found=true

echo "Deleting KafkaTopics..."
kubectl delete kafkatopic --all -n ${NAMESPACE} --ignore-not-found=true

echo "Deleting KafkaUsers..."
kubectl delete kafkauser --all -n ${NAMESPACE} --ignore-not-found=true

# Wait a bit for resources to be cleaned up
echo "Waiting for resources to be cleaned up..."
sleep 10

# Delete PVCs if requested
if [ "$DELETE_PVCS" = "true" ]; then
  echo "Deleting PersistentVolumeClaims..."
  kubectl delete pvc -l strimzi.io/cluster -n ${NAMESPACE} --ignore-not-found=true
  echo "All data has been deleted!"
else
  echo "Keeping PersistentVolumeClaims (data preserved)"
  echo "To delete PVCs and all data, run:"
  echo "  DELETE_PVCS=true ./uninstall.sh"
  echo "Or manually:"
  echo "  kubectl delete pvc -l strimzi.io/cluster -n ${NAMESPACE}"
fi

# Delete the operator
echo "Deleting Strimzi operator..."
kubectl delete -f https://strimzi.io/install/latest?namespace=${NAMESPACE} -n ${NAMESPACE} --ignore-not-found=true

echo ""
echo "Strimzi operator uninstalled successfully!"
echo ""
echo "Note: The namespace '${NAMESPACE}' was not deleted. To delete it, run:"
echo "  kubectl delete namespace ${NAMESPACE}"

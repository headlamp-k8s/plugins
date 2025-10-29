#!/bin/bash
set -e

# Strimzi Operator Installation Script
# This script installs the Strimzi Kafka Operator in the specified namespace

NAMESPACE="${NAMESPACE:-kafka}"
STRIMZI_VERSION="${STRIMZI_VERSION:-0.44.0}"

echo "Installing Strimzi Kafka Operator v${STRIMZI_VERSION} in namespace '${NAMESPACE}'"

# Create namespace if it doesn't exist
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

# Download and apply Strimzi operator installation files
echo "Downloading Strimzi operator files..."
kubectl create -f https://strimzi.io/install/latest?namespace=${NAMESPACE} -n ${NAMESPACE}

echo "Waiting for Strimzi operator to be ready..."
kubectl wait --for=condition=ready pod -l name=strimzi-cluster-operator -n ${NAMESPACE} --timeout=300s

echo "Strimzi operator installed successfully!"
echo ""
echo "You can now deploy Kafka clusters using the configurations in the 'configurations' directory."
echo ""
echo "Example:"
echo "  kubectl apply -f configurations/single-node/kafka-single-node.yaml -n ${NAMESPACE}"

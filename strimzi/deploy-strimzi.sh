#!/bin/bash
set -e

# Strimzi Deployment Helper Script
# This script helps deploy Strimzi operator and Kafka clusters

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STRIMZI_DIR="${SCRIPT_DIR}/strimzi"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${GREEN}=== $1 ===${NC}"
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

show_usage() {
    cat << EOF
Usage: $0 [COMMAND] [OPTIONS]

Commands:
    install-operator        Install Strimzi operator
    deploy <config>        Deploy Kafka cluster with specified configuration
    list-configs           List available Kafka configurations
    status                 Show status of Strimzi resources
    help                   Show this help message

Configurations:
    ephemeral              Single node, no persistence (testing)
    single                 Single node with persistence (development)
    dual-role              3 dual-role nodes (small production)
    separated              3 controllers + 3 brokers (production)

Examples:
    $0 install-operator
    $0 deploy single
    $0 deploy separated
    $0 status

Environment variables:
    NAMESPACE              Kubernetes namespace (default: kafka)

EOF
}

install_operator() {
    print_header "Installing Strimzi Operator"
    cd "${STRIMZI_DIR}/operator"
    ./install.sh
    echo ""
    print_header "Operator installed successfully!"
}

list_configs() {
    print_header "Available Kafka Configurations"
    echo ""
    echo "1. ephemeral - Single node, ephemeral storage"
    echo "   Path: configurations/ephemeral-single-node/"
    echo "   Use case: Quick testing, CI/CD"
    echo ""
    echo "2. single - Single node with persistent storage (20Gi)"
    echo "   Path: configurations/single-node/"
    echo "   Use case: Development"
    echo ""
    echo "3. dual-role - 3 nodes with dual role (300Gi total)"
    echo "   Path: configurations/dual-role-3-nodes/"
    echo "   Use case: Small production, HA"
    echo ""
    echo "4. separated - 3 controllers + 3 brokers (360Gi total)"
    echo "   Path: configurations/3-controllers-3-brokers/"
    echo "   Use case: Production, high performance"
    echo ""
}

deploy_kafka() {
    local config=$1
    local namespace="${NAMESPACE:-kafka}"
    local config_file=""

    case $config in
        ephemeral)
            config_file="${STRIMZI_DIR}/configurations/ephemeral-single-node/kafka-ephemeral-single.yaml"
            ;;
        single)
            config_file="${STRIMZI_DIR}/configurations/single-node/kafka-single-node.yaml"
            ;;
        dual-role)
            config_file="${STRIMZI_DIR}/configurations/dual-role-3-nodes/kafka-dual-role-3.yaml"
            ;;
        separated)
            config_file="${STRIMZI_DIR}/configurations/3-controllers-3-brokers/kafka-3c-3b.yaml"
            ;;
        *)
            print_error "Unknown configuration: $config"
            echo ""
            list_configs
            exit 1
            ;;
    esac

    if [ ! -f "$config_file" ]; then
        print_error "Configuration file not found: $config_file"
        exit 1
    fi

    print_header "Deploying Kafka cluster: $config"
    echo "Configuration: $config_file"
    echo "Namespace: $namespace"
    echo ""

    kubectl apply -f "$config_file" -n "$namespace"

    echo ""
    print_header "Waiting for Kafka cluster to be ready..."
    kubectl wait kafka/my-cluster --for=condition=Ready --timeout=600s -n "$namespace" || {
        print_warning "Timeout waiting for cluster. Check status with: $0 status"
        exit 1
    }

    echo ""
    print_header "Kafka cluster deployed successfully!"
    echo ""
    show_status
}

show_status() {
    local namespace="${NAMESPACE:-kafka}"

    print_header "Strimzi Resources Status"
    echo ""

    echo "Operator:"
    kubectl get pods -n "$namespace" -l name=strimzi-cluster-operator 2>/dev/null || echo "  Operator not found"
    echo ""

    echo "Kafka Clusters:"
    kubectl get kafka -n "$namespace" 2>/dev/null || echo "  No Kafka clusters found"
    echo ""

    echo "Kafka Node Pools:"
    kubectl get kafkanodepool -n "$namespace" 2>/dev/null || echo "  No node pools found"
    echo ""

    echo "Kafka Pods:"
    kubectl get pods -n "$namespace" -l strimzi.io/cluster=my-cluster 2>/dev/null || echo "  No Kafka pods found"
    echo ""

    echo "Storage (PVCs):"
    kubectl get pvc -n "$namespace" -l strimzi.io/cluster 2>/dev/null || echo "  No PVCs found"
}

# Main
case "${1:-help}" in
    install-operator)
        install_operator
        ;;
    deploy)
        if [ -z "$2" ]; then
            print_error "Configuration name required"
            echo ""
            list_configs
            exit 1
        fi
        deploy_kafka "$2"
        ;;
    list-configs)
        list_configs
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac

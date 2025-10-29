#!/bin/bash
set -e

# Strimzi Cleanup Helper Script
# This script helps clean up Strimzi resources

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
    cluster                Delete Kafka cluster (keep PVCs)
    cluster-all            Delete Kafka cluster and PVCs (data lost!)
    operator               Uninstall Strimzi operator (keep PVCs)
    operator-all           Uninstall operator and delete all PVCs (data lost!)
    everything             Remove everything including namespace
    help                   Show this help message

Examples:
    $0 cluster              # Delete cluster but keep data
    $0 cluster-all          # Delete cluster and all data
    $0 operator             # Uninstall operator but keep data
    $0 operator-all         # Uninstall operator and delete all data
    $0 everything           # Remove everything

Environment variables:
    NAMESPACE              Kubernetes namespace (default: kafka)

EOF
}

delete_cluster() {
    local namespace="${NAMESPACE:-kafka}"

    print_header "Deleting Kafka Cluster"
    echo "Namespace: $namespace"
    echo ""

    kubectl delete kafka --all -n "$namespace" --ignore-not-found=true
    kubectl delete kafkanodepool --all -n "$namespace" --ignore-not-found=true
    kubectl delete kafkatopic --all -n "$namespace" --ignore-not-found=true
    kubectl delete kafkauser --all -n "$namespace" --ignore-not-found=true

    echo ""
    print_header "Kafka cluster deleted successfully!"
    print_warning "PVCs were kept. Data is preserved."
    echo "To delete PVCs, run: $0 cluster-all"
}

delete_cluster_all() {
    local namespace="${NAMESPACE:-kafka}"

    print_warning "This will delete the Kafka cluster AND all data (PVCs)!"
    echo "Namespace: $namespace"
    echo ""
    read -p "Are you sure? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Aborted."
        exit 0
    fi

    print_header "Deleting Kafka Cluster and Data"

    kubectl delete kafka --all -n "$namespace" --ignore-not-found=true
    kubectl delete kafkanodepool --all -n "$namespace" --ignore-not-found=true
    kubectl delete kafkatopic --all -n "$namespace" --ignore-not-found=true
    kubectl delete kafkauser --all -n "$namespace" --ignore-not-found=true

    echo "Waiting for resources to be cleaned up..."
    sleep 10

    print_header "Deleting PVCs"
    kubectl delete pvc -l strimzi.io/cluster -n "$namespace" --ignore-not-found=true

    echo ""
    print_header "Kafka cluster and all data deleted!"
}

uninstall_operator() {
    local namespace="${NAMESPACE:-kafka}"

    print_header "Uninstalling Strimzi Operator"
    cd "${STRIMZI_DIR}/operator"
    ./uninstall.sh
}

uninstall_operator_all() {
    local namespace="${NAMESPACE:-kafka}"

    print_warning "This will uninstall the operator AND delete all PVCs!"
    echo "Namespace: $namespace"
    echo ""
    read -p "Are you sure? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Aborted."
        exit 0
    fi

    print_header "Uninstalling Strimzi Operator and Deleting All Data"
    cd "${STRIMZI_DIR}/operator"
    DELETE_PVCS=true ./uninstall.sh
}

delete_everything() {
    local namespace="${NAMESPACE:-kafka}"

    print_error "This will DELETE EVERYTHING including the namespace!"
    print_warning "All Kafka clusters, data, and the operator will be removed!"
    echo "Namespace: $namespace"
    echo ""
    read -p "Are you ABSOLUTELY sure? (type 'delete everything'): " -r
    echo
    if [[ ! $REPLY == "delete everything" ]]; then
        echo "Aborted."
        exit 0
    fi

    print_header "Deleting Everything"

    cd "${STRIMZI_DIR}/operator"
    DELETE_PVCS=true ./uninstall.sh

    echo ""
    print_header "Deleting namespace"
    kubectl delete namespace "$namespace" --ignore-not-found=true

    echo ""
    print_header "Everything deleted!"
}

# Main
case "${1:-help}" in
    cluster)
        delete_cluster
        ;;
    cluster-all)
        delete_cluster_all
        ;;
    operator)
        uninstall_operator
        ;;
    operator-all)
        uninstall_operator_all
        ;;
    everything)
        delete_everything
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

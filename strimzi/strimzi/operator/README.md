# Strimzi Operator Installation

This directory contains scripts for installing and managing the Strimzi Kafka Operator.

## Installation

To install the Strimzi operator in the default `kafka` namespace:

```bash
./install.sh
```

To install in a custom namespace:

```bash
NAMESPACE=my-kafka-namespace ./install.sh
```

To install a specific version:

```bash
STRIMZI_VERSION=0.44.0 NAMESPACE=kafka ./install.sh
```

## Uninstallation

To remove the Strimzi operator and all Kafka resources:

```bash
./uninstall.sh
```

To remove from a custom namespace:

```bash
NAMESPACE=my-kafka-namespace ./uninstall.sh
```

## Verification

After installation, verify the operator is running:

```bash
kubectl get pods -n kafka -l name=strimzi-cluster-operator
```

You should see the Strimzi cluster operator pod in a Running state.

## Next Steps

Once the operator is installed, you can deploy Kafka clusters using the configurations in the `configurations/` directory.

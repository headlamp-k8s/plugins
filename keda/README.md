# Testing the plugin

## Prerequisites

- Node.js and npm installed on your system.
- Docker installed on your system.
- Helm installed on your system.
  - If you need to install Helm, please follow the [official installation guide](https://helm.sh/docs/intro/install/).
- A Kubernetes cluster with KEDA installed.
  - ⚠️ **Note:** If you want to enable support for Prometheus metrics exposed by KEDA, please **refer to the [optional section below](#optionals-to-enable-support-for-prometheus-metrics-exposed-by-keda)** before installing KEDA.
  - If you need to install KEDA directly in your cluster without any additional configurations, please follow the [official installation guide](https://keda.sh/docs/latest/deploy).

## Optionals (to enable support for Prometheus metrics exposed by KEDA)

- Prometheus installed in your Kubernetes cluster.
  - If you need to install Prometheus in your cluster, please follow the [official installation guide](https://artifacthub.io/packages/helm/prometheus-community/kube-prometheus-stack) of `kube-prometheus-stack` Helm Chart on `ArtifactHUB`.
- A Kubernetes cluster with KEDA installed via special flags enabling Prometheus metrics export using the below command:
  - ```bash
     helm install keda kedacore/keda \
     --namespace keda \
     --create-namespace \
     --set prometheus.operator.enabled=true \
     --set prometheus.operator.serviceMonitor.enabled=true \
     --set prometheus.operator.serviceMonitor.interval="10s" \
     --set prometheus.operator.serviceMonitor.additionalLabels.release="prometheus"
    ```

## Steps to Test

1. Clone the plugins repository:

   ```bash
   git clone https://github.com/headlamp-k8s/plugins.git
   ```

2. Switch to the keda branch:

   ```bash
   git checkout keda
   ```

3. Navigate to the keda plugin directory:

   ```bash
   cd keda
   ```

4. Install the required dependencies:

   ```bash
   npm install
   ```

5. Start the plugin in development mode:

   ```bash
   npm run start
   ```

6. Launch Headlamp. You should now see "KEDA" in the sidebar.

## Generate KEDA Resources for Testing

### 1. Build the Message Consumer Image

Before deploying the examples, build the message consumer Docker image using the provided [Dockerfile](test-files/Dockerfile):

```bash
# Navigate to the 'test-files' directory
cd test-files

# Build & Push the image to ttl.sh for temporary hosting
# Images on ttl.sh expire after 24 hours by default
# To specify a different expiration time, add a suffix like ":1h" for 1 hour
IMAGE_NAME=$(uuidgen)
docker build -t ttl.sh/${IMAGE_NAME}:1h .
docker push ttl.sh/${IMAGE_NAME}:1h
```

Take a note of your image name as you'll need to update it in the deployment YAML files.

### 2. Update the YAML files with your image

Update the image reference in these files:

- [consumer-deployment.yaml](test-files/deploy/consumer-deployment.yaml)
- [scaledJob.yaml](test-files/deploy/scaledJob.yaml)
- [publisher-job.yaml](test-files/deploy/publisher-job.yaml)

For example:

Replace

```yaml
image: some-registry/keda-message-consumer:latest
```

with

```yaml
image: ttl.sh/36733c85-1c5e-470b-bb86-f9b93b6d8d82:1h # Replace with your actual image name
```

### 3. Deploy Message Brokers

#### Install RabbitMQ via Helm

Since the Helm stable repository was migrated to the [Bitnami Repository](https://github.com/helm/charts/tree/master/stable/rabbitmq), add the Bitnami repo and use it during the installation:

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
```

##### Helm 3

RabbitMQ Helm Chart version 7.0.0 or later

```bash
helm install rabbitmq --set auth.username=user --set auth.password=PASSWORD bitnami/rabbitmq --wait
```

**Notes:**

- If you are running the RabbitMQ image on KinD, you will run into permission issues unless you set `volumePermissions.enabled=true`. Use the following command if you are using KinD:

  ```bash
  helm install rabbitmq --set auth.username=user --set auth.password=PASSWORD --set volumePermissions.enabled=true bitnami/rabbitmq --wait
  ```

- With RabbitMQ Helm Chart version 6.x.x or earlier, username and password should be specified with rabbitmq.username and rabbitmq.password parameters [https://hub.helm.sh/charts/bitnami/rabbitmq](https://hub.helm.sh/charts/bitnami/rabbitmq)

##### Helm 2

RabbitMQ Helm Chart version 7.0.0 or later

```bash
helm install --name rabbitmq --set auth.username=user --set auth.password=PASSWORD bitnami/rabbitmq --wait
```

#### Install Redis via Helm

Install Redis using the Bitnami Redis Helm chart:

```bash
helm install redis --set auth.password=PASSWORD bitnami/redis --wait
```

**Notes:**

- If you are running the Redis image on KinD, you may need to set `volumePermissions.enabled=true`:

  ```bash
  helm install redis --set auth.password=PASSWORD --set volumePermissions.enabled=true bitnami/redis --wait
  ```

#### Wait for Services to Deploy

⚠️ Be sure to wait until both deployments have completed before continuing. ⚠️

```bash
kubectl get pods

NAME         READY   STATUS    RESTARTS   AGE
rabbitmq-0   1/1     Running   0          3m3s
redis-master-0   1/1     Running   0          2m45s
redis-replica-0   1/1     Running   0          2m45s
redis-replica-1   1/1     Running   0          2m30s
```

### 4. Deploy Authentication Resources

Deploy the authentication resources for both RabbitMQ and Redis:

```bash
kubectl apply -f authentication.yaml
```

This creates:

- A Secret with connection strings for both RabbitMQ and Redis
- TriggerAuthentication resources for both message brokers

The authentication resources provide the necessary credentials for KEDA to connect to both RabbitMQ and Redis and monitor their respective queues/lists.

### 5. Testing [KEDA ScaledObject](https://keda.sh/docs/latest/reference/scaledobject-spec/)

#### Deploy a Message Consumer

```bash
kubectl apply -f consumer-deployment.yaml
```

#### Validate the consumer has been deployed

```bash
kubectl get deployments
```

You should see `message-consumer` deployment with 1 running pod but after deploying the [ScaledObject](test-files/deploy/scaledObject.yaml), it will display 0 running pods as we haven't yet published any messages to RabbitMQ or Redis and hence KEDA will scale down the pods to 0 since we have not mentioned any `minReplicaCount` in the spec.

```bash
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
message-consumer   1/1     1            1           2m32s
```

This consumer is designed to process messages from both RabbitMQ queues and Redis lists. It consumes one message per instance, sleeps for 1 second to simulate work, and then acknowledges completion of the message.

#### Deploy ScaledObject

```bash
kubectl apply -f scaledObject.yaml
```

This ScaledObject configures autoscaling for the `message-consumer` deployment with **dual triggers**:

- **RabbitMQ Trigger**: Monitors the `hello` queue, scaling based on a target of 5 messages per replica
- **Redis Trigger**: Monitors the `tasks` list, scaling based on a target of 5 messages per replica

The ScaledObject is configured to:

- Scale to a minimum of 0 replicas when there are no messages in either queue/list
- Scale up to a maximum of 30 replicas when either queue/list is heavily loaded
- Use a polling interval of 5 seconds (faster than the default 30 seconds)
- Apply a cooldown period of 30 seconds before scaling down

These settings can be adjusted in the [YAML Specification](test-files/deploy/scaledObject.yaml) as needed.

#### Trigger the Publisher Job to Generate Messages

Now that all components are set up, trigger the [publisher job](test-files/deploy/publisher-job.yaml) to send messages to both RabbitMQ and Redis:

```bash
kubectl apply -f publisher-job.yaml
```

This job will publish:

- 300 messages to the RabbitMQ `hello` queue
- 500 messages to the Redis `tasks` list

This will trigger scaling of the consumer deployment via the ScaledObject's dual triggers.

#### Observe Autoscaling in Action

Monitor the scaling activities:

```bash
# Watch the deployments scale up
kubectl get deployments -w

# Check the pods being created
kubectl get pods

# View KEDA ScaledObject status
kubectl get scaledobject

# Check the specific ScaledObject details
kubectl describe scaledobject message-consumer-scaledobject
```

You should see the number of replicas for the `message-consumer` deployment increase as messages are added to either the RabbitMQ queue or Redis list, and decrease as messages are processed from both sources.

#### Monitor Message Processing

You can monitor the message processing by checking the logs:

```bash
# View consumer logs
kubectl logs -l app=message-consumer -f

# Check RabbitMQ queue status
kubectl exec rabbitmq-0 -- rabbitmqctl list_queues

# Check Redis list length
kubectl exec redis-master-0 -- redis-cli -a PASSWORD llen tasks
```

#### Clean Up Resources

When you're done testing, you can clean up the deployed resources:

```bash
kubectl delete -f publisher-job.yaml
kubectl delete -f scaledObject.yaml
kubectl delete -f consumer-deployment.yaml
```

### 6. Testing [KEDA ScaledJob](https://keda.sh/docs/latest/reference/scaledjob-spec/)

#### Deploy ScaledJob

```bash
kubectl apply -f scaledJob.yaml
```

This ScaledJob creates Kubernetes Jobs to process messages from both RabbitMQ and Redis in batch mode. It features **dual triggers** similar to the ScaledObject:

- **RabbitMQ Trigger**: Monitors the `hello` queue with a target of 20 messages per job
- **Redis Trigger**: Monitors the `tasks` list with a target of 20 messages per job

The ScaledJob is configured to:

- Scale to a minimum of 0 jobs when there are no messages in either queue/list
- Scale up to a maximum of 10 jobs when either queue/list is heavily loaded
- Process 20 messages per job with a 2-minute timeout
- Scale from 0 when there are 5+ messages in either queue/list (activation threshold)
- Use a polling interval of 10 seconds

Unlike the ScaledObject which scales a Deployment, ScaledJob creates separate Job instances that process a batch of messages and then terminate. Each job runs in batch mode with the `-batch` flag, consuming up to 20 messages before completing.

#### Trigger the Publisher Job to Generate Messages

Now that all components are set up, trigger the [publisher job](test-files/deploy/publisher-job.yaml) to send messages to both message brokers:

```bash
kubectl apply -f publisher-job.yaml
```

This job will publish:

- 300 messages to the RabbitMQ `hello` queue
- 500 messages to the Redis `tasks` list

This will trigger the creation of batch processing jobs via the ScaledJob's dual triggers.

#### Observe Autoscaling in Action

Monitor the scaling activities:

```bash
# View the jobs being created
kubectl get jobs

# Check the pods being created
kubectl get pods

# View KEDA ScaledJob status
kubectl get scaledjob

# Check the specific ScaledJob details
kubectl describe scaledjob message-consumer-scaledjob
```

You will see jobs created to process batches of messages from both RabbitMQ and Redis based on the ScaledJob configuration.

#### Monitor Batch Processing

Monitor the batch processing:

```bash
# View job logs to see batch processing
kubectl logs -l job-name=message-consumer-scaledjob-xxxxx -f

# Check message broker status
kubectl exec rabbitmq-0 -- rabbitmqctl list_queues
kubectl exec redis-master-0 -- redis-cli -a PASSWORD llen tasks
```

#### Clean Up

When you're done testing, you can clean up the deployed resources:

```bash
kubectl delete -f publisher-job.yaml
kubectl delete -f scaledJob.yaml
```

### 7. Clean Up All The Resources You Deployed

When you're done testing, you can clean up all the deployed resources:

```bash
# Clean up KEDA resources
kubectl delete -f publisher-job.yaml # ignore if you've already done this
kubectl delete -f scaledJob.yaml # ignore if you've already done this
kubectl delete -f scaledObject.yaml # ignore if you've already done this
kubectl delete -f consumer-deployment.yaml # ignore if you've already done this
kubectl delete -f authentication.yaml

# Uninstall message brokers
helm uninstall rabbitmq
helm uninstall redis
```

## Architecture Overview

This testing setup demonstrates KEDA's ability to handle **multiple message brokers simultaneously**:

### Message Flow

1. **Publisher Job** sends messages to both RabbitMQ (queue) and Redis (list)
2. **KEDA Scalers** monitor both message brokers independently
3. **Consumer Applications** process messages from both sources
4. **Scaling decisions** are made based on the combined load from both brokers

### Scaling Behavior

- **ScaledObject**: Maintains long-running pods that continuously process messages
- **ScaledJob**: Creates short-lived jobs that process batches of messages and terminate
- **Dual Triggers**: Both configurations monitor RabbitMQ and Redis simultaneously
- **Independent Scaling**: Each trigger can independently cause scaling events

This setup showcases KEDA's flexibility in handling complex, multi-broker scenarios commonly found in production environments.

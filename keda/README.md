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

### 1. Build the RabbitMQ Client Image

Before deploying the examples, build the RabbitMQ client Docker image using the provided [Dockerfile](test-files/Dockerfile):

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

- [test-files/deploy/consumer-deployment.yaml](test-files/deploy/consumer-deployment.yaml)
- [test-files/deploy/scaledJob.yaml](test-files/deploy/scaledJob.yaml)
- [test-files/deploy/publisher-job.yaml](test-files/deploy/publisher-job.yaml)

For example:

Replace

```yaml
image: some-registry/rabbitmq-client:latest
```

with

```yaml
image: ttl.sh/36733c85-1c5e-470b-bb86-f9b93b6d8d82:1h # Replace with your actual image name
```

### 3. Create a RabbitMQ Queue

#### Install RabbitMQ via Helm

Since the Helm stable repository was migrated to the [Bitnami Repository](https://github.com/helm/charts/tree/master/stable/rabbitmq), add the Bitnami repo and use it during the installation:

```cli
helm repo add bitnami https://charts.bitnami.com/bitnami
```

##### Helm 3

RabbitMQ Helm Chart version 7.0.0 or later

```cli
helm install rabbitmq --set auth.username=user --set auth.password=PASSWORD bitnami/rabbitmq --wait
```

**Notes:**

- If you are running the rabbitMQ image on KinD, you will run into permission issues unless you set `volumePermissions.enabled=true`. Use the following command if you are using KinD:

  ```cli
  helm install rabbitmq --set auth.username=user --set auth.password=PASSWORD --set volumePermissions.enabled=true bitnami/rabbitmq --wait
  ```

- With RabbitMQ Helm Chart version 6.x.x or earlier, username and password should be specified with rabbitmq.username and rabbitmq.password parameters [https://hub.helm.sh/charts/bitnami/rabbitmq](https://hub.helm.sh/charts/bitnami/rabbitmq)

##### Helm 2

RabbitMQ Helm Chart version 7.0.0 or later

```cli
helm install --name rabbitmq --set auth.username=user --set auth.password=PASSWORD bitnami/rabbitmq --wait
```

#### Wait for RabbitMQ to Deploy

⚠️ Be sure to wait until the deployment has completed before continuing. ⚠️

```cli
kubectl get pods

NAME         READY   STATUS    RESTARTS   AGE
rabbitmq-0   1/1     Running   0          3m3s
```

### 4. Deploy a [KEDA TriggerAuthentication](https://keda.sh/docs/latest/concepts/authentication/) for RabbitMQ

```cli
kubectl apply -f test-files/deploy/triggerAuthentication.yaml
```

[This TriggerAuthentication](test-files/deploy/triggerAuthentication.yaml) resource provides the necessary credentials for KEDA to connect to RabbitMQ and monitor the queue.

### 5. Testing [KEDA ScaledObject](https://keda.sh/docs/latest/reference/scaledobject-spec/)

#### Deploy a RabbitMQ Consumer

```cli
kubectl apply -f test-files/deploy/consumer-deployment.yaml
```

#### Validate the consumer has been deployed

```cli
kubectl get deployments
```

You should see `rabbitmq-consumer` deployment with 1 running pod but after deploying the [ScaledObject](test-files/deploy/scaledObject.yaml), it will display 0 running pods as we haven't yet published any messages to RabbitMQ and hence KEDA will scale down the pods to 0 since we have not mentioned any `minReplicaCount` in the spec.

```cli
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
rabbitmq-consumer   1/1     1            1           2m32s
```

[This consumer](test-files/receive/receive.go) is set to consume one message per instance, sleep for 1 second, and then acknowledge completion of the message. This is used to simulate work.

#### Deploy ScaledObject

```cli
kubectl apply -f test-files/deploy/scaledObject.yaml
```

This ScaledObject configures autoscaling for the `rabbitmq-consumer` deployment. It is set to scale to a minimum of 0 replicas when there are no messages in the queue, and up to a maximum of 30 replicas when the queue is heavily loaded. The scaling is optimized for maintaining a queue length of 5 messages per replica. After 30 seconds of no events, the replicas will be scaled down (cooldown period). These settings can be adjusted in the [YAML Specification](test-files/deploy/scaledObject.yaml) as needed.

#### Trigger the Publisher Job to Generate Messages

Now that all components are set up, trigger the [publisher job](test-files/deploy/publisher-job.yaml) to send messages to the RabbitMQ queue:

```cli
kubectl apply -f test-files/deploy/publisher-job.yaml
```

This job will publish 300 messages to the RabbitMQ queue, which will trigger scaling of the consumer deployment (via ScaledObject).

#### Observe Autoscaling in Action

Monitor the scaling activities:

```bash
# Watch the deployments scale up
kubectl get deployments -w

# Check the pods being created
kubectl get pods

# View KEDA ScaledObject status
kubectl get scaledobject
```

You should see the number of replicas for the `rabbitmq-consumer` deployment increase as messages are added to the queue, and decrease as messages are processed.

#### Clean Up Resources

When you're done testing, you can clean up the deployed resources:

```bash
kubectl delete -f test-files/deploy/publisher-job.yaml
kubectl delete -f test-files/deploy/scaledObject.yaml
kubectl delete -f test-files/deploy/consumer-deployment.yaml
```

### 6. Testing [KEDA ScaledJob](https://keda.sh/docs/latest/reference/scaledjob-spec/)

#### Deploy ScaledJob

```cli
kubectl apply -f test-files/deploy/scaledJob.yaml
```

This ScaledJob creates Kubernetes Jobs to process messages in the RabbitMQ queue in batch mode. It is set to scale to a minimum of 0 jobs when there are no messages in the queue, and up to a maximum of 30 jobs when the queue is heavily loaded. Unlike the ScaledObject which scales a Deployment, ScaledJob creates separate Job instances that process a batch of messages and then terminate. This ScaledJob is configured to process 10 messages per job with a 30-second timeout. These settings can be adjusted in the [YAML Specification](test-files/deploy/scaledJob.yaml) as needed.

#### Trigger the Publisher Job to Generate Messages

Now that all components are set up, trigger the [publisher job](test-files/deploy/publisher-job.yaml) to send messages to the RabbitMQ queue:

```cli
kubectl apply -f test-files/deploy/publisher-job.yaml
```

This job will publish 300 messages to the RabbitMQ queue, which will trigger the creation of batch processing jobs (via ScaledJob).

#### Observe Autoscaling in Action

Monitor the scaling activities:

```bash
# View the jobs being created
kubectl get jobs

# Check the pods being created
kubectl get pods

# View KEDA ScaledJob status
kubectl get scaledjob
```

You will see jobs created to process batches of messages based on the ScaledJob configuration.

#### Clean Up

When you're done testing, you can clean up the deployed resources:

```bash
kubectl delete -f test-files/deploy/publisher-job.yaml
kubectl delete -f test-files/deploy/scaledJob.yaml
```

### 7. Clean Up All The Resources You Deployed

When you're done testing, you can clean up all the deployed resources via:

```bash
kubectl delete -f test-files/deploy/publisher-job.yaml # ignore if you've already done this
kubectl delete -f test-files/deploy/scaledJob.yaml # ignore if you've already done this
kubectl delete -f test-files/deploy/scaledObject.yaml # ignore if you've already done this
kubectl delete -f test-files/deploy/consumer-deployment.yaml # ignore if you've already done this
kubectl delete -f test-files/deploy/triggerAuthentication.yaml
helm uninstall rabbitmq
```

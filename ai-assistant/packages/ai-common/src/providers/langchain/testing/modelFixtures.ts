/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Built-in fixture data embedded as TypeScript constants so they work in
 * both Node.js and browser environments without JSON import assertions.
 *
 * The canonical JSON files in `./fixtures/` are the source of truth —
 * update them and regenerate this file if fixtures change.
 */

import type { FixtureEntry, FixtureSequence } from './FixtureChatModel';

/** Built-in prompt and response fixtures used by the mock testing model. */
export const GENERAL_FIXTURES: FixtureEntry[] = [
  {
    prompt: 'Hello',
    response:
      "Hello! I'm the Headlamp AI assistant. I can help you explore and manage your Kubernetes cluster. What would you like to know?",
  },
  {
    prompt: 'What is a <<resource>>?',
    response:
      'A **<<resource>>** is a Kubernetes resource managed by the API server. You can view <<resource>> resources in Headlamp by navigating to the appropriate section in the sidebar.',
  },
  {
    prompt: 'How do I create a <<resource>>?',
    response:
      'To create a <<resource>>, you can use `kubectl create` or `kubectl apply` with a YAML manifest, or click the **Create** button in Headlamp and paste your YAML definition.',
  },
  {
    prompt: 'List all <<resource>> in <<namespace>>',
    response:
      'To list all <<resource>> in the **<<namespace>>** namespace, run:\n\n```bash\nkubectl get <<resource>> -n <<namespace>>\n```\n\nOr navigate to the <<resource>> section in Headlamp and filter by namespace.',
  },
  {
    prompt: 'Delete <<resource>> <<name>>',
    response:
      'To delete the <<resource>> **<<name>>**, run:\n\n```bash\nkubectl delete <<resource>> <<name>>\n```\n\n⚠️ This action is irreversible. Make sure you have a backup if needed.',
  },
  {
    prompt: 'What namespaces are available?',
    response:
      "Your cluster's namespaces can be viewed in Headlamp under **Cluster** > **Namespaces**. Common namespaces include `default`, `kube-system`, and `kube-public`.",
  },
  {
    prompt: 'Show me the logs for <<name>>',
    response:
      'To view logs for **<<name>>**, run:\n\n```bash\nkubectl logs <<name>>\n```\n\nIn Headlamp, navigate to the pod detail page and click the **Logs** tab.',
  },
  {
    prompt: 'How do I scale <<name>> to <<count>> replicas?',
    response:
      'To scale **<<name>>** to <<count>> replicas:\n\n```bash\nkubectl scale deployment/<<name>> --replicas=<<count>>\n```\n\nOr edit the deployment in Headlamp and change the `replicas` field.',
  },
  {
    prompt: 'What is the status of <<name>>?',
    response:
      'To check the status of **<<name>>**, run:\n\n```bash\nkubectl describe <<name>>\n```\n\nIn Headlamp, click on the resource name to see its details, events, and conditions.',
  },
  {
    prompt: 'Explain <<concept>>',
    response:
      '**<<concept>>** is a Kubernetes concept. You can learn more about it in the official Kubernetes documentation at https://kubernetes.io/docs/.',
  },
];

/**
 * Fixtures for proactive diagnosis prompts.
 *
 * The ProactiveDiagnosisManager sends structured prompts containing event details.
 * These fixtures use substring matching to detect key phrases like "Reason: BackOff"
 * and return realistic diagnosis responses so the mock model works end-to-end
 * with proactive diagnosis in the UI.
 */
export const DIAGNOSIS_FIXTURES: FixtureEntry[] = [
  {
    prompt: '- **Reason:** BackOff',
    response: `## Diagnosis: CrashLoopBackOff

### What happened
The container is repeatedly crashing and Kubernetes is backing off on restart attempts. Each restart increases the backoff delay (10s, 20s, 40s, up to 5 minutes).

### Root cause analysis
Common causes include:
- **Application error** — the container process exits with a non-zero code immediately after starting
- **Missing configuration** — required environment variables, ConfigMaps, or Secrets are not available
- **Resource limits** — the container is OOM-killed because memory limits are too low

### Impact
The pod is not serving traffic. If this is part of a Deployment, the unavailable replica reduces capacity.

### Remediation steps
1. Check the container logs — navigate to the pod in Headlamp and open the **Logs** tab (use the "Previous" toggle for crashed containers)
2. Verify all required ConfigMaps and Secrets exist
3. Check resource limits — increase memory if OOM-killed
4. Fix the application error and redeploy

### Prevention
- Add proper health checks (liveness and readiness probes)
- Set appropriate resource requests and limits
- Use init containers to verify dependencies before the main container starts

SUGGESTIONS: Show pod logs | Check pod events | Describe the pod`,
  },
  {
    prompt: '- **Reason:** FailedScheduling',
    response: `## Diagnosis: FailedScheduling

### What happened
The Kubernetes scheduler cannot find a node that satisfies the pod's requirements. The pod remains in **Pending** state.

### Root cause analysis
The most common causes are:
- **Insufficient resources** — no node has enough CPU or memory to accommodate the pod's requests
- **Node affinity/taints** — the pod has node affinity rules or the available nodes have taints that the pod doesn't tolerate
- **PersistentVolume constraints** — the pod requires a PV in a specific availability zone where no nodes exist

### Impact
The workload is not running. Dependent services may experience degraded performance or outages.

### Remediation steps
1. Check available node resources — navigate to **Cluster** > **Nodes** in Headlamp and review the resource allocation on each node
2. Review pod resource requests — consider lowering them if over-provisioned
3. Add more nodes to the cluster or enable cluster autoscaler
4. Check for taints and tolerations mismatches

### Prevention
- Use resource quotas to prevent over-commitment
- Configure cluster autoscaler for automatic node provisioning
- Set realistic resource requests based on actual usage

SUGGESTIONS: Show node resources | List pending pods | Check cluster autoscaler`,
  },
  {
    prompt: '- **Reason:** ImagePullBackOff',
    response: `## Diagnosis: ImagePullBackOff

### What happened
Kubernetes cannot pull the container image. The kubelet retries with exponential backoff.

### Root cause analysis
- **Image not found** — the image tag doesn't exist in the registry
- **Authentication failure** — the registry requires credentials that are not configured as an \`imagePullSecret\`
- **Network issues** — the node cannot reach the container registry

### Impact
The pod cannot start. All replicas using this image are affected.

### Remediation steps
1. Verify the image exists in the registry and the tag is correct
2. Check if an \`imagePullSecret\` is configured on the pod or service account — view this in the pod's YAML under **Workloads** > **Pods** in Headlamp
3. Verify network connectivity from the node to the registry
4. Check for typos in the image name or tag

### Prevention
- Pin images to specific digests or immutable tags (avoid \`latest\`)
- Pre-pull images on nodes using a DaemonSet
- Use a local registry mirror for air-gapped environments

SUGGESTIONS: Check image pull secrets | Describe the pod | List registry credentials`,
  },
  {
    prompt: '- **Reason:** OOMKilled',
    response: `## Diagnosis: OOMKilled

### What happened
The container was terminated because it exceeded its memory limit. The Linux OOM killer selected it for termination.

### Root cause analysis
- **Memory limit too low** — the application requires more memory than the configured limit
- **Memory leak** — the application has a memory leak causing unbounded growth
- **Spike in load** — a traffic spike caused temporary memory consumption beyond the limit

### Impact
The container restarts, causing brief downtime. If this happens repeatedly, it triggers CrashLoopBackOff.

### Remediation steps
1. Check the current memory limit and actual usage — view resource metrics on the pod detail page in Headlamp
2. Increase the memory limit if the application legitimately needs more
3. Profile the application for memory leaks
4. Consider using a Vertical Pod Autoscaler (VPA) to right-size limits

### Prevention
- Set memory requests equal to limits to guarantee memory allocation
- Monitor memory usage trends with Prometheus/Grafana
- Load-test the application to determine realistic memory requirements

SUGGESTIONS: Show pod metrics | Check resource limits | Enable VPA`,
  },
  {
    prompt: 'A Kubernetes <<eventType>> event has been detected',
    response: `## Diagnosis

### What happened
A Kubernetes <<eventType>> event was detected on a cluster resource. This indicates an issue that requires attention.

### Root cause analysis
The event details suggest a configuration or runtime issue with the affected resource. Common patterns include:
- Resource misconfiguration (incorrect specs, missing dependencies)
- Infrastructure issues (node pressure, network problems)
- Application errors (crash loops, health check failures)

### Impact
Depending on the severity, this may cause service degradation or outage for the affected workload.

### Remediation steps
1. Inspect the affected resource for detailed status and conditions
2. Check related events for additional context
3. Review recent changes that may have triggered the issue
4. Apply the appropriate fix based on the specific error reason

### Prevention
- Implement proper monitoring and alerting for Warning events
- Use admission webhooks to validate configurations before deployment
- Maintain runbooks for common failure scenarios

SUGGESTIONS: Show related events | Describe the resource | Check recent deployments`,
  },
];

/** Built-in scripted conversation for the cluster exploration demo. */
export const DEMO_CLUSTER_EXPLORATION: FixtureSequence = {
  name: 'cluster-exploration-demo',
  description:
    'A scripted demo conversation exploring a Kubernetes cluster — suitable for walkthroughs and presentations. Each turn plays back in order regardless of what the user types.',
  sequence: [
    {
      prompt: 'Hello',
      response:
        "Hello! I'm the Headlamp AI assistant. I can help you explore and manage your Kubernetes cluster. What would you like to know?",
    },
    {
      prompt: 'What nodes are in the cluster?',
      response:
        'Your cluster has the following nodes:\n\n| Name | Status | Roles | Version |\n|------|--------|-------|---------|\n| node-0 | Ready | control-plane | v1.32.0 |\n| node-1 | Ready | worker | v1.32.0 |\n| node-2 | Ready | worker | v1.32.0 |\n\nAll nodes are healthy and running Kubernetes v1.32.0. You can view detailed node information in Headlamp under **Cluster** > **Nodes**.',
    },
    {
      prompt: 'What pods are running in the default namespace?',
      response:
        'Here are the pods in the **default** namespace:\n\n| Name | Status | Restarts | Age |\n|------|--------|----------|-----|\n| nginx-deployment-abc123 | Running | 0 | 2h |\n| nginx-deployment-def456 | Running | 0 | 2h |\n| nginx-deployment-ghi789 | Running | 0 | 2h |\n\nAll 3 pods are healthy with zero restarts. They belong to the `nginx-deployment` Deployment.',
    },
    {
      prompt: 'Can you show me the nginx deployment details?',
      response:
        'Here are the details for the **nginx-deployment**:\n\n```yaml\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: nginx-deployment\n  namespace: default\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: nginx\n  template:\n    spec:\n      containers:\n      - name: nginx\n        image: nginx:1.25\n        ports:\n        - containerPort: 80\n        resources:\n          requests:\n            cpu: 100m\n            memory: 128Mi\n```\n\nThe deployment is running **3/3 replicas** with the `nginx:1.25` image. You can view this in Headlamp by navigating to **Workloads** > **Deployments** > **nginx-deployment**.',
    },
    {
      prompt: 'How do I scale it to 5 replicas?',
      response:
        'To scale **nginx-deployment** to 5 replicas:\n\n```bash\nkubectl scale deployment/nginx-deployment --replicas=5\n```\n\nOr you can do it directly in Headlamp:\n1. Go to **Workloads** > **Deployments** > **nginx-deployment**\n2. Click the **Edit** button\n3. Change `replicas` from 3 to 5\n4. Save the changes\n\nThe Deployment controller will create 2 additional Pods to reach the desired count.',
    },
    {
      prompt: 'What services are available?',
      response:
        'Here are the services in the **default** namespace:\n\n| Name | Type | Cluster IP | Ports |\n|------|------|-----------|-------|\n| kubernetes | ClusterIP | 10.96.0.1 | 443/TCP |\n| nginx-service | ClusterIP | 10.96.45.12 | 80/TCP |\n\nThe `nginx-service` routes traffic to the nginx deployment pods on port 80. You can view services in Headlamp under **Network** > **Services**.',
    },
  ],
};

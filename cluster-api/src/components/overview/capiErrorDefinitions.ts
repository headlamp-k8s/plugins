export interface CapiErrorDefinition {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  matcher: {
    kinds?: string[];
    conditionType?: string;
    reasonPattern?: string | RegExp;
    messagePattern?: string | RegExp;
    providerKinds?: string[];
    excludeProviderKinds?: string[];
    customMatcher?: (resource: any, condition?: any) => boolean;
  };
  solution: {
    steps: string[];
    codeSnippet?: {
      language: string;
      code: string;
      description?: string;
    };
    documentationLinks?: {
      title: string;
      url: string;
    }[];
    quickFixCommands?: {
      description: string;
      command: string;
    }[];
  };
}

// All RegExp literals in CAPI_ERROR_DEFINITIONS already carry the /i flag.
// String patterns (if ever added) are coerced to /pattern/i.
function asRegExp(pattern: string | RegExp): RegExp {
  return typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
}

const CORE_CAPI_KINDS = new Set([
  'Cluster',
  'Machine',
  'MachineDeployment',
  'MachineSet',
  'MachinePool',
  'KubeadmControlPlane',
  'KubeadmConfig',
  'KubeadmConfigTemplate',
  'KubeadmControlPlaneTemplate',
]);

type TranslateFunction = (key: string) => string;

const identityTranslate: TranslateFunction = key => key;

export const createCapiErrorDefinitions = (
  t: TranslateFunction = identityTranslate
): CapiErrorDefinition[] => [
  {
    id: 'cni-not-deployed',
    title: t('CNI Not Deployed'),
    description: t(
      'The Container Network Interface (CNI) plugin has not been installed on the cluster. Without a CNI, pods cannot communicate with each other and the cluster will not become ready.'
    ),
    severity: 'critical',
    matcher: {
      kinds: ['Cluster'],
      conditionType: 'ControlPlaneInitialized',
      messagePattern: /CNI|network plugin|calico|cilium|flannel/i,
    },
    solution: {
      steps: [
        t('Choose a CNI plugin (Calico, Cilium, Flannel, Weave, etc.)'),
        t('Get the kubeconfig for your cluster'),
        t('Apply the CNI manifest to your cluster'),
        t('Wait for the CNI pods to become ready'),
        t('Verify nodes transition to Ready state'),
      ],
      codeSnippet: {
        language: 'bash',
        code: `# Get cluster kubeconfig
clusterctl get kubeconfig <cluster-name> > cluster.kubeconfig

# Install Calico (example)
kubectl --kubeconfig=cluster.kubeconfig apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.26.1/manifests/calico.yaml

# Or install Cilium
cilium install --context <cluster-context>

# Verify CNI is running
kubectl --kubeconfig=cluster.kubeconfig get pods -n kube-system`,
        description: t('Install a CNI plugin on your workload cluster'),
      },
      documentationLinks: [
        {
          title: t('Cluster API Quick Start - Install CNI'),
          url: 'https://cluster-api.sigs.k8s.io/user/quick-start.html#deploy-a-cni-solution',
        },
        {
          title: t('Calico Installation Guide'),
          url: 'https://docs.tigera.io/calico/latest/getting-started/kubernetes/quickstart',
        },
        {
          title: t('Cilium Installation Guide'),
          url: 'https://docs.cilium.io/en/stable/gettingstarted/k8s-install-default/',
        },
      ],
    },
  },
  {
    id: 'capd-cluster-not-ready',
    title: t('Docker Cluster Not Ready'),
    description: t(
      'The CAPD workload cluster is not yet reachable or not fully reconciled. This usually means the Docker-backed control plane or worker nodes are still being created, starting, or failing readiness checks.'
    ),
    severity: 'warning',
    matcher: {
      kinds: ['Cluster'],
      providerKinds: ['DockerCluster'],
      conditionType: 'Available',
      reasonPattern: /NotReady|ScalingUp|Waiting|Provisioning|Creating/i,
    },
    solution: {
      steps: [
        t('Check whether the Docker-backed control plane containers are running'),
        t(
          'Inspect the Cluster and KubeadmControlPlane resources for recent events and status changes'
        ),
        t('Verify the workload cluster API server becomes reachable'),
        t('Check CAPD controller logs if reconciliation appears stuck'),
        t('Wait for machine provisioning to complete if the cluster is still scaling up'),
      ],
      quickFixCommands: [
        {
          description: t('Inspect cluster status'),
          command: 'kubectl describe cluster <cluster-name> -n <namespace>',
        },
        {
          description: t('Inspect control plane status'),
          command: 'kubectl describe kubeadmcontrolplane <kcp-name> -n <namespace>',
        },
        {
          description: t('List Docker containers'),
          command: 'docker ps --format "table {{.Names}}\t{{.Status}}"',
        },
      ],
      documentationLinks: [
        {
          title: t('Cluster API Troubleshooting'),
          url: 'https://cluster-api.sigs.k8s.io/user/troubleshooting.html',
        },
        {
          title: t('CAPD Book'),
          url: 'https://cluster-api.sigs.k8s.io/tasks/experimental-features/cluster-class/write-clusterclass#capd',
        },
      ],
    },
  },
  {
    id: 'capd-remote-connection-probe-failed',
    title: t('Docker Cluster Remote Probe Failed'),
    description: t(
      'The management cluster cannot successfully probe the workload cluster endpoint. In CAPD environments, this often means the API server is not reachable yet, the containers are still starting, or networking between containers is unhealthy.'
    ),
    severity: 'warning',
    matcher: {
      kinds: ['Cluster'],
      providerKinds: ['DockerCluster'],
      conditionType: 'RemoteConnectionProbe',
      reasonPattern: /NotReady|Failed|Error|Timeout/i,
    },
    solution: {
      steps: [
        t('Confirm the workload cluster control plane containers are running'),
        t('Check whether the API server endpoint is exposed and reachable'),
        t('Inspect cluster events for probe or connectivity failures'),
        t('Review CAPD controller logs for Docker networking or container startup errors'),
        t('Retry after a short wait if the cluster is still initializing'),
      ],
      quickFixCommands: [
        {
          description: t('Check cluster events'),
          command: 'kubectl get events -n <namespace> --sort-by=.lastTimestamp',
        },
        {
          description: t('Inspect CAPD controller logs'),
          command: 'kubectl logs -n capd-system deployment/capd-controller-manager -f',
        },
        {
          description: t('List Docker containers'),
          command: 'docker ps --format "table {{.Names}}\t{{.Status}}"',
        },
      ],
      documentationLinks: [
        {
          title: t('Cluster API Troubleshooting'),
          url: 'https://cluster-api.sigs.k8s.io/user/troubleshooting.html',
        },
      ],
    },
  },
  {
    id: 'control-plane-cert-expiry',
    title: t('Control Plane Certificate Expiring'),
    description: t(
      'The Kubernetes control plane certificates are approaching expiration. This can cause cluster instability and authentication failures.'
    ),
    severity: 'critical',
    matcher: {
      kinds: ['KubeadmControlPlane'],
      conditionType: 'CertificatesAvailable',
      reasonPattern: /expir|renew/i,
    },
    solution: {
      steps: [
        t('SSH into each control plane node'),
        t('Check certificate expiration dates'),
        t('Renew certificates using kubeadm'),
        t('Restart control plane components'),
        t('Verify certificate renewal'),
      ],
      codeSnippet: {
        language: 'bash',
        code: `# Check certificate expiration
kubeadm certs check-expiration

# Renew all certificates
kubeadm certs renew all

# Restart control plane pods
kubectl -n kube-system delete pod -l component=kube-apiserver
kubectl -n kube-system delete pod -l component=kube-controller-manager
kubectl -n kube-system delete pod -l component=kube-scheduler`,
        description: t('Renew Kubernetes control plane certificates'),
      },
      documentationLinks: [
        {
          title: t('Kubeadm Certificate Management'),
          url: 'https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/',
        },
      ],
    },
  },
  {
    id: 'infrastructure-provisioning-failed',
    title: t('Infrastructure Provisioning Failed'),
    description: t(
      'The infrastructure provider failed to provision the required cloud resources (VMs, load balancers, networks, etc.). This is often due to quota limits, invalid credentials, or missing permissions.'
    ),
    severity: 'critical',
    matcher: {
      kinds: ['Machine', 'MachineDeployment', 'MachineSet'],
      conditionType: 'InfrastructureReady',
      reasonPattern: /fail|error|timeout/i,
    },
    solution: {
      steps: [
        t('Check the infrastructure provider logs for detailed error messages'),
        t('Verify cloud provider credentials are valid and not expired'),
        t('Check cloud provider quota limits (CPU, memory, IPs, etc.)'),
        t('Ensure required IAM permissions are granted'),
        t('Verify network connectivity and firewall rules'),
        t('Check if the specified instance type/size is available in the region'),
      ],
      quickFixCommands: [
        {
          description: t('Check machine status and events'),
          command: 'kubectl describe machine <machine-name> -n <namespace>',
        },
        {
          description: t('View infrastructure provider logs'),
          command: 'kubectl logs -n <provider-system> deployment/<provider-controller-manager> -f',
        },
      ],
      documentationLinks: [
        {
          title: t('Troubleshooting Machine Creation'),
          url: 'https://cluster-api.sigs.k8s.io/user/troubleshooting.html',
        },
      ],
    },
  },
  {
    id: 'bootstrap-data-not-ready',
    title: t('Bootstrap Data Not Ready'),
    description: t(
      'The bootstrap configuration (cloud-init, user-data) could not be generated or is incomplete. This prevents machines from joining the cluster.'
    ),
    severity: 'critical',
    matcher: {
      kinds: ['Machine'],
      conditionType: 'BootstrapReady',
      reasonPattern: /fail|error|waiting/i,
    },
    solution: {
      steps: [
        t('Check the bootstrap provider controller logs'),
        t('Verify the KubeadmConfig or bootstrap template is valid'),
        t('Ensure all required secrets exist (cloud credentials, etc.)'),
        t('Check if the control plane is initialized (for worker nodes)'),
        t('Verify network connectivity to the bootstrap provider'),
      ],
      quickFixCommands: [
        {
          description: t('Check bootstrap config status'),
          command: 'kubectl get kubeadmconfig <config-name> -n <namespace> -o yaml',
        },
        {
          description: t('View bootstrap provider logs'),
          command:
            'kubectl logs -n capi-kubeadm-bootstrap-system deployment/capi-kubeadm-bootstrap-controller-manager -f',
        },
      ],
      documentationLinks: [
        {
          title: t('Bootstrap Provider Documentation'),
          url: 'https://cluster-api.sigs.k8s.io/developer/architecture/controllers/bootstrap.html',
        },
      ],
    },
  },
  {
    id: 'node-not-joining',
    title: t('Node Not Joining Cluster'),
    description: t(
      'The machine has been provisioned but the node is not appearing in the Kubernetes cluster. This could be due to networking issues, incorrect join tokens, or bootstrap failures.'
    ),
    severity: 'critical',
    matcher: {
      kinds: ['Machine'],
      conditionType: 'Ready',
      reasonPattern: /node.*not.*found|waiting.*node/i,
    },
    solution: {
      steps: [
        t('SSH into the machine and check kubelet logs'),
        t('Verify the bootstrap token is valid and not expired'),
        t('Check network connectivity from the machine to the control plane'),
        t('Ensure the control plane endpoint is reachable'),
        t('Verify cloud-init ran successfully'),
        t('Check for firewall rules blocking kubelet registration'),
      ],
      codeSnippet: {
        language: 'bash',
        code: `# SSH into the machine
ssh <user>@<machine-ip>

# Check kubelet status
sudo systemctl status kubelet

# View kubelet logs
sudo journalctl -u kubelet -f

# Check cloud-init logs
sudo cat /var/log/cloud-init-output.log

# Verify control plane connectivity
curl -k https://<control-plane-endpoint>:6443/healthz`,
        description: t('Debug node joining issues'),
      },
      documentationLinks: [
        {
          title: t('Troubleshooting Node Registration'),
          url: 'https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/troubleshooting-kubeadm/#nodes-are-unable-to-join-the-cluster',
        },
      ],
    },
  },
  {
    id: 'etcd-unhealthy',
    title: t('Etcd Cluster Unhealthy'),
    description: t(
      'The etcd cluster is reporting unhealthy status. This is critical as etcd stores all cluster state. Common causes include disk I/O issues, network partitions, or member failures.'
    ),
    severity: 'critical',
    matcher: {
      kinds: ['KubeadmControlPlane'],
      conditionType: 'EtcdClusterHealthy',
      reasonPattern: /unhealthy|degraded/i,
    },
    solution: {
      steps: [
        t('Check etcd pod logs on control plane nodes'),
        t('Verify etcd member list and health status'),
        t('Check disk I/O performance on control plane nodes'),
        t('Ensure etcd data directory has sufficient space'),
        t('Verify network connectivity between etcd members'),
        t('Check for clock skew between control plane nodes'),
      ],
      codeSnippet: {
        language: 'bash',
        code: `# Check etcd health (from control plane node)
sudo ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \\
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \\
  --cert=/etc/kubernetes/pki/etcd/server.crt \\
  --key=/etc/kubernetes/pki/etcd/server.key \\
  endpoint health

# List etcd members
sudo ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \\
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \\
  --cert=/etc/kubernetes/pki/etcd/server.crt \\
  --key=/etc/kubernetes/pki/etcd/server.key \\
  member list`,
        description: t('Check etcd cluster health'),
      },
      documentationLinks: [
        {
          title: t('Etcd Disaster Recovery'),
          url: 'https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/#disaster-recovery',
        },
      ],
    },
  },
  {
    id: 'load-balancer-unavailable',
    title: t('Load Balancer Not Available'),
    description: t(
      'The control plane load balancer has not been provisioned or is unreachable. This prevents external access to the Kubernetes API server.'
    ),
    severity: 'critical',
    matcher: {
      kinds: ['Cluster'],
      conditionType: 'ControlPlaneReady',
      messagePattern: /load.*balancer|lb.*not.*ready|endpoint.*unavailable/i,
    },
    solution: {
      steps: [
        t('Check cloud provider load balancer creation status'),
        t('Verify load balancer security groups/firewall rules'),
        t('Ensure control plane nodes are registered as backend targets'),
        t('Check load balancer health checks are passing'),
        t('Verify cloud provider credentials have LB creation permissions'),
      ],
      quickFixCommands: [
        {
          description: t('Check cluster infrastructure status'),
          command: 'kubectl get <provider>cluster <cluster-name> -n <namespace> -o yaml',
        },
      ],
      documentationLinks: [
        {
          title: t('Control Plane Load Balancer'),
          url: 'https://cluster-api.sigs.k8s.io/developer/architecture/controllers/control-plane.html',
        },
      ],
    },
  },
  {
    id: 'aws-insufficient-capacity',
    title: t('AWS Capacity or Quota Issue'),
    description: t(
      'AWS does not currently have enough capacity for the requested instance type, or an AWS quota limit has been reached in the selected region or availability zone.'
    ),
    severity: 'warning',
    matcher: {
      kinds: ['Machine', 'MachineDeployment'],
      providerKinds: ['AWSCluster', 'AWSMachine', 'AWSMachineTemplate', 'AWSMachinePool'],
      messagePattern: /insufficient.*capacity|capacity.*exceeded|quota.*exceeded/i,
    },
    solution: {
      steps: [
        t('Try a different availability zone or region'),
        t('Request a quota increase in AWS'),
        t('Use a different EC2 instance type'),
        t('Wait and retry if capacity is temporarily unavailable'),
        t('Reduce the number of requested replicas if appropriate'),
      ],
      documentationLinks: [
        {
          title: t('AWS EC2 Insufficient Capacity'),
          url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-capacity.html',
        },
        {
          title: t('AWS Service Quotas'),
          url: 'https://docs.aws.amazon.com/servicequotas/latest/userguide/intro.html',
        },
      ],
    },
  },
  {
    id: 'insufficient-capacity',
    title: t('Provider Capacity or Quota Issue'),
    description: t(
      'The infrastructure provider does not have sufficient capacity to provision the requested resources, or a provider quota/limit has been reached. This is often temporary or environment-specific.'
    ),
    severity: 'warning',
    matcher: {
      kinds: ['Machine', 'MachineDeployment'],
      excludeProviderKinds: ['AWSCluster', 'AWSMachine', 'AWSMachineTemplate', 'AWSMachinePool'],
      messagePattern: /insufficient.*capacity|capacity.*exceeded|quota.*exceeded/i,
    },
    solution: {
      steps: [
        t('Check the infrastructure provider controller logs for the exact failure message'),
        t('Verify local or cloud provider limits for CPU, memory, IPs, or instances'),
        t('Use a different machine size, image, or placement if supported'),
        t('Wait and retry if the issue appears temporary'),
        t('Reduce the number of requested replicas if appropriate'),
      ],
      documentationLinks: [
        {
          title: t('Cluster API Troubleshooting'),
          url: 'https://cluster-api.sigs.k8s.io/user/troubleshooting.html',
        },
      ],
    },
  },
  {
    id: 'machine-deletion-hook-failed',
    title: t('Machine Pre-Drain Hook Failed'),
    description: t(
      'A pre-drain or pre-delete hook is preventing the machine from being deleted. This can block scaling operations and cluster updates.'
    ),
    severity: 'warning',
    matcher: {
      kinds: ['Machine'],
      customMatcher: (resource: any) => {
        return (
          resource.metadata?.annotations?.['cluster.x-k8s.io/paused'] ||
          resource.status?.deletionTimestamp !== undefined
        );
      },
    },
    solution: {
      steps: [
        t('Check for pending finalizers on the machine'),
        t('Review pre-drain hooks configured on the machine'),
        t('Check logs of any external deletion hooks'),
        t('Manually remove stuck finalizers if safe to do so'),
        t('Ensure workloads can be safely drained from the node'),
      ],
      quickFixCommands: [
        {
          description: t('Check machine finalizers'),
          command:
            "kubectl get machine <machine-name> -n <namespace> -o jsonpath='{.metadata.finalizers}'",
        },
        {
          description: t('Remove finalizer (use with caution)'),
          command:
            'kubectl patch machine <machine-name> -n <namespace> --type=json -p=\'[{"op": "remove", "path": "/metadata/finalizers/0"}]\'',
        },
      ],
      documentationLinks: [
        {
          title: t('Machine Deletion Hooks'),
          url: 'https://cluster-api.sigs.k8s.io/tasks/delete-machine.html',
        },
      ],
    },
  },
  {
    id: 'cluster-paused',
    title: t('Cluster is Paused'),
    description: t(
      'The cluster has the paused annotation, which prevents the Cluster API controllers from making any changes. This is typically used during maintenance.'
    ),
    severity: 'info',
    matcher: {
      kinds: ['Cluster', 'MachineDeployment', 'KubeadmControlPlane'],
      customMatcher: (resource: any) => {
        return resource.metadata?.annotations?.['cluster.x-k8s.io/paused'] === 'true';
      },
    },
    solution: {
      steps: [
        t('Verify if the pause was intentional'),
        t('If ready to resume, remove the pause annotation'),
        t('Check that the maintenance window has completed'),
      ],
      quickFixCommands: [
        {
          description: t('Resume cluster operations'),
          command:
            'kubectl annotate cluster <cluster-name> -n <namespace> cluster.x-k8s.io/paused-',
        },
      ],
      documentationLinks: [
        {
          title: t('Pausing Reconciliation'),
          url: 'https://cluster-api.sigs.k8s.io/tasks/pause-reconciliation.html',
        },
      ],
    },
  },
];

export const CAPI_ERROR_DEFINITIONS: CapiErrorDefinition[] = createCapiErrorDefinitions();

function getProviderKinds(resource: any): string[] {
  const providerKinds = new Set<string>();

  const addKind = (kind?: string) => {
    if (!kind || CORE_CAPI_KINDS.has(kind)) return;
    providerKinds.add(kind);
  };

  addKind(resource?.kind);
  addKind(resource?.spec?.infrastructureRef?.kind);
  addKind(resource?.spec?.template?.spec?.infrastructureRef?.kind);
  addKind(resource?.spec?.template?.spec?.infrastructureTemplate?.kind);
  addKind(resource?.spec?.machineTemplate?.infrastructureRef?.kind);
  addKind(resource?.spec?.machineTemplate?.infrastructureTemplate?.kind);
  addKind(
    resource?.spec?.topology?.workers?.machineDeployments?.[0]?.template?.infrastructureRef?.kind
  );
  addKind(resource?.spec?.topology?.workers?.machinePools?.[0]?.template?.infrastructureRef?.kind);

  return Array.from(providerKinds);
}

export function matchCapiError(
  resource: any,
  condition?: any,
  errorDefinitions: CapiErrorDefinition[] = CAPI_ERROR_DEFINITIONS
): CapiErrorDefinition | undefined {
  const resourceKind = resource.kind;
  const providerKinds = getProviderKinds(resource);

  for (const errorDef of errorDefinitions) {
    const { matcher } = errorDef;

    if (matcher.kinds && !matcher.kinds.includes(resourceKind)) continue;

    if (matcher.providerKinds && !matcher.providerKinds.some(k => providerKinds.includes(k))) {
      continue;
    }

    if (
      matcher.excludeProviderKinds &&
      matcher.excludeProviderKinds.some(k => providerKinds.includes(k))
    ) {
      continue;
    }

    if (matcher.conditionType && (!condition || condition.type !== matcher.conditionType)) {
      continue;
    }

    if (matcher.reasonPattern) {
      if (!condition?.reason || !asRegExp(matcher.reasonPattern).test(condition.reason)) continue;
    }

    if (matcher.messagePattern) {
      if (!condition?.message || !asRegExp(matcher.messagePattern).test(condition.message)) {
        continue;
      }
    }

    if (matcher.customMatcher && !matcher.customMatcher(resource, condition)) continue;

    return errorDef;
  }

  return undefined;
}

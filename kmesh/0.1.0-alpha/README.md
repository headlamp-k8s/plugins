# Headlamp Kmesh Plugin

The **Headlamp Kmesh Plugin** seamlessly integrates eBPF-based service mesh management and observability directly into Headlamp. It provides Kubernetes cluster administrators and DevOps engineers with an intuitive visual dashboard to inspect traffic routing, zero-trust security rules, and kernel-native telemetry without ever leaving the UI or dropping into complex terminal CLI sessions.

Kmesh is a high-performance, sidecarless Layer-4 and Layer-7 service mesh data plane built on eBPF and the Linux programmable kernel. This plugin eliminates the opacity of eBPF kernel programs by translating daemon instrumentation and xDS configurations into interactive Headlamp UI views.

**IMPORTANT:** This plugin is in alpha state!

## Key Features

- **Sidecarless Waypoint Management**: Inspect Gateway API resources configured for Kmesh L7 processing (`gatewayClassName: kmesh-waypoint`). Track container images, deployment health, and real-time status condition badges.
- **Daemon Health Diagnostics**: Real-time cluster-wide monitoring of `kmesh-daemon` pods across nodes, highlighting readiness states and instantly exposing degraded or CrashLooping daemons.
- **Live xDS Config Dump Proxy**: Dive deep into active kernel-native ADS state by directly proxying into running Kmesh daemons to view raw Clusters, Listeners, Routes, and Endpoints.
- **eBPF Kernel Telemetry & Observability**: Visualize live traffic statistics, TCP connection latency, and BPF map counters harvested directly from node-local eBPF instrumentation.
- **Authorization Policies**: Inspect security access controls and routing restrictions enforced at the socket/kernel level by Kmesh eBPF programs.
- **Seamless Headlamp Routing**: Embedded directly into Headlamp's primary navigation sidebar with dedicated split-panel drawers and deep routing support.

---

## Waypoint Management (Gateway API)

In modern sidecarless mesh architectures, Layer-7 traffic features (like HTTP routing, retries, and rate limiting) are offloaded to shared **Waypoint proxies**. The Kmesh plugin provides full lifecycle visibility into Waypoints deployed in your cluster.

### Capabilities:
- Automatically discovers Kubernetes `Gateway` resources utilizing the `kmesh-waypoint` gateway class.
- Highlights target container images and deployment readiness without manual JSON path querying.
- Provides an interactive side-drawer displaying live Kubernetes status conditions (e.g., `Accepted`, `Programmed`, `Ready`).


---

## Daemon Health Dashboard

Kmesh relies on node-local daemons (`kmesh-daemon`) deployed as a DaemonSet across Kubernetes worker nodes to manage BPF program attachment and map synchronization. The **Daemon Health Dashboard** provides an aggregated health report of your mesh infrastructure.

### Capabilities:
- Instant count of total vs. ready Kmesh pods across all namespaces (primarily `kmesh-system`).
- Highlights problematic nodes experiencing scheduling bugs or image pull failures.
- Provides direct links to standard Headlamp pod logs and debugging interfaces.



---

## xDS Config Dump Viewer

Debugging dynamic Envoy/xDS configuration in traditional service meshes usually requires running manual `kubectl exec` curl commands against diagnostic ports. The Kmesh plugin builds a secure, real-time proxy API right into Headlamp.

### Capabilities:
- **Kernel-Native ADS Inspection**: Directly queries running Kmesh pods to retrieve active xDS configurations.
- **Interactive Tabbed Parsing**: Separate, easily searchable views for **Clusters**, **Listeners**, and **Routes**.
- **No CLI Required**: Eliminates the need to copy SSH keys or execute arbitrary bash scripts inside container namespaces to verify routing policies.


---

## eBPF Telemetry & Observability

Because Kmesh transparently intercepts and routes traffic at the kernel socket layer (via `sockops` and `tc` BPF hooks), traditional userspace network tools often miss active connections. The **Observability Panel** surfaces metrics directly from eBPF maps.

### Capabilities:
- Displays active throughput, packet counters, and kernel connection hops.
- Exposes connection latency distribution across mesh-managed services.
- Real-time refresh toggle to monitor traffic spikes during canary deployments or load tests.


---

## Zero-Trust Authorization Policies

Kmesh enforces Layer-4 identity and access control directly at the kernel connection stage for negligible latency overhead. The **Authorization Policies Viewer** gives administrators visibility into active network security boundaries.

### Capabilities:
- Lists all active security policies enforced across namespaces.
- Displays source and destination workloads with allowed/denied port actions.
- Simplifies zero-trust auditing by rendering complex eBPF match criteria into plain-English table views.

---

## Demo

Watch the complete visual walkthrough of the Headlamp Kmesh plugin in action:

https://github.com/user-attachments/assets/669a2ec7-d0d7-4bc9-a4e3-598282ffa73c


## Prerequisites & Kmesh Setup

To unlock the full potential of this plugin, ensure Kmesh is properly deployed in your Kubernetes cluster running a compatible Linux kernel (5.10+ with eBPF enhancements).

### 1. Verify Kmesh DaemonSet
Run the following command to verify that Kmesh daemons are actively running in your cluster:
```bash
kubectl get pods -n kmesh-system
```

### 2. Check eBPF Kernel Mode
Ensure Kmesh is running in your preferred mode (Kernel-Native or Dual-Engine):
```bash
kubectl describe pod -l app=kmesh -n kmesh-system | grep -i "mode="
```

---

## Installation & Development

### Installing via Headlamp Catalog (Desktop)
1. Open your Headlamp desktop application.
2. Navigate to the **Plugin Catalog** from the main navigation settings.
3. Search for **Kmesh** and click **Install**.
4. Click **Reload UI** in the top-right prompt to activate the dedicated KMesh navigation section.

### Local Development Setup
To test or contribute to the Kmesh plugin locally:

```bash
# Clone the repository containing the plugin
git clone https://github.com/headlamp-k8s/plugins.git
cd plugins/kmesh

# Install npm dependencies
npm ci

# Run unit tests with Vitest
npm run test

# Start the Headlamp development server with hot-reloading enabled
npm run start
```

---

## References & Official Links

- [Kmesh Official Website & Documentation](https://kmesh.net)
- [Kmesh GitHub Repository](https://github.com/kmesh-net/kmesh)
- [Headlamp Documentation](https://headlamp.dev)
- [Gateway API Specification](https://gateway-api.sigs.k8s.io/)

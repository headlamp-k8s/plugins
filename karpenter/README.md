---
## Karpenter Headlamp Plugin

This Headlamp plugin adds **Karpenter-specific custom resources** to the Headlamp UI, helping users visualize, understand, and manage **autoscaling decisions** in a more intuitive way.

### Features

#### Current Features

* **NodeClass Visualization:**
    * Clean UI to view Karpenter NodeClass CRs
    * Shows key attributes (subnet selectors, IAM role, etc.)
    * Status and condition rendering in a human-readable format
* **Provisioner & NodePool Support:**
    * View and inspect Provisioners and NodePools
    * See constraints like CPU, requirements, disruption etc.
* **Pending Pod Dashboard:**
    * Displays pending pods blocked from scheduling
    * Shows unmet requirements
* **CRD Editing:**
    * Use Headlamp’s editor to configure Karpenter CRDs
    * Includes schema validation and diff preview

#### Upcoming Work

* **Real-time visualization of scaling decisions**
* **Prometheus integration for metrics like:**
    * Provisioning latency
    * Node lifecycle stats
    * Cost efficiency insights

---

### Getting Started with Karpenter on EKS

Ensure you have Karpenter installed in your Kubernetes cluster:

* **📘 [Karpenter Official Setup Guide (EKS)](https://karpenter.sh/docs/getting-started/getting-started-with-karpenter/)**

---

### Demo

Here is one demo video of the diff editor:

[Demo video of the diff editor](https://github.com/user-attachments/assets/d9074017-1aef-4e85-abf4-c1e700fdbf4e)

Please see this and other [closed PRs which have descriptions and more videos and screenshots of the features](https://github.com/headlamp-k8s/plugins/issues?q=state%3Aclosed%20label%3Akarpenter).


---

### Karpenter Implementations

Karpenter is a multi-cloud project with implementations by the following cloud providers:
- [AWS](https://github.com/aws/karpenter-provider-aws)
- [Azure](https://github.com/Azure/karpenter-provider-azure)
- [AlibabaCloud](https://github.com/cloudpilot-ai/karpenter-provider-alibabacloud)
- [Bizfly Cloud](https://github.com/bizflycloud/karpenter-provider-bizflycloud)
- [Cluster API](https://github.com/kubernetes-sigs/karpenter-provider-cluster-api)
- [GCP](https://github.com/cloudpilot-ai/karpenter-provider-gcp)
- [Proxmox](https://github.com/sergelogvinov/karpenter-provider-proxmox)
- [Oracle Cloud Infrastructure (OCI)](https://github.com/zoom/karpenter-oci)

---

### Testing the Plugin

#### Prerequisites

* Node.js and npm
* Docker
* Helm
* A Kubernetes cluster with Karpenter installed

#### Steps to Run Locally

1.  Clone the plugin repository:

    ```bash
    git clone https://github.com/headlamp-k8s/plugins.git
    ```

2.  Navigate to karpenter plugin directory

    ```bash
    cd karpenter
    ```

3.  Install all the required dependencies

    ```bash
    npm install
    ```

4.  Start the plugin in development mode

    ```bash
    npm start
    ```

5.  Launch Headlamp. You should now see "Karpenter" in the sidebar.

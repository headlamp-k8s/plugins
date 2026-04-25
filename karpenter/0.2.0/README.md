## Karpenter Headlamp Plugin

This Headlamp plugin adds **Karpenter-specific custom resources** to the Headlamp UI, helping users visualize, understand, and manage **autoscaling decisions** in a more intuitive way.

### Supported Karpenter Deployments

The plugin automatically detects and supports multiple Karpenter deployment types:

* **EKS Auto Mode** - AWS managed Karpenter with `NodeClass` resources (`nodeclasses.eks.amazonaws.com`)
* **Self-installed Karpenter** - Standard Karpenter installation with `EC2NodeClass` resources (`ec2nodeclasses.karpenter.k8s.aws`)
* **Generic Karpenter** - Other Karpenter installations with `NodeClass` resources (`nodeclasses.karpenter.sh`)

### Features

#### Current Features

* **NodeClass Visualization:**
    * Clean UI to view Karpenter NodeClass/EC2NodeClass CRs
    * Automatic detection of deployment type (EKS Auto Mode vs self-installed)
    * Shows key attributes (subnet selectors, IAM role, etc.)
    * Status and condition rendering in a human-readable format
    * Supports both `NodeClass` (EKS Auto Mode) and `EC2NodeClass` (self-installed) resources
* **NodeClaim & NodePool Support:**
    * View and inspect NodeClaims and NodePools
    * See constraints like CPU, requirements, disruption etc.
    * Real-time status monitoring and configuration details
* **Pending Pod Dashboard:**
    * Displays pending pods blocked from scheduling
    * Shows unmet requirements
    * Highlights why pods couldn't be scheduled 
* **CRD Editing:**
    * Use Headlamp’s editor to configure Karpenter CRDs
    * Includes schema validation and diff preview
* **Metrics Integration:**
    * Prometheus integration for comprehensive metrics visualization
    * Resource Usage, Allowed Disruptions and Pending Pods visualization (NodePools)
    * Creation Rate and Provisioning Latency visualization (Scaling View)
* **Maps View:**
    * See relationship between Karpenter Resources like NodeClasses, NodePool and NodeClaims with core Kubernetes resources like Pods, Nodes etc.
* **Automatic Deployment Detection:**
    * Automatically detects EKS Auto Mode vs self-installed Karpenter
    * Adapts UI and resource handling based on detected deployment type
    * No manual configuration required

---

### Getting Started with Karpenter on EKS

The plugin works with both EKS Auto Mode and self-installed Karpenter:

#### EKS Auto Mode (Recommended)
* **📘 [EKS Auto Mode Documentation](https://docs.aws.amazon.com/eks/latest/userguide/automode.html)**
* Uses AWS-managed Karpenter with `NodeClass` resources
* Automatically detected by the plugin

#### Self-installed Karpenter
* **📘 [Karpenter Official Setup Guide](https://karpenter.sh/docs/getting-started/getting-started-with-karpenter/)**
* Uses `EC2NodeClass` resources that you manage
* Requires manual installation and configuration

The plugin automatically detects which deployment type you're using and adapts accordingly.

#### How Detection Works

The plugin examines available Custom Resource Definitions (CRDs) in your cluster:

1. **EKS Auto Mode**: Detected by presence of `nodeclasses.eks.amazonaws.com` CRD
2. **Self-installed Karpenter**: Detected by presence of `ec2nodeclasses.karpenter.k8s.aws` CRD  
3. **Generic Karpenter**: Detected by presence of `nodeclasses.karpenter.sh` CRD

Detection happens automatically when the plugin loads, with no configuration required.

---

### Demo

Here is one demo video of the diff editor:

[Demo video of the diff editor](https://github.com/user-attachments/assets/d9074017-1aef-4e85-abf4-c1e700fdbf4e)

Please see this and other [closed PRs which have descriptions and more videos and screenshots of the features](https://github.com/headlamp-k8s/plugins/issues?q=state%3Aclosed%20label%3Akarpenter).

---

### Karpenter Providers

This plugin should work with most Karpenter providers, but has only so far been tested on the ones listed in the table. Additionally, each provider gives some extra information, and the ones in the table below are displayed by the plugin.

Please [submit an issue](https://github.com/headlamp-k8s/plugins/issues) if you test one of the untested providers or if you want support for this provider (PRs also gladly accepted).

| Provider Name | Tested | Extra provider specific info supported | Deployment Types |
| --- | --- | --- | --- |
| [AWS](https://github.com/aws/karpenter-provider-aws) | ✅ | ✅ | EKS Auto Mode, Self-installed |
| [Azure](https://github.com/Azure/karpenter-provider-azure) | ✅ | ✅ | Self-installed |
| [AlibabaCloud](https://github.com/cloudpilot-ai/karpenter-provider-alibabacloud) | ❌ | ❌ | Self-installed |
| [Bizfly Cloud](https://github.com/bizflycloud/karpenter-provider-bizflycloud) | ❌ | ❌ | Self-installed |
| [Cluster API](https://github.com/kubernetes-sigs/karpenter-provider-cluster-api) | ❌ | ❌ | Self-installed |
| [GCP](https://github.com/cloudpilot-ai/karpenter-provider-gcp) | ❌ | ❌ | Self-installed |
| [Proxmox](https://github.com/sergelogvinov/karpenter-provider-proxmox) | ❌ | ❌ | Self-installed |
| [Oracle Cloud Infrastructure (OCI)](https://github.com/zoom/karpenter-oci) | ❌ | ❌ | Self-installed |

---

## Feedback and Questions

Please [submit an issue](https://github.com/headlamp-k8s/plugins/issues) if you use Karpenter and have any other ideas or feedback. Or come to the [Kubernetes slack headlamp channel](https://kubernetes.slack.com/?redir=%2Fmessages%2Fheadlamp) for a chat. 


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

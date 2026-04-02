<!-- markdownlint-disable MD033 -->
<div align="center">

# 🐢 Cluster API Plugin for Headlamp

**A comprehensive, professional-grade Headlamp plugin for managing Kubernetes Cluster API (CAPI) resources.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue.svg)](https://www.typescriptlang.org/)
[![Headlamp Plugin](https://img.shields.io/badge/Headlamp-Plugin-green.svg)](https://headlamp.dev/)
[![Cluster API](https://img.shields.io/badge/Cluster%20API-v1beta1%20%2F%20v1beta2-orange.svg)](https://cluster-api.sigs.k8s.io/)

</div>

## <!-- markdownlint-enable MD033 -->

## 📖 Overview

The **Cluster API Plugin** enriches Headlamp with a powerful, intuitive graphical interface for declarative cluster lifecycle management using Kubernetes Cluster API (CAPI).

By introducing a fully-featured **"Cluster API"** section into the Headlamp sidebar and integrating deeply with Headlamp’s interactive map, this plugin transforms complex multi-cluster operations into a visual and highly interactive experience.

---

## 🎯 Why this Plugin?

Managing Cluster API resources via CLI can be complex and error-prone. This plugin provides:

- Visual cluster relationships (no more YAML hunting)
- Faster debugging with real-time status insights
- Simplified scaling & operations via UI
- Improved developer experience for multi-cluster environments

---

## 📸 Screenshots

### 🖥️ Dashboard View

![Main Plugin Dashboard](https://github.com/user-attachments/assets/3ab4b887-67de-4a9b-a29a-99e5446487e0)

### 🗺️ Map View Visualization

![Map View](https://github.com/user-attachments/assets/f659e62e-c89c-4c6e-a1da-17bf352f437c)

---

## ✨ Key Features

### 🌟 Interactive Operations & Visualization

- **Map View Integration**: Visualize CAPI resources with clear ownership relationships
- **Direct Resource Scaling**: Scale nodes via custom UI controls
- **1-Click Kubeconfig Download**: Fetch workload cluster configs instantly
- **Glance Tooltips**: Hover-based quick insights for faster debugging

---

### 🔍 Comprehensive Resource Insights

- **Rich Status Monitoring**: Human-readable conditions (Ready, Paused, Error)
- **Unified Template Rendering**: Clear visualization of ClusterClass configs
- **Owned Resource Tracking**: Easily map machines to parents

---

### 🛡️ First-Class Compatibility

- **API Agnostic**: Supports `v1beta1` and `v1beta2`
- **Provider Agnostic**: Works with Docker, AWS, Azure, GCP, vSphere, etc.

---

## 💡 Use Cases

- Platform engineers managing multi-cluster environments
- Developers testing Cluster API locally (CAPD, etc.)
- Teams debugging cluster provisioning issues
- Learning and visualizing Cluster API architecture

---

## 🏗️ Supported Resources

| Resource                         | Description                           | v1beta1 | v1beta2 | Scalable |
| -------------------------------- | ------------------------------------- | :-----: | :-----: | :------: |
| **Clusters**                     | Core cluster lifecycle                |   ✅    |   ✅    |    ❌    |
| **ClusterClasses**               | Reusable templates                    |   ✅    |   ✅    |    ❌    |
| **KubeadmControlPlanes**         | Control plane lifecycle               |   ✅    |   ✅    |    ✅    |
| **KubeadmControlPlaneTemplates** | Control plane templates               |   ✅    |   ✅    |    ❌    |
| **MachineDeployments**           | Rolling updates and declarative nodes |   ✅    |   ✅    |    ✅    |
| **MachinePools**                 | Dynamic machine pools                 |   ✅    |   ✅    |    ✅    |
| **MachineSets**                  | Replica management                    |   ✅    |   ✅    |    ✅    |
| **Machines**                     | Individual instances                  |   ✅    |   ✅    |    ❌    |
| **KubeadmConfigs**               | Bootstrap configs                     |   ✅    |   ✅    |    ❌    |
| **KubeadmConfigTemplates**       | Bootstrap templates                   |   ✅    |   ✅    |    ❌    |
| **MachineHealthChecks**          | Auto remediation                      |   ✅    |   ✅    |    ❌    |
| **MachineDrainRules**            | Drain & termination control           |   ✅    |   ✅    |    ❌    |

---

## ⚡ Quick Start

### 1. Set Up Cluster API

Follow the official guide:  
👉 https://cluster-api.sigs.k8s.io/user/quick-start.html

---

### 2. Install Plugin

#### For Users

1. Open **Headlamp**
2. Go to **Plugin Catalog**
3. Search **Cluster API**
4. Click **Install**

---

#### For Developers

```bash
git clone https://github.com/headlamp-k8s/plugins.git
cd plugins/cluster-api
npm install
npm run start
```

## 🛠️ Project Architecture

```text
cluster-api/
├── package.json
├── tsconfig.json
└── src/
    ├── components/   # Reusable UI components (tables, buttons, tooltips)
    ├── resources/    # CAPI resource definitions & renderers
    ├── utils/        # Helper functions and shared logic
    └── index.tsx     # Plugin entry point


```

The project is built using React and TypeScript, ensuring a scalable, maintainable, and type-safe architecture aligned with the Headlamp plugin ecosystem.

## 🐛 Troubleshooting

| Issue                 | Solution                                                     |
| --------------------- | ------------------------------------------------------------ |
| Plugin not visible    | Ensure Headlamp is updated and plugin is enabled             |
| Resources not loading | Verify CAPI CRDs: `kubectl get crd \| grep cluster.x-k8s.io` |
| Permission issues     | Check RBAC for Headlamp ServiceAccount                       |
| Build errors          | Run: `rm -rf node_modules package-lock.json && npm install`  |

---

## 🤝 Contributing

We welcome contributions from the community!

1. Fork the repository
2. Create a new branch (`feature/your-feature`)
3. Commit your changes
4. Push to your fork
5. Open a Pull Request

Please ensure your code follows project standards and includes tests where applicable.

---

## 📚 Resources

- Headlamp Plugin Docs: https://headlamp.dev/docs/latest/tutorials/plugin-development/
- Cluster API Docs: https://cluster-api.sigs.k8s.io/

---

**Built with ❤️ for the Kubernetes ecosystem**

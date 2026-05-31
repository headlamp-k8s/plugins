# Kyverno Headlamp Plugin

[![Artifact Hub](https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/kyverno-headlamp)](https://artifacthub.io/packages/search?repo=kyverno-headlamp)

A Headlamp plugin for visualizing and managing [Kyverno](https://kyverno.io/) policies and compliance reports directly from the Headlamp UI. Kyverno is a policy engine designed natively for Kubernetes, allowing you to validate, mutate, generate, and clean up Kubernetes resources using policies.

## 🎬 Demo

<video src="https://github.com/user-attachments/assets/3d32d729-a892-4efc-bf98-ea0b21375592" controls width="800">
  Your browser does not support the video tag.
</video>

Watch: https://github.com/user-attachments/assets/3d32d729-a892-4efc-bf98-ea0b21375592

## ✨ Features

- **Kyverno Dashboard**: Get a quick overview of your cluster's compliance posture — total policies, pass/fail counts, and active violations.
- **Violations View**: Aggregate and inspect policy violations across all namespaces with filtering by status, grouping by policy, namespace, or kind.
- **Cluster Policies & Policies**: List and inspect `ClusterPolicy` and `Policy` resources with rule counts, action types, ready status, and live result counts.
- **CEL-based Policies**: Full visibility into modern CEL admission policies:
  - `ValidatingPolicy` — Validate resources with CEL expressions
  - `MutatingPolicy` — Mutate resources with CEL expressions
  - `GeneratingPolicy` — Generate resources from policies
  - `DeletingPolicy` — Scheduled resource cleanup
- **Policy Reports**: View `PolicyReport` and `ClusterPolicyReport` resources with per-resource pass/fail/warn/error/skip summaries.
- **Kyverno Reports**: Browse internal Kyverno ephemeral reports (e.g. `EphemeralReport`, `ClusterEphemeralReport`) alongside standard policy reports.
- **Image Validating Policies**: Review `ImageValidatingPolicy` resources for supply-chain security enforcement.
- **Policy Exceptions**: Inspect `PolicyException` resources to understand intentional bypasses.
- **Cleanup Policies**: Monitor `CleanupPolicy` and `ClusterCleanupPolicy` schedules and their last execution times.
- **Storybook Support**: All major list components have isolated `Pure*` variants that can be visually tested in Storybook without a live cluster.

## 📋 Prerequisites

- [Headlamp](https://headlamp.dev/) installed (Desktop or In-Cluster).
- A Kubernetes cluster with [Kyverno](https://kyverno.io/docs/installation/) v1.12+ deployed.

## 🚀 Quick Start

### Install via Plugin Catalog (Recommended)

1. Open the Headlamp Desktop App.
2. Navigate to the **Plugin Catalog** in the sidebar.
3. Search for **"Kyverno"** and click **Install**.
4. Reload the UI (use the notification or Navigation menu → Reload) to see the new **Kyverno** section in the sidebar.

### Manual Installation

1. Download the latest release `.tar.gz` package from [GitHub Releases](https://github.com/headlamp-k8s/plugins/releases).
2. Extract to your Headlamp plugins directory:

   **macOS:**
   ```bash
   mkdir -p ~/Library/Application\ Support/Headlamp/plugins/kyverno
   tar -xzf kyverno-*.tar.gz -C ~/Library/Application\ Support/Headlamp/plugins/kyverno --strip-components=1
   ```

   **Linux:**
   ```bash
   mkdir -p ~/.config/Headlamp/plugins/kyverno
   tar -xzf kyverno-*.tar.gz -C ~/.config/Headlamp/plugins/kyverno --strip-components=1
   ```

   **Windows:**
   ```powershell
   New-Item -ItemType Directory -Path "$env:APPDATA\Headlamp\plugins\kyverno"
   # Extract the tarball using your preferred tool
   ```

3. Restart Headlamp.

## 🛠️ Development

### Building the Plugin

```bash
# Clone the plugins repository
git clone https://github.com/headlamp-k8s/plugins.git
cd plugins/kyverno

# Install dependencies
npm install

# Build the plugin
npm run build
```

The build creates a `dist/main.js` entry point required by Headlamp.

### Running Locally (Development Mode)

```bash
npm start
```

This watches for changes and rebuilds automatically. Load the `dist/` folder in Headlamp to see live updates.

### Storybook (UI without a cluster)

```bash
npm run storybook
```

Opens Storybook at `http://localhost:6006`. The `Pure*` component variants render with mock data — no Kubernetes cluster required. See [STORYBOOK_AND_LOCAL_TESTING.md](STORYBOOK_AND_LOCAL_TESTING.md) for details.

### Linting & Formatting

```bash
npm run lint       # Check for lint errors
npm run lint-fix   # Auto-fix lint errors
npm run format     # Format code
npm run tsc        # TypeScript type-check
```

## 📊 Supported Kyverno Resources

| Resource | API Group | Scope |
|---|---|---|
| `ClusterPolicy` | `kyverno.io` | Cluster |
| `Policy` | `kyverno.io` | Namespace |
| `ValidatingPolicy` | `admissionregistration.k8s.io` | Cluster |
| `MutatingPolicy` | `admissionregistration.k8s.io` | Cluster |
| `GeneratingPolicy` | `kyverno.io` | Cluster |
| `DeletingPolicy` | `kyverno.io` | Cluster |
| `ClusterPolicyReport` | `wgpolicyk8s.io` | Cluster |
| `PolicyReport` | `wgpolicyk8s.io` | Namespace |
| `ClusterEphemeralReport` | `reports.kyverno.io` | Cluster |
| `EphemeralReport` | `reports.kyverno.io` | Namespace |
| `ImageValidatingPolicy` | `kyverno.io` | Cluster |
| `PolicyException` | `kyverno.io` | Namespace |
| `ClusterCleanupPolicy` | `kyverno.io` | Cluster |
| `CleanupPolicy` | `kyverno.io` | Namespace |

## 📁 Plugin Structure

```
kyverno/
├── src/
│   ├── components/       # React components (lists, viewers, storybooks)
│   ├── hooks/            # Custom React hooks (e.g. usePolicyResultCounts)
│   ├── resources/        # Kyverno CRD class definitions
│   └── index.tsx         # Plugin entry point & route registration
├── .storybook/           # Storybook configuration
├── dist/                 # Build output (main.js)
├── docs/                 # Extended documentation
├── package.json
├── tsconfig.json
└── README.md
```

## 📄 License

This project is licensed under the Apache License 2.0 — see the [LICENSE](../../LICENSE) file for details.

---

## 📚 Resources

- [Kyverno Documentation](https://kyverno.io/docs/)
- [Headlamp Plugin Development](https://headlamp.dev/docs/latest/development/plugins/)
- [Kyverno GitHub](https://github.com/kyverno/kyverno)
- [Policy Report CRDs (wgpolicyk8s.io)](https://github.com/kubernetes-sigs/wg-policy-prototypes)

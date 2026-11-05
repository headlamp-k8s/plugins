# Kyverno

The Kyverno plugin for Headlamp adds a new item (Kyverno) to the sidebar to give
users a way to view Kyverno policies, reports, and policy violations directly in
Headlamp.

[Kyverno](https://kyverno.io/) is a policy engine for Kubernetes. This plugin
discovers the Kyverno CRDs present in your cluster and only shows the views that
apply, so it works whether you run the legacy (`kyverno.io/v1`) policy types, the
newer CEL-based policy types, or both.

## Demo

<video src="https://github.com/user-attachments/assets/3d32d729-a892-4efc-bf98-ea0b21375592" controls width="800">
  Your browser does not support the video tag.
</video>

Watch: https://github.com/user-attachments/assets/3d32d729-a892-4efc-bf98-ea0b21375592

## Features

- **Overview** dashboard summarizing policies and their compliance at a glance.
- **Compliance badge** in the app bar showing overall pass/fail status.
- **Policies** views for the full set of Kyverno policy types:
  - Cluster Policies and Policies (`kyverno.io/v1`)
  - Validating, Mutating, Generating, Deleting, and Image Validating Policies
    (CEL-based)
  - Cluster Cleanup Policies and Cleanup Policies
- **Reports** views:
  - Policy Reports and Cluster Policy Reports (`wgpolicyk8s.io/v1alpha2`)
  - Admission, Background Scan, and Ephemeral Reports, including their
    cluster-scoped variants
- **Violations** view aggregating failing results across reports.
- **Exceptions** view for Policy Exceptions.

Views for resource types whose CRDs are not installed are hidden automatically.

## Prerequisites

- A Kubernetes cluster with [Kyverno](https://kyverno.io/docs/installation/)
  installed.
- [Headlamp](https://headlamp.dev/) (Desktop or In-Cluster).

## Installation

### Plugin Catalog (Recommended)

1. Open Headlamp and navigate to the **Plugin Catalog** in the sidebar.
2. Search for **Kyverno** and click **Install**.
3. Reload the UI to see the new **Kyverno** section in the sidebar.

### Manual Installation

Download the latest release from [GitHub Releases](https://github.com/headlamp-k8s/plugins/releases) and extract it to your Headlamp plugins directory:

**Linux:**
```bash
mkdir -p ~/.config/Headlamp/plugins/kyverno
tar -xzf kyverno-*.tar.gz -C ~/.config/Headlamp/plugins/kyverno --strip-components=1
```

**macOS:**
```bash
mkdir -p ~/Library/Application\ Support/Headlamp/plugins/kyverno
tar -xzf kyverno-*.tar.gz -C ~/Library/Application\ Support/Headlamp/plugins/kyverno --strip-components=1
```

Restart Headlamp after extracting.

## Development

```bash
git clone https://github.com/headlamp-k8s/plugins.git
cd plugins/kyverno
npm install
npm run start    # Watch mode — load dist/ in Headlamp to see changes
npm run build    # Production build
npm run lint     # Check for lint errors
npm run lint-fix # Auto-fix lint errors
npm run format   # Format code
npm run tsc      # TypeScript type-check
```

## License

This project is licensed under the Apache License 2.0 — see the [LICENSE](../../LICENSE) file for details.

## References

- [Kyverno Documentation](https://kyverno.io/docs/)
- [Headlamp Plugin Development](https://headlamp.dev/docs/latest/development/plugins/)
- [Kyverno GitHub](https://github.com/kyverno/kyverno)

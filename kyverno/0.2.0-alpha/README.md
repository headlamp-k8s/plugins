# Kyverno

The Kyverno plugin for Headlamp adds a new item (Kyverno) to the sidebar to give
users a way to view Kyverno policies, reports, and policy violations directly in
Headlamp.

[Kyverno](https://kyverno.io/) is a policy engine for Kubernetes. This plugin
discovers the Kyverno CRDs present in your cluster and guards views for unavailable
resource types, so it works whether you run the legacy (`kyverno.io/v1`) policy
types, the newer CEL-based policy types, or both.

## Demo

<video src="https://github.com/user-attachments/assets/77cad203-de41-40b3-9966-e2a3b741f298" controls width="800">
  Your browser does not support the video tag.
</video>

Watch: https://github.com/user-attachments/assets/77cad203-de41-40b3-9966-e2a3b741f298

## Features

- **Overview** dashboard summarizing policies and their compliance at a glance.
- **Compliance badge** in the app bar showing overall pass/fail status.
- **Policies** views for the full set of Kyverno policy types:
  - Cluster Policies and Policies (`kyverno.io/v1`)
  - Validating, Mutating, Generating, Deleting, and Image Validating Policies
    (CEL-based), including all five namespaced counterparts
  - Cluster Cleanup Policies and Cleanup Policies
- **Policy Impact Map** on legacy Policy and ClusterPolicy detail pages, showing
  evaluated resources grouped by kind, pass/fail/warning counts, and plain-language
  match explanations derived from policy rules and report data.
- **Policy Engine Health**, an optional Overview section showing admission rate,
  denied requests, circuit breaker trips, controller requeues, policies not ready,
  and P95 admission review latency.
- **Reports** views:
  - Policy Reports and Cluster Policy Reports (`wgpolicyk8s.io/v1alpha2`)
  - Ephemeral Reports and Cluster Ephemeral Reports (`reports.kyverno.io/v1`)
- **Violations** view aggregating failing results across reports.
- **Exceptions** view for Policy Exceptions.

Views for resource types whose CRDs are not installed show an availability
message. Each namespaced CEL policy kind is checked individually, with a
version-specific message when unavailable.

## 0.2.0-alpha Release

- Added the Policy Impact Map and its report-based aggregation and match
  explanations.
- Added list and detail views for all five namespaced CEL policy kinds, with
  namespace columns and distinct detail tabs for same-named policies.
- Added opt-in Prometheus-backed Policy Engine Health monitoring.
- Fixed translation placeholders rendering literally instead of substituting
  counts, percentages, and error messages.
- Fixed table headers failing to update when translations load or the language
  changes.

See the [release notes](https://github.com/headlamp-k8s/plugins/issues/1359)
for screenshots and background.

### Policy Engine Health Setup

The section is disabled by default. Enable **Policy Engine Health** under
**Settings > Plugins > kyverno**. It requires a reachable Prometheus server
scraping Kyverno's controller metrics and permission to read the policy resources
used for readiness checks, including cleanup policies.

Prometheus is discovered automatically. If none is found, the section is omitted.
Other plugin views do not require Prometheus.

### Known Limitations

- The Policy Impact Map supports legacy Policy and ClusterPolicy resources only,
  not CEL policy kinds.
- Drill-down links from impacted resources to individual report results and
  integration with Headlamp's Map view are not included in this release.
- Overview policy totals still count legacy Policy and ClusterPolicy resources,
  not CEL policies.
- Long namespaced CEL sidebar labels can truncate at the default sidebar width.

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
tar -xzf headlamp-k8s-kyverno-0.2.0-alpha.tar.gz -C ~/.config/Headlamp/plugins/kyverno --strip-components=1
```

**macOS:**
```bash
mkdir -p ~/Library/Application\ Support/Headlamp/plugins/kyverno
tar -xzf headlamp-k8s-kyverno-0.2.0-alpha.tar.gz -C ~/Library/Application\ Support/Headlamp/plugins/kyverno --strip-components=1
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

This project is licensed under the Apache License 2.0 — see the [LICENSE](https://github.com/headlamp-k8s/plugins/blob/main/LICENSE) file for details.

## References

- [Kyverno Documentation](https://kyverno.io/docs/)
- [Headlamp Plugin Development](https://headlamp.dev/docs/latest/development/plugins/)
- [Kyverno GitHub](https://github.com/kyverno/kyverno)

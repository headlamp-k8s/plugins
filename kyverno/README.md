# Kyverno

The Kyverno plugin for Headlamp adds a new item (Kyverno) to the sidebar to give
users a way to view Kyverno policies, reports, and policy violations directly in
Headlamp.

[Kyverno](https://kyverno.io/) is a policy engine for Kubernetes. This plugin
discovers the Kyverno CRDs present in your cluster and only shows the views that
apply, so it works whether you run the legacy (`kyverno.io/v1`) policy types, the
newer CEL-based policy types, or both.

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

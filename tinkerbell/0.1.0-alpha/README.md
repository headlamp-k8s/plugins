# Tinkerbell Headlamp Plugin 0.1.0-alpha

The Tinkerbell Headlamp plugin adds bare metal provisioning visibility to
Headlamp. This first alpha release focuses on viewing and debugging
Tinkerbell resources from the Kubernetes UI.

## Overview

[Tinkerbell](https://tinkerbell.org/) is a CNCF sandbox project for bare metal
provisioning. It lets operators describe physical machines, provisioning
templates, and provisioning workflows using Kubernetes custom resources.

In a Tinkerbell setup, users usually work with:

- **Hardware**: the physical or virtual machine that Tinkerbell can provision
- **Template**: the provisioning recipe that defines tasks and actions
- **Workflow**: the provisioning run that applies a template to hardware

This plugin brings those resources into Headlamp so users can inspect
provisioning state without switching between the dashboard, raw YAML, and
`kubectl` command output.

## Why this plugin helps

Tinkerbell resources are Kubernetes CRDs, so they can already be inspected
with `kubectl`. However, debugging provisioning through raw YAML alone can be
hard when users need to understand which machine is booting, which template is
being used, which workflow is running, and which task or action failed.

The plugin provides structured list and detail views for Tinkerbell resources
so Headlamp users can follow the provisioning flow more clearly.

## Value for Headlamp users

- Discover Tinkerbell resources from the Headlamp sidebar
- Inspect bare metal provisioning resources inside the Kubernetes dashboard
- View provisioning status with Headlamp-style tables and status labels
- Use existing Headlamp resource actions such as view and edit YAML
- Debug Tinkerbell resources alongside other Kubernetes resources

## Value for Tinkerbell users

- Understand Hardware, Template, and Workflow resources in a visual UI
- Inspect workflow progress while provisioning is running
- Identify running and failed tasks or actions more quickly
- View hardware boot, network, disk, and metadata information in one place
- Demo Tinkerbell provisioning flows directly from Headlamp

## Alpha scope

This alpha release focuses mainly on the core provisioning flow:

```text
Hardware -> Template -> Workflow
```

The strongest tested resource kinds in this release are:

- Hardware
- Template
- Workflow

These views were tested with Tinkerbell v0.23.0 using the
Vagrant/VirtualBox lab setup.

## Included in 0.1.0-alpha

### Headlamp integration

- Tinkerbell section in the Headlamp sidebar
- Routes for supported Tinkerbell resources
- CRD detection for Tinkerbell installation state
- List and detail views using Headlamp UI patterns
- Headlamp-style status labels
- Raw YAML access through standard Headlamp resource actions

### Hardware views

Hardware represents the machine that Tinkerbell can provision.

This release includes:

- Hardware list view
- Hardware detail view
- Machine identity fields
- Network and interface information
- Disk information
- Resource and metadata display
- Boot configuration display
- BMC reference display when available

### Template views

Templates represent the provisioning recipe used by Tinkerbell workflows.

This release includes:

- Template list view
- Template detail view
- Parsed task display
- Parsed action display
- Total action counts
- Raw template data display

### Workflow views

Workflows represent provisioning execution.

This release includes:

- Workflow list view
- Workflow detail view
- Workflow status display
- Current task and current action while a workflow is running
- Hardware and template references
- Boot option summary
- Hardware map display
- Task table
- Action table
- Failed action summary
- Template rendering status
- Timing fields

### Early additional CRD views

The plugin also includes early list and detail views for:

- WorkflowRuleSets
- BMC Machines
- BMC Jobs
- BMC Tasks

These views are included in the initial plugin structure, but they still need
more testing with the CAPT playground and more complete Tinkerbell setups.

## Installation

### From the Headlamp Plugin Catalog

After the `0.1.0-alpha` package is published, it can be installed from the
Headlamp Plugin Catalog:

1. Open Headlamp.
2. Go to Settings.
3. Open Plugins.
4. Search for Tinkerbell.
5. Install and enable the plugin.
6. Open a Kubernetes cluster where Tinkerbell CRDs are installed.
7. Use the Tinkerbell section in the sidebar.

The release archive for this version is expected at:

```text
https://github.com/headlamp-k8s/plugins/releases/download/tinkerbell-0.1.0-alpha/headlamp-k8s-tinkerbell-0.1.0-alpha.tar.gz
```

### Development installation

```bash
git clone https://github.com/headlamp-k8s/plugins.git
cd plugins/tinkerbell
npm install
npm run start
```

To build the plugin:

```bash
npm run build
```

## Requirements

To see Tinkerbell resources in Headlamp, the connected Kubernetes cluster must
have Tinkerbell installed.

This alpha targets:

- Tinkerbell v0.23.0
- Headlamp plugin APIs used by the current plugins repository

The plugin detects whether the required Tinkerbell CRDs are installed. If the
CRDs are not present, the plugin shows an unavailable state instead of broken
or empty resource pages.

## Validation

The main alpha flow has been tested with:

- Headlamp Desktop
- Tinkerbell v0.23.0
- Vagrant/VirtualBox Tinkerbell lab
- Real provisioning data for Hardware, Template, and Workflow

Development checks include:

- TypeScript
- ESLint
- Prettier
- Unit tests
- Production build

## Known limitations

- The strongest tested flow is Hardware, Template, and Workflow.
- WorkflowRuleSet and BMC views are early and need more validation.
- The plugin is currently focused on read-only inspection.
- Guided create/edit flows are not part of this alpha.
- Retry and power actions are not included until safe behavior is reviewed.
- Relationship navigation can be improved in future releases.

## Future work

Possible follow-up work includes:

- Validating WorkflowRuleSet and BMC views with the CAPT playground
- Improving relationship navigation between Hardware, Templates, and Workflows
- Adding richer workflow visualization for provisioning tasks and actions
- Adding a provisioning readiness view for the Pending to Running phase
- Improving failed workflow debugging summaries
- Adding Storybook coverage for important provisioning states
- Adding guided create/edit flows if considered safe and useful
- Exploring safe retry or power actions after maintainer review
- Improving documentation with sample manifests and troubleshooting notes

## Resources

- [Tinkerbell documentation](https://tinkerbell.org/docs/)
- [Tinkerbell v0.23.0 release](https://github.com/tinkerbell/tinkerbell/releases/tag/v0.23.0)
- [Tinkerbell v0.23.0 CRDs](https://github.com/tinkerbell/tinkerbell/tree/v0.23.0/crd/bases)
- [Headlamp plugin development](https://headlamp.dev/docs/latest/tutorials/plugin-development/)

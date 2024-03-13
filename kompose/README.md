# Kompose

This plugin allows to use the Kompose tool from Headlamp.
At the moment it is only working via a Job in a Kubernetes cluster but
the idea is that we can also run it locally when using Headlamp desktop
version.

The Kompose related jobs are run in a *headlamp-tools* namespace. If the
namespace does not exist, it will be created.

In the future we will also add the possibility to run Kompose locally
when using Headlamp desktop version.

## Usage

The plugin adds a new "Kompose" sidebar item when in a cluster. This
item will show a UI for generating Kubernetes YAML from a docker-compose
one.

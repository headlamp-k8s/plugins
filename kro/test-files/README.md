# Test files

Sample manifests for exercising the kro plugin against a cluster with
[kro installed](https://kro.run/docs/getting-started/Installation/).

## Happy path

```bash
kubectl apply -f webapp-platform-config.yaml   # externalRef target first
kubectl apply -f webapp-rgd.yaml
kubectl get rgd webapp.kro.run                 # wait for Active
kubectl apply -f webapp-instance.yaml
```

What to look for in the plugin:

- The **webapp.kro.run** RGD listed as Active, with its composed
  resources ordered topologically: `platformConfig` annotated as
  external/read-only, `appConfig` depending on it, `deployment`
  depending on `appConfig`, and `service` marked conditional.
- The **my-webapp** instance under the RGD's Instances section, with a
  Sub-resources table showing the ConfigMap, Deployment (2/2 ready),
  and Service, each linking to its native Headlamp page.
- Live updates: edit the instance (e.g. `replicas: 3`, or
  `expose: false` to watch the Service disappear) and see the views
  update without refresh.

## Error scenarios

```bash
kubectl apply -f error-scenarios/invalid-cel-rgd.yaml
```

The RGD goes **Inactive** (invalid CEL). The plugin shows the red state
in the list, renders the detail page from spec alone, and reports that
the generated CRD was not found.

```bash
kubectl apply -f error-scenarios/missing-externalref-rgd.yaml
kubectl apply -f error-scenarios/missing-externalref-instance.yaml
```

The RGD is Active but the instance cannot reconcile because the
externalRef target is missing — the instance's state/conditions surface
the error. Create the missing ConfigMap to watch it recover:

```bash
kubectl create configmap does-not-exist --from-literal=message=hi
```

For RBAC degradation, view any instance with a user that can read
instances but not the underlying resources: the Sub-resources section
shows the server's forbidden message per kind instead of an empty
state.

## Cleanup

```bash
kubectl delete -f webapp-instance.yaml -f error-scenarios/ --ignore-not-found
kubectl delete -f webapp-rgd.yaml -f webapp-platform-config.yaml --ignore-not-found
kubectl delete configmap does-not-exist --ignore-not-found
```

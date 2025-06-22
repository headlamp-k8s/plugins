# Flux

The Flux plugin provides a way to visualize Flux (should be installed in your cluster) in Headlamp. Flux is a tool for implementing GitOps and synchronizing Kubernetes clusters with sources of configuration (like Git repositories). It also automates updates to configuration when there is new code to deploy.

This plugin adds a new item (Flux) to the sidebar to give the user an overview of the Flux installation on the cluster.

## Flux Installation

Please refer to the [official installation guide](https://fluxcd.io/flux/installation/) for Flux to learn to install it.

## Plugin Installation in Headlamp for Desktop

Go to the Plugin Catalog, search for the Flux plugin, and click the Install button. Reload the UI (Navigation menu > Reload, or use the notification after installing the plugin) to see the new Flux item in the sidebar.

## Installing the Flux Headlamp plugin in a Headlamp deployment

If you are deploying Headlamp using Helm, you can use the following HelmRelease manifest to install the Flux Headlamp plugin with your Headlamp deployment:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: headlamp
---
apiVersion: source.toolkit.fluxcd.io/v1beta1
kind: HelmRepository
metadata:
  name: headlamp
  namespace: headlamp
spec:
  interval: 1m0s
  timeout: 1m0s
  url: https://headlamp-k8s.github.io/headlamp/
---
apiVersion: helm.toolkit.fluxcd.io/v2beta1
kind: HelmRelease
metadata:
  name: headlamp
  namespace: headlamp
spec:
  chart:
    spec:
      chart: headlamp
      sourceRef:
        kind: HelmRepository
        name: headlamp
      version: "*"
  interval: 1m0s
  values:
    ingress:
      enabled: true
      ingressClassName: nginx
      annotations:
        cert-manager.io/cluster-issuer: letsencrypt-http01-nginx-issuer
      hosts:
        - host: example.com # Change me
          paths:
            - path: /
              type: ImplementationSpecific
      tls:
        - secretName: headlamp-tls
          hosts:
            - example.com # Change me
    config:
      pluginsDir: /build/plugins
    initContainers:
      - command:
          - /bin/sh
          - -c
          - mkdir -p /build/plugins && cp -r /plugins/* /build/plugins/ && chown -R 100:101 /build
        image: ghcr.io/headlamp-k8s/headlamp-plugin-flux:latest
        imagePullPolicy: Always
        name: headlamp-plugins
        securityContext:
          runAsNonRoot: false
          privileged: false
          runAsUser: 0
          runAsGroup: 0
        volumeMounts:
          - mountPath: /build/plugins
            name: headlamp-plugins
    persistentVolumeClaim:
      accessModes:
        - ReadWriteOnce
      enabled: true
      size: 1Gi
    volumeMounts:
      - mountPath: /build/plugins
        name: headlamp-plugins
    volumes:
      - name: headlamp-plugins
        persistentVolumeClaim:
          claimName: headlamp # The name of the Helm release
```

As alternative, you can also use the Use EmptyDir (Ephemeral Shared Volume) to pass files from the init containers to the main container. 

```yaml
config:
  pluginsDir: /build/plugins
initContainers:
  - command:
      - /bin/sh
      - -c
      - mkdir -p /build/plugins && cp -r /plugins/* /build/plugins/ && chown -R 100:101 /build
    image: ghcr.io/headlamp-k8s/headlamp-plugin-flux:latest
    imagePullPolicy: Always
    name: headlamp-plugins
    securityContext:
      runAsNonRoot: false
      privileged: false
      runAsUser: 0
      runAsGroup: 0
    volumeMounts:
      - mountPath: /build/plugins
        name: headlamp-plugins
volumeMounts:
  - mountPath: /build/plugins
    name: headlamp-plugins
volumes:
  - name: headlamp-plugins
    emptyDir: {}
```

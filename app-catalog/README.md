# App Catalog

This plugin adds an app catalog to Headlamp, powered by ArtifactHub and Helm.

![Screenshot of the Headlamp UI with the App Catalog browse page](https://github.com/user-attachments/assets/eeee154a-9146-4132-9bb8-a9e57d863161 "Headlamp UI with App Catalog browse page")

## About the App Catalog

This plugin enables the ability to install Helm charts from artifacthub directly within Headlamp. 

*Note: By default, the App Catalog plugin has its filter set to "Official". This can be changed by navigating to the settings page using the `Settings` button to the right of the title bar.*

## Developing Headlamp Plugins

### Setting up the Environment

1. Run the Headlamp app from the main branch:

   - In a terminal window use:

   ```bash
   cd headlamp-k8s/headlamp/app
   npm install
   npm start
   ```

2. Set up the App Catalog:

   - In a new terminal window, use:

   ```bash
   cd headlamp-k8s/plugins/app-catalog
   npm install
   npm start
   ```

3. Ensure the App Catalog is enabled

   - From within Headlamp, navigate to the `Settings` page via the sidebar or the gear icon in the top right corner.
   - Select the `Plugins` tab located in the sidebar.
   - Enable the App Catalog plugin by toggling the switch to the right of the menu.
   - Navigate back to the main page of your cluster.



After completing these steps, you'll see the App Catalog link in the sidebar.

![Screenshot of the App Catalog link in the sidebar](https://github.com/user-attachments/assets/5ee65579-abfc-4820-bf83-bcc4e2bea0f5 "Screenshot of the App Catalog link in the sidebar")

## App Catalog supported labels and annotations
The App-Catalog plugin in Headlamp discovers and lists application catalogs by scanning Kubernetes Service resources.
To be recognized as a catalog source, the Service must include specific labels and annotations that describe how the plugin should interact with it.

Catalogs can be either:
 - External sources
 - Internal in-cluster helm repositories or custom chart services

| Label                              | Description                                                                    |
|------------------------------------|--------------------------------------------------------------------------------|
| catalog.headlamp.dev/is-catalog    | Indicates that this Service should be treated as an application catalog.       |


| Annotaion                        | Description                                                                                                               |
|----------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| catalog.headlamp.dev/name        | Internal identifier for the catalog. It'll be used as displayName if `displayName` is empty.                              |
| catalog.headlamp.dev/protocol    | Specifies the catalog API protocol. Supported values are helm (for in-cluster service, artifacthub (for external service) |
| catalog.headlamp.dev/displayName | (optional) User-friendly display name shown in UI.                                                                        |
| catalog.headlamp.dev/uri         | URL or endpoint used to fetch catalog data. For external catalogs, this must be a valid HTTP(S) URL.                      |

### Sample external-service to access artifacthub.io
```yaml
apiVersion: v1
kind: Service
metadata:
  name: artifacthub-catalog
  namespace: artifacthub
  labels:
    catalog.headlamp.dev/is-catalog: ""
  annotations:
    catalog.headlamp.dev/name: artifacthub-catalog
    catalog.headlamp.dev/protocol: artifacthub
    catalog.headlamp.dev/uri: https://artifacthub.io
spec:
  type: ExternalName
  externalName: artifacthub.io
  ports:
  - name: http
    port: 80
    targetPort: 80
    protocol: TCP
```
### Sample in-cluster service to access catalog running in-cluster
```yaml
apiVersion: v1
kind: Service
metadata:
    name: demo-catalog
    namespace: test-catalog
    labels:
      catalog.headlamp.dev/is-catalog: ""
    annotations:
      catalog.headlamp.dev/name: demo-catalog
      catalog.headlamp.dev/protocol: helm
      catalog.headlamp.dev/displayName: My demo catalog
spec:
    type: NodePort
    ports:
    - name: http
      port: 80
      targetPort: 80
      protocol: TCP
```


## Contributing

We welcome contributions! If you have ideas for improvements or encounter any issues, please open an issue or submit a pull request on our [GitHub repository](https://github.com/headlamp-k8s/plugins).
# Strimzi Headlamp Plugin

A Headlamp plugin for managing Strimzi (Apache Kafka on Kubernetes) resources directly from the Headlamp UI.

## ✨ Features

- **Kafka Clusters**: View Kafka cluster resources with KRaft/ZooKeeper mode detection
- **Kafka Topics**: Full CRUD operations (Create, Read, Update, Delete)
  - Create topics with custom partitions, replicas, retention, and compression
  - Edit topic configurations (partitions, replicas, retention, min ISR)
  - Delete topics with confirmation
- **Kafka Users**: Complete user management with security
  - Create users with SCRAM-SHA-512 or TLS authentication
  - Configure ACLs for fine-grained authorization
  - View passwords and certificates (secrets)
  - Delete users with confirmation
- **Search & Filter**: Real-time search and advanced filtering on all lists
  - Filter by status, mode, authentication type, partitions, replicas, and more
- Real-time status monitoring for all Strimzi resources
- Multi-namespace support - view resources across all namespaces

## 📋 Prerequisites

- [Headlamp](https://headlamp.dev/) installed
- A Kubernetes cluster with [Strimzi operator](https://strimzi.io/) deployed

## 🚀 Quick Start

### Install the Plugin

#### 📦 Install from npm

```bash
npm install @headlamp-k8s/strimzi
```

#### 💾 Manual Installation

1. Download the latest release package (.tgz file)
2. Extract the plugin to your Headlamp plugins directory:

**macOS:**
```bash
mkdir -p ~/Library/Application\ Support/Headlamp/plugins/strimzi
tar -xzf headlamp-k8s-strimzi-*.tgz -C ~/Library/Application\ Support/Headlamp/plugins/strimzi --strip-components=1
```

**Linux:**
```bash
mkdir -p ~/.config/Headlamp/plugins/strimzi
tar -xzf headlamp-k8s-strimzi-*.tgz -C ~/.config/Headlamp/plugins/strimzi --strip-components=1
```

3. Restart Headlamp

#### Using Headlamp Server

```bash
headlamp-server -plugins-dir=/path/to/extracted/plugin
```

## 🛠️ Development

### Building the Plugin

```bash
# Install dependencies
npm install

# Build the plugin
npm run build
```

The build creates a `dist/` directory with:
- `main.js` - Plugin entry point (required by Headlamp)

### Packaging the Plugin

To create a distributable package with all required files:

```bash
npm run package
```

This creates a tarball `headlamp-k8s-strimzi-<version>.tar.gz` containing:
- `strimzi-headlamp/main.js` - Compiled plugin
- `strimzi-headlamp/package.json` - Plugin metadata

### Testing Locally

#### Method 1: Using Headlamp Desktop App

1. Build the plugin:
   ```bash
   npm run build
   ```

2. Install to Headlamp's plugins directory:

   **macOS:**
   ```bash
   mkdir -p ~/Library/Application\ Support/Headlamp/plugins/strimzi
   cp -r dist/* ~/Library/Application\ Support/Headlamp/plugins/strimzi/

   # Create package.json (required)
   cat > ~/Library/Application\ Support/Headlamp/plugins/strimzi/package.json << 'EOF'
   {
     "name": "@headlamp-k8s/strimzi",
     "version": "0.1.0",
     "main": "main.js"
   }
   EOF
   ```

   **Linux:**
   ```bash
   mkdir -p ~/.config/Headlamp/plugins/strimzi
   cp -r dist/* ~/.config/Headlamp/plugins/strimzi/

   # Create package.json (required)
   cat > ~/.config/Headlamp/plugins/strimzi/package.json << 'EOF'
   {
     "name": "@headlamp-k8s/strimzi",
     "version": "0.1.0",
     "main": "main.js"
   }
   EOF
   ```

3. Restart Headlamp completely (quit and reopen)

**Required structure:**
```
plugins/strimzi/
├── main.js          # Entry point (required)
├── package.json     # Plugin metadata (required)
├── components/      # Compiled components
└── other files...
```

### Method 2: Using Headlamp in Development Mode

If you have Headlamp's source code:

```bash
# In Headlamp's repository
cd headlamp

# Set the plugins directory to your plugin's dist folder
export HEADLAMP_PLUGINS_DIR=/path/to/strimzi-headlamp/dist

# Start Headlamp in development mode
make run-frontend
```

### Method 3: Using Headlamp Server with Plugin Directory

```bash
# Build your plugin
npm run build

# Run Headlamp server with plugins directory
headlamp-server -plugins-dir=/path/to/strimzi-headlamp/dist
```

### Method 4: Deploy Headlamp to Kubernetes (Docker Desktop)

Deploy Headlamp with the Strimzi plugin directly to your Kubernetes cluster.

**Step 1: Build and package the plugin**
```bash
npm run build
npm run package

# Extract to plugins directory
mkdir -p plugins
tar -xzf headlamp-k8s-strimzi-*.tar.gz -C plugins/
```

**Step 2: Update the manifest path**

Edit `deploy/headlamp.yaml` and update the hostPath to your plugins directory:
```yaml
volumes:
  - name: plugins
    hostPath:
      path: /path/to/your/strimzi-headlamp/plugins  # Update this path
      type: Directory
```

**Step 3: Deploy**
```bash
kubectl apply -f deploy/headlamp.yaml

# Generate authentication token (valid 24h)
kubectl -n headlamp create token headlamp --duration=24h
```

**Step 4: Access Headlamp**
- URL: http://localhost:30080
- Use the generated token to authenticate

**Alternative: Use port-forward**
```bash
kubectl port-forward -n headlamp svc/headlamp 8080:80
# Access at http://localhost:8080
```

To uninstall: `kubectl delete -f deploy/headlamp.yaml`

## 📊 Supported Strimzi Resources

### Kafka (kafka.strimzi.io/v1beta2)
- View Kafka cluster status and configuration
- Monitor replicas and versions
- Check listener addresses and connection details
- KRaft and ZooKeeper mode detection

### KafkaTopic (kafka.strimzi.io/v1beta2)
- **Create** topics with configurable:
  - Partitions and replicas
  - Retention period
  - Compression type (gzip, snappy, lz4, zstd, producer)
  - Min in-sync replicas
- **Edit** existing topic configurations
- **Delete** topics with confirmation dialog
- View partition and replica counts
- Monitor topic status (Ready/Not Ready)

### KafkaUser (kafka.strimzi.io/v1beta2)
- **Create** users with:
  - SCRAM-SHA-512 or TLS authentication
  - Simple ACL authorization with custom rules
  - Support for topic, group, and cluster resources
- **View secrets**: Display passwords (SCRAM) or certificates/keys (TLS)
- **Delete** users with confirmation dialog
- Monitor user status (Ready/Not Ready)
- View authentication and authorization types


## 📁 Plugin Structure

```
strimzi-headlamp/
├── src/
│   ├── components/       # React components for UI
│   ├── crds.ts          # Strimzi CRD definitions
│   └── index.tsx        # Plugin entry point
├── deploy/              # Kubernetes manifests
│   └── headlamp.yaml    # Headlamp deployment
├── dist/                # Build output
├── package.json
├── tsconfig.json
└── README.md
```

## 📦 Publishing to npm

This plugin is published to npm for easy installation:

```bash
# Login to npm (first time only)
npm login

# Build the plugin
npm run build

# Publish to npm
npm publish --access public
```

The `files` field in `package.json` ensures only these are published:
- `dist/**/*` (compiled JavaScript)
- `README.md`
- `LICENSE`

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Feel free to fork the repository and open a pull request.

## 💬 Support

For support, feature requests, or bug reports, please open an issue in the [GitHub repository](https://github.com/cesaroangelo/strimzi-headlamp/issues).

---

Developed with ❤️ on 🌎 by [Angelo Cesaro](https://angelocesaro.com)

## 📚 Resources

- [Strimzi Documentation](https://strimzi.io/documentation/)
- [Headlamp Plugin Development](https://headlamp.dev/docs/latest/development/plugins/)
- [Apache Kafka](https://kafka.apache.org/)


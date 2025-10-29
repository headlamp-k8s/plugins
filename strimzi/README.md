# Strimzi Headlamp Plugin

A Headlamp plugin for managing Strimzi (Apache Kafka on Kubernetes) resources directly from the Headlamp UI.

## Features

- **Kafka Clusters**: View and manage Kafka cluster resources
- **Kafka Topics**: Monitor and configure Kafka topics
- **Kafka Users**: Manage Kafka users with authentication and authorization
- Real-time status monitoring for all Strimzi resources
- Detailed views with configuration and status information

## Prerequisites

- [Headlamp](https://headlamp.dev/) installed
- A Kubernetes cluster with [Strimzi operator](https://strimzi.io/) deployed
  - See [strimzi/](strimzi/) for ready-to-use Strimzi deployment configurations

## Quick Start

### 1. Deploy Strimzi Operator and Kafka

#### Using Helper Scripts (Recommended)

```bash
# Install Strimzi operator
./deploy-strimzi.sh install-operator

# List available configurations
./deploy-strimzi.sh list-configs

# Deploy a Kafka cluster
./deploy-strimzi.sh deploy single          # Single node for development
./deploy-strimzi.sh deploy dual-role       # 3 nodes for production
./deploy-strimzi.sh deploy separated       # Full production topology

# Check status
./deploy-strimzi.sh status
```

#### Manual Deployment

```bash
# Install Strimzi operator
cd strimzi/operator
./install.sh

# Deploy a Kafka cluster (choose a configuration)
kubectl apply -f ../configurations/single-node/kafka-single-node.yaml -n kafka
```

See [strimzi/](strimzi/) directory for more deployment options.

### 2. Install the Plugin

#### Install from npm

```bash
npm install @headlamp-k8s/plugin-strimzi
```

#### Manual Installation

1. Download the latest release package (.tgz file)
2. Extract the plugin to your Headlamp plugins directory:

**macOS:**
```bash
mkdir -p ~/Library/Application\ Support/Headlamp/plugins/strimzi
tar -xzf headlamp-k8s-plugin-strimzi-*.tgz -C ~/Library/Application\ Support/Headlamp/plugins/strimzi --strip-components=1
```

**Linux:**
```bash
mkdir -p ~/.config/Headlamp/plugins/strimzi
tar -xzf headlamp-k8s-plugin-strimzi-*.tgz -C ~/.config/Headlamp/plugins/strimzi --strip-components=1
```

3. Restart Headlamp

#### Using Headlamp Server

```bash
headlamp-server -plugins-dir=/path/to/extracted/plugin
```

## Development

### Building the Plugin

```bash
# Install dependencies
npm install

# Build the plugin
npm run build
```

The build creates a `dist/` directory with:
- `main.js` - Plugin entry point (required by Headlamp)
- `components/` - Compiled React components
- Other compiled files

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
     "name": "@headlamp-k8s/plugin-strimzi",
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
     "name": "@headlamp-k8s/plugin-strimzi",
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

## Supported Strimzi Resources

### Kafka (kafka.strimzi.io/v1beta2)
- View Kafka cluster status and configuration
- Monitor replicas and versions
- Check listener addresses and connection details

### KafkaTopic (kafka.strimzi.io/v1beta2)
- List all Kafka topics in the cluster
- View partition and replica counts
- Monitor topic configuration

### KafkaUser (kafka.strimzi.io/v1beta2)
- Manage Kafka users
- View authentication methods
- Monitor authorization rules and quotas

## Strimzi Deployment Configurations

This repository includes ready-to-use Kafka deployment configurations in the [strimzi/](strimzi/) directory:

- **Operator Installation**: Scripts to install/uninstall Strimzi operator
- **Single Node**: Development configuration with 1 broker/controller
- **3 Dual-Role Nodes**: Small production setup with high availability
- **3 Controllers + 3 Brokers**: Full production topology with separated roles
- **Ephemeral**: Quick testing configuration without persistence
- **Monitoring**: Prometheus metrics configurations

### Helper Scripts

Two helper scripts are provided for easy management:

**deploy-strimzi.sh** - Deploy and manage Strimzi:
```bash
./deploy-strimzi.sh install-operator    # Install operator
./deploy-strimzi.sh list-configs        # List available configs
./deploy-strimzi.sh deploy <config>     # Deploy Kafka cluster
./deploy-strimzi.sh status              # Check status
```

**cleanup-strimzi.sh** - Clean up resources:
```bash
./cleanup-strimzi.sh cluster            # Delete cluster (keep data)
./cleanup-strimzi.sh cluster-all        # Delete cluster and data
./cleanup-strimzi.sh operator           # Uninstall operator (keep data)
./cleanup-strimzi.sh operator-all       # Uninstall operator and delete data
./cleanup-strimzi.sh everything         # Remove everything
```

See [strimzi/README.md](strimzi/README.md) for detailed deployment instructions.

## Plugin Structure

```
strimzi-headlamp/
├── src/
│   ├── components/       # React components for UI
│   ├── crds.ts          # Strimzi CRD definitions
│   └── index.tsx        # Plugin entry point
├── strimzi/             # Kafka deployment configurations
│   ├── operator/        # Operator installation scripts
│   ├── configurations/  # Various Kafka cluster configs
│   └── monitoring/      # Prometheus metrics setup
├── dist/                # Build output
├── deploy-strimzi.sh    # Helper script for deployment
├── cleanup-strimzi.sh   # Helper script for cleanup
├── package.json
├── tsconfig.json
└── README.md
```

## License

This software is proprietary and closed-source. See [LICENSE](LICENSE) and [EULA.md](EULA.md) for details.

All rights reserved. Copyright (c) 2025 Angelo Cesaro.

## Support and Contact

For support, feature requests, or licensing inquiries:
- Open an issue in the GitHub repository
- Email: [your-email@example.com]

## Resources

- [Strimzi Documentation](https://strimzi.io/documentation/)
- [Headlamp Plugin Development](https://headlamp.dev/docs/latest/development/plugins/)
- [Apache Kafka](https://kafka.apache.org/)

## Support

For issues and questions:
- Open an issue in this repository
- Check Strimzi documentation for operator-related questions
- Visit Headlamp documentation for plugin development questions

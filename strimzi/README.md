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

## Installation

### Install from npm

```bash
npm install @headlamp-k8s/plugin-strimzi
```

### Manual Installation

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

**Windows:**
```powershell
mkdir %APPDATA%\Headlamp\plugins\strimzi
# Extract the .tgz file to this directory
```

3. Restart Headlamp

### Using Headlamp Server

```bash
headlamp-server -plugins-dir=/path/to/extracted/plugin
```

## Testing Locally

### Method 1: Using Headlamp Desktop App

1. Build the plugin:
   ```bash
   npm run build
   ```

2. Copy the plugin to Headlamp's plugins directory:
   - **Linux**: `~/.config/Headlamp/plugins/`
   - **macOS**: `~/Library/Application Support/Headlamp/plugins/`
   - **Windows**: `%APPDATA%\Headlamp\plugins\`

3. Create a folder for your plugin:
   ```bash
   # macOS example
   mkdir -p ~/Library/Application\ Support/Headlamp/plugins/strimzi
   cp -r dist/* ~/Library/Application\ Support/Headlamp/plugins/strimzi/
   ```

4. Restart Headlamp

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

## Plugin Structure

```
strimzi-headlamp/
├── src/
│   ├── components/       # React components for UI
│   ├── crds.ts          # Strimzi CRD definitions
│   └── index.tsx        # Plugin entry point
├── dist/                # Build output
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

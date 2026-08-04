# Velero Headlamp Plugin

A UI plugin for Headlamp to view and manage Velero Backup and Restore resources.

## Overview
This plugin integrates Velero, the widely adopted CNCF project for Kubernetes backup, restore, and disaster recovery, directly into the Headlamp dashboard. It allows operators to monitor their cluster backups without relying on the CLI.

## Installation
Currently, this plugin can be installed by compiling it locally or by installing a pre-packaged build into your Headlamp `plugins` directory. 

## Running locally

### Prerequisites
1. Node.js (v20+)
2. Headlamp running locally

### Development
```bash
npm install
npm start
```
This will start a dev server that proxies to your local Headlamp backend.

## Building
To build a production version of the plugin:
```bash
npm run build
```
This creates a `dist` folder. To extract it for direct injection into a Headlamp container:
```bash
npm run package
```

## Folder Structure
- `src/resources/`: Contains the KubeObject models mapping to the Velero API (e.g. `Backup`).
- `src/components/`: React components matching the standard Headlamp layout and lists.
- `src/index.tsx`: Main entrypoint for sidebar and route registration.

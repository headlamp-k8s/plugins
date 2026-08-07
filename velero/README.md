# Velero Backup Management Plugin for Headlamp

This plugin provides a comprehensive user interface for **Velero** (`velero.io/v1`) backup, restore, schedule, and storage location management directly within [Headlamp](https://headlamp.dev).

## Features
- **Overview Dashboard:** Health status summary of Backups, Restores, Schedules, and Storage Locations.
- **Backups View:** List and inspect Kubernetes backups, trigger on-demand backups with namespace selection, TTL, and volume snapshot options.
- **Restores View:** List restores, track phase progress, and trigger restores from existing backups.
- **Schedules View:** Monitor recurring cron schedules and last backup execution times.
- **Storage Locations View:** View BackupStorageLocations (S3, MinIO, GCP, Azure) and VolumeSnapshotLocations.

## Development

```bash
# Install dependencies
npm install

# Start plugin in development mode
npm run start

# Build plugin package
npm run build

# Run unit tests
npm test
```

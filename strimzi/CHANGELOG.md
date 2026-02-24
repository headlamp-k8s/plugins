# Changelog

All notable changes to this project will be documented in this file.

## [0.3.8] - 2026-02-24

### Changed
- Automated Artifact Hub metadata update on release (version, date, archive URL, checksum)

## [0.3.7] - 2026-02-16

### Added
- Artifact Hub badge in README
- Demo video in README

### Changed
- Cleaned up repository documentation

## [0.3.1 - 0.3.6] - 2026-02-16

### Fixed
- Release workflow fixes (package name, npm publish configuration)

## [0.3.0] - 2025-01-30

### Added
- Namespace filter dropdown on all resource lists
- Cluster selection dropdown in Create Topic and Create User dialogs
- Minimal RBAC deployment configuration for production environments

### Changed
- Improved sidebar icon (streamline-ultimate:share)
- Updated deployment documentation

## [0.2.8] - 2025-01-28

### Fixed
- Namespace filter functionality across all components

## [0.2.7] - 2025-01-28

### Changed
- Replaced HTML buttons with Material-UI Button components for consistency

## [0.2.6] - 2025-01-28

### Changed
- Updated headlamp-plugin SDK to stable 0.13.0
- Fixed cluster link styling

## [0.2.5] - 2025-01-28

### Fixed
- ReactFlow attribution badge now theme-aware

## [0.2.4] - 2025-01-28

### Fixed
- Icon colors and badge text contrast in dark mode
- Replaced hardcoded colors with theme-aware palette

## [0.2.3] - 2025-01-28

### Fixed
- Kafka Replicas column display in cluster list
- Toast notifications now consistent across all components

## [0.2.2] - 2025-01-28

### Fixed
- Topology visualization in light mode
- Grid dots visibility in light mode
- Pod blocks visibility in light mode

## [0.2.1] - 2025-01-28

### Added
- Progressive background opacity for nested topology blocks
- Replica counts and ready status in topology view

### Fixed
- KafkaNodePool positioning for consistent layout
- ESLint warnings (removed unused variables)

## [0.2.0] - 2025-01-27

### Added
- Headlamp theme system integration with Kafka topology visualization
- Dynamic pod sizing in topology visualization
- Namespace wrapper in topology view
- Custom ReactFlow controls

### Fixed
- Topology centered at 1:1 scale without auto-zoom
- Improved ReactFlow controls and attribution visibility
- Removed MiniMap (incompatible with group nodes)

### Changed
- Refactored topology view to use modal instead of dedicated page
- Updated topology labels to show type and name on two lines

## [0.1.0] - 2025-01-27

Initial release.

### Features
- Kafka cluster visualization (KRaft/ZooKeeper detection)
- KafkaTopic CRUD operations
- KafkaUser management (SCRAM-SHA-512, TLS, ACLs)
- Search and filtering
- Secure credential display with warnings
- Topology visualization

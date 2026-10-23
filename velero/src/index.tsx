/**
 * Velero plugin entry point — Phase 1 coverage panels, Phase 2 Schedules/Backups/
 * Restores, Phase 3 BSL/VSL/BackupRepository + CSI datamover detail sections.
 */
import {
  registerDetailsViewSectionsProcessor,
  registerPluginSettings,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import type Deployment from '@kinvolk/headlamp-plugin/lib/K8s/deployment';
import type Namespace from '@kinvolk/headlamp-plugin/lib/K8s/namespace';
import type PersistentVolumeClaim from '@kinvolk/headlamp-plugin/lib/K8s/persistentVolumeClaim';
import type StatefulSet from '@kinvolk/headlamp-plugin/lib/K8s/statefulSet';
import {
  DeploymentBackupCoveragePanel,
  NamespaceVeleroBackupCoveragePanel,
  PersistentVolumeClaimBackupCoveragePanel,
  StatefulSetBackupCoveragePanel,
} from './components/BackupCoveragePanel';
import BackupRepositoryDetail from './components/backuprepositories/Detail';
import BackupRepositoryList from './components/backuprepositories/List';
import BackupDetail from './components/backups/Detail';
import BackupList from './components/backups/List';
import BslDetail from './components/bsl/Detail';
import BslList from './components/bsl/List';
import RestoreDetail from './components/restores/Detail';
import RestoreList from './components/restores/List';
import ScheduleDetail from './components/schedules/Detail';
import ScheduleList from './components/schedules/List';
import VslDetail from './components/vsl/Detail';
import VslList from './components/vsl/List';
import { PLUGIN_NAME } from './config';
import { Settings } from './settings';
import { veleroRouteNames, veleroRoutePaths } from './utils/veleroRoutes';
import { registerVeleroIcon, veleroIconName } from './veleroIcon';

registerPluginSettings(PLUGIN_NAME, Settings, true);
registerVeleroIcon();

// ---- Phase 2 + 3: sidebar + routes ----

registerSidebarEntry({
  parent: null,
  name: 'velero',
  label: 'Velero',
  icon: veleroIconName,
  url: veleroRoutePaths.schedulesList,
});

registerSidebarEntry({
  parent: 'velero',
  name: 'velero-schedules',
  label: 'Schedules',
  url: veleroRoutePaths.schedulesList,
});

registerSidebarEntry({
  parent: 'velero',
  name: 'velero-backups',
  label: 'Backups',
  url: veleroRoutePaths.backupsList,
});

registerSidebarEntry({
  parent: 'velero',
  name: 'velero-restores',
  label: 'Restores',
  url: veleroRoutePaths.restoresList,
});

registerSidebarEntry({
  parent: 'velero',
  name: 'velero-bsl',
  label: 'Storage Locations',
  url: veleroRoutePaths.bslList,
});

registerSidebarEntry({
  parent: 'velero',
  name: 'velero-vsl',
  label: 'Volume Snapshots',
  url: veleroRoutePaths.vslList,
});

registerSidebarEntry({
  parent: 'velero',
  name: 'velero-backuprepositories',
  label: 'Backup Repositories',
  url: veleroRoutePaths.backupRepositoriesList,
});

registerRoute({
  path: veleroRoutePaths.schedulesList,
  sidebar: 'velero-schedules',
  name: veleroRouteNames.schedulesList,
  exact: true,
  component: () => <ScheduleList />,
});

registerRoute({
  path: veleroRoutePaths.scheduleDetail,
  sidebar: 'velero-schedules',
  name: veleroRouteNames.scheduleDetail,
  exact: true,
  component: () => <ScheduleDetail />,
});

registerRoute({
  path: veleroRoutePaths.backupsList,
  sidebar: 'velero-backups',
  name: veleroRouteNames.backupsList,
  exact: true,
  component: () => <BackupList />,
});

registerRoute({
  path: veleroRoutePaths.backupDetail,
  sidebar: 'velero-backups',
  name: veleroRouteNames.backupDetail,
  exact: true,
  component: () => <BackupDetail />,
});

registerRoute({
  path: veleroRoutePaths.restoresList,
  sidebar: 'velero-restores',
  name: veleroRouteNames.restoresList,
  exact: true,
  component: () => <RestoreList />,
});

registerRoute({
  path: veleroRoutePaths.restoreDetail,
  sidebar: 'velero-restores',
  name: veleroRouteNames.restoreDetail,
  exact: true,
  component: () => <RestoreDetail />,
});

registerRoute({
  path: veleroRoutePaths.bslList,
  sidebar: 'velero-bsl',
  name: veleroRouteNames.bslList,
  exact: true,
  component: () => <BslList />,
});

registerRoute({
  path: veleroRoutePaths.bslDetail,
  sidebar: 'velero-bsl',
  name: veleroRouteNames.bslDetail,
  exact: true,
  component: () => <BslDetail />,
});

registerRoute({
  path: veleroRoutePaths.vslList,
  sidebar: 'velero-vsl',
  name: veleroRouteNames.vslList,
  exact: true,
  component: () => <VslList />,
});

registerRoute({
  path: veleroRoutePaths.vslDetail,
  sidebar: 'velero-vsl',
  name: veleroRouteNames.vslDetail,
  exact: true,
  component: () => <VslDetail />,
});

registerRoute({
  path: veleroRoutePaths.backupRepositoriesList,
  sidebar: 'velero-backuprepositories',
  name: veleroRouteNames.backupRepositoriesList,
  exact: true,
  component: () => <BackupRepositoryList />,
});

registerRoute({
  path: veleroRoutePaths.backupRepositoryDetail,
  sidebar: 'velero-backuprepositories',
  name: veleroRouteNames.backupRepositoryDetail,
  exact: true,
  component: () => <BackupRepositoryDetail />,
});

// ---- Phase 1: detail-view coverage panels ----

const VELERO_COVERAGE_SECTION_ID = 'velero-backup-coverage';
registerDetailsViewSectionsProcessor(function addVeleroBackupCoverageSection(resource, sections) {
  if (resource?.kind === 'Deployment') {
    sections.push({
      id: VELERO_COVERAGE_SECTION_ID,
      section: <DeploymentBackupCoveragePanel resource={resource as Deployment} />,
    });
  }

  if (resource?.kind === 'StatefulSet') {
    sections.push({
      id: VELERO_COVERAGE_SECTION_ID,
      section: <StatefulSetBackupCoveragePanel resource={resource as StatefulSet} />,
    });
  }

  if (resource?.kind === 'PersistentVolumeClaim') {
    sections.push({
      id: VELERO_COVERAGE_SECTION_ID,
      section: (
        <PersistentVolumeClaimBackupCoveragePanel resource={resource as PersistentVolumeClaim} />
      ),
    });
  }

  if (resource?.kind === 'Namespace') {
    sections.push({
      id: VELERO_COVERAGE_SECTION_ID,
      section: <NamespaceVeleroBackupCoveragePanel resource={resource as Namespace} />,
    });
  }

  return sections;
});

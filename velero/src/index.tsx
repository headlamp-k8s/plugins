/**
 * Velero plugin entry point — Phase 1 coverage panels on resource detail views,
 * plus Phase 2 cluster-wide Schedules, Backups, and coverage-gap pages.
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
import BackupDetail from './components/backups/Detail';
import BackupList from './components/backups/List';
import {
  DeploymentBackupCoveragePanel,
  NamespaceVeleroBackupCoveragePanel,
  PersistentVolumeClaimBackupCoveragePanel,
  StatefulSetBackupCoveragePanel,
} from './components/BackupCoveragePanel';
import CoverageGaps from './components/coverage/CoverageGaps';
import ScheduleDetail from './components/schedules/Detail';
import ScheduleList from './components/schedules/List';
import { PLUGIN_NAME } from './config';
import { Settings } from './settings';
import { veleroRouteNames, veleroRoutePaths } from './utils/veleroRoutes';
import { registerVeleroIcon, veleroIconName } from './veleroIcon';

registerPluginSettings(PLUGIN_NAME, Settings, true);
registerVeleroIcon();

// ---- Phase 2: sidebar + routes ----

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
  name: 'velero-coverage-gaps',
  label: 'Coverage gaps',
  url: veleroRoutePaths.coverageGaps,
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
  path: veleroRoutePaths.coverageGaps,
  sidebar: 'velero-coverage-gaps',
  name: veleroRouteNames.coverageGaps,
  exact: true,
  component: () => <CoverageGaps />,
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

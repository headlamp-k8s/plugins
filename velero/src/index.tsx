import {
  registerDetailsViewSectionsProcessor,
  registerPluginSettings,
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
import { PLUGIN_NAME } from './config';
import { Settings } from './settings';

registerPluginSettings(PLUGIN_NAME, Settings, true);

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

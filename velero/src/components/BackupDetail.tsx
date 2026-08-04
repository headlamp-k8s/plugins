import {
  DateLabel,
  DetailsGrid,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { Backup } from '../resources/backup';
import { joinOrDash } from '../resources/common';
import { PhaseLabel } from './common/PhaseLabel';

/**
 * Detail view for a single Velero Backup.
 *
 * The top part shows the phase and what the backup covers, then a second
 * section shows the timing and counters Velero fills in while it runs.
 */
export function BackupDetail() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  return (
    <DetailsGrid
      resourceType={Backup}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={backup =>
        backup && [
          {
            name: 'Phase',
            value: <PhaseLabel phase={backup.phase} />,
          },
          {
            name: 'Storage Location',
            value: backup.spec.storageLocation ?? '-',
          },
          {
            name: 'TTL',
            value: backup.spec.ttl ?? '-',
          },
          {
            name: 'Included Namespaces',
            value: joinOrDash(backup.spec.includedNamespaces),
          },
          {
            name: 'Excluded Namespaces',
            value: joinOrDash(backup.spec.excludedNamespaces),
          },
          {
            name: 'Included Resources',
            value: joinOrDash(backup.spec.includedResources),
          },
          {
            name: 'Excluded Resources',
            value: joinOrDash(backup.spec.excludedResources),
          },
          {
            name: 'Snapshot Volumes',
            value: backup.spec.snapshotVolumes ? 'Yes' : 'No',
          },
          {
            name: 'Include Cluster Resources',
            value: backup.spec.includeClusterResources ? 'Yes' : 'No',
          },
        ]
      }
      extraSections={backup =>
        backup && [
          {
            id: 'velero-backup-status',
            section: (
              <SectionBox title="Status">
                <NameValueTable
                  rows={[
                    {
                      name: 'Started',
                      value: backup.status.startTimestamp ? (
                        <DateLabel date={backup.status.startTimestamp} />
                      ) : (
                        '-'
                      ),
                    },
                    {
                      name: 'Completed',
                      value: backup.status.completionTimestamp ? (
                        <DateLabel date={backup.status.completionTimestamp} />
                      ) : (
                        '-'
                      ),
                    },
                    {
                      name: 'Expiration',
                      value: backup.status.expiration ? (
                        <DateLabel date={backup.status.expiration} />
                      ) : (
                        '-'
                      ),
                    },
                    {
                      name: 'Items Backed Up',
                      value: backup.status.progress
                        ? `${backup.status.progress.itemsBackedUp ?? 0} / ${
                            backup.status.progress.totalItems ?? 0
                          }`
                        : '-',
                    },
                    {
                      name: 'Errors',
                      value: (backup.status.errors ?? 0).toString(),
                    },
                    {
                      name: 'Warnings',
                      value: (backup.status.warnings ?? 0).toString(),
                    },
                    {
                      name: 'Failure Reason',
                      value: backup.status.failureReason ?? '-',
                    },
                    {
                      name: 'Validation Errors',
                      value: joinOrDash(backup.status.validationErrors),
                    },
                  ]}
                />
              </SectionBox>
            ),
          },
        ]
      }
    />
  );
}

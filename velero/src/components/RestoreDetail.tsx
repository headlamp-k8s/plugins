import {
  DateLabel,
  DetailsGrid,
  Link,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { joinOrDash } from '../resources/common';
import { Restore } from '../resources/restore';
import { PhaseLabel } from './common/PhaseLabel';

/**
 * Detail view for a single Velero Restore. Shows which backup it restores
 * from, what it covers, and the warnings/errors Velero reported.
 */
export function RestoreDetail() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  return (
    <DetailsGrid
      resourceType={Restore}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={restore =>
        restore && [
          {
            name: 'Phase',
            value: <PhaseLabel phase={restore.phase} />,
          },
          {
            name: 'Backup Name',
            value: restore.backupName ? (
              <Link
                routeName="veleroBackupDetail"
                params={{ namespace: restore.metadata.namespace, name: restore.backupName }}
              >
                {restore.backupName}
              </Link>
            ) : (
              '-'
            ),
          },
          {
            name: 'Schedule Name',
            value: restore.spec.scheduleName ?? '-',
          },
          {
            name: 'Included Namespaces',
            value: joinOrDash(restore.spec.includedNamespaces),
          },
          {
            name: 'Excluded Namespaces',
            value: joinOrDash(restore.spec.excludedNamespaces),
          },
          {
            name: 'Included Resources',
            value: joinOrDash(restore.spec.includedResources),
          },
          {
            name: 'Excluded Resources',
            value: joinOrDash(restore.spec.excludedResources),
          },
          {
            name: 'Restore PVs',
            value: restore.spec.restorePVs ? 'Yes' : 'No',
          },
        ]
      }
      extraSections={restore =>
        restore && [
          {
            id: 'velero-restore-status',
            section: (
              <SectionBox title="Status">
                <NameValueTable
                  rows={[
                    {
                      name: 'Started',
                      value: restore.status.startTimestamp ? (
                        <DateLabel date={restore.status.startTimestamp} />
                      ) : (
                        '-'
                      ),
                    },
                    {
                      name: 'Completed',
                      value: restore.status.completionTimestamp ? (
                        <DateLabel date={restore.status.completionTimestamp} />
                      ) : (
                        '-'
                      ),
                    },
                    {
                      name: 'Items Restored',
                      value: restore.status.progress
                        ? `${restore.status.progress.itemsRestored ?? 0} / ${
                            restore.status.progress.totalItems ?? 0
                          }`
                        : '-',
                    },
                    {
                      name: 'Warnings',
                      value: (restore.status.warnings ?? 0).toString(),
                    },
                    {
                      name: 'Errors',
                      value: (restore.status.errors ?? 0).toString(),
                    },
                    {
                      name: 'Failure Reason',
                      value: restore.status.failureReason ?? '-',
                    },
                    {
                      name: 'Validation Errors',
                      value: joinOrDash(restore.status.validationErrors),
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

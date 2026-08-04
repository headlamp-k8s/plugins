import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Backup } from '../../resources/backup';

export function BackupList() {
  return (
    <ResourceListView
      title="Backups"
      resourceClass={Backup}
      columns={[
        'name',
        'namespace',
        {
          id: 'phase',
          label: 'Phase',
          getValue: (backup: Backup) => backup.phase,
        },
        {
          id: 'storageLocation',
          label: 'Storage Location',
          getValue: (backup: Backup) => backup.storageLocation,
        },
        'age',
      ]}
    />
  );
}

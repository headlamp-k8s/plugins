import { Link, ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { VolcanoJobTemplate } from '../../resources/jobtemplate';
import { VolcanoFlowInstallCheck } from '../common/CommonComponents';

/**
 * Renders the Volcano JobTemplates list page.
 *
 * @returns JobTemplates resource list view.
 */
export default function JobTemplateList() {
  return (
    <VolcanoFlowInstallCheck>
      <ResourceListView
        title="Volcano JobTemplates"
        resourceClass={VolcanoJobTemplate}
        columns={[
          'name',
          'namespace',
          {
            id: 'queue',
            label: 'Queue',
            getValue: (jobTemplate: VolcanoJobTemplate) => jobTemplate.queue,
            render: (jobTemplate: VolcanoJobTemplate) => (
              <Link routeName="volcano-queue-detail" params={{ name: jobTemplate.queue }}>
                {jobTemplate.queue}
              </Link>
            ),
          },
          {
            id: 'scheduler',
            label: 'Scheduler',
            getValue: (jobTemplate: VolcanoJobTemplate) => jobTemplate.schedulerName,
          },
          {
            id: 'min-available',
            label: 'Min Available',
            getValue: (jobTemplate: VolcanoJobTemplate) => jobTemplate.minAvailable,
          },
          {
            id: 'min-success',
            label: 'Min Success',
            getValue: (jobTemplate: VolcanoJobTemplate) => jobTemplate.minSuccess,
          },
          {
            id: 'max-retry',
            label: 'Max Retry',
            getValue: (jobTemplate: VolcanoJobTemplate) => jobTemplate.maxRetry,
          },
          {
            id: 'tasks',
            label: 'Tasks',
            getValue: (jobTemplate: VolcanoJobTemplate) => jobTemplate.taskCount,
          },
          {
            id: 'generated-jobs',
            label: 'Generated Jobs',
            getValue: (jobTemplate: VolcanoJobTemplate) => jobTemplate.generatedJobCount,
          },
          'age',
        ]}
      />
    </VolcanoFlowInstallCheck>
  );
}

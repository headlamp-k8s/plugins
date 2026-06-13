import {
  type ColumnType,
  ResourceListView,
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { normalizeState } from '../../resources/common';
import { Template } from '../../resources/template';
import { fallback, renderStatus } from '../common/listHelpers';

function countTemplateSteps(data: string | undefined): number | undefined {
  if (!data) {
    return undefined;
  }

  const lines = data.split('\n');
  const tasksIndex = lines.findIndex(line => /^\s*tasks:\s*$/.test(line));
  if (tasksIndex === -1) {
    return undefined;
  }

  const tasksIndent = lines[tasksIndex].search(/\S/);
  const taskNameIndents: number[] = [];

  for (const line of lines.slice(tasksIndex + 1)) {
    if (!line.trim()) {
      continue;
    }

    const indent = line.search(/\S/);
    if (indent <= tasksIndent) {
      break;
    }

    if (/^\s*-\s+name:/.test(line)) {
      taskNameIndents.push(indent);
    }
  }

  const topLevelTaskIndent = Math.min(...taskNameIndents);
  return taskNameIndents.filter(indent => indent === topLevelTaskIndent).length;
}

export function TemplateList() {
  const columns: (ColumnType | ResourceTableColumn<Template>)[] = [
    'name',
    'namespace',
    {
      id: 'status',
      label: 'Status',
      getValue: item => normalizeState(item.status?.state),
      render: item => renderStatus(normalizeState(item.status?.state)),
    },
    {
      id: 'steps',
      label: 'Steps',
      getValue: item => fallback(countTemplateSteps(item.data)),
    },
    {
      id: 'data',
      label: 'Template Data',
      getValue: item => fallback(item.data ? `${item.data.length} chars` : undefined),
    },
    'age',
  ];

  return (
    <ResourceListView
      title="Templates"
      resourceClass={Template}
      columns={columns}
      reflectInURL="tinkerbell-templates"
      id="tinkerbell-templates"
    />
  );
}

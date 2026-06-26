import {
  DetailsGrid,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { normalizeState } from '../../resources/common';
import { Template } from '../../resources/template';
import { fallback, renderTextSection, statusValue } from '../common/detailHelpers';

/** Parsed summary for one task in a Tinkerbell template. */
interface ParsedTemplateTask {
  /** Task name from the template data. */
  name: string;
  /** Worker selector or worker value used by the task. */
  worker?: string;
  /** Number of actions parsed for this task. */
  actionCount: number;
  /** Number of volume entries parsed for this task. */
  volumeCount: number;
}

/** Parsed summary for one action in a Tinkerbell template task. */
interface ParsedTemplateAction {
  /** Name of the parent task that contains this action. */
  taskName: string;
  /** Action name from the template data. */
  name: string;
  /** Container image used by the action, when present. */
  image?: string;
  /** Action timeout value, when present. */
  timeout?: string;
}

/** Best-effort parsed summary of template YAML stored in `spec.data`. */
interface ParsedTemplate {
  /** Template name from the embedded template YAML. */
  name?: string;
  /** Global timeout from the embedded template YAML. */
  globalTimeout?: string;
  /** Parsed task summaries. */
  tasks: ParsedTemplateTask[];
  /** Parsed action summaries across all tasks. */
  actions: ParsedTemplateAction[];
}

/**
 * Parses the common Tinkerbell template fields used in the detail summary.
 *
 * @param data - Template YAML stored in `spec.data`.
 * @returns A best-effort parsed template summary.
 */
function parseTemplateData(data: string | undefined): ParsedTemplate {
  if (!data) {
    return { tasks: [], actions: [] };
  }

  const lines = data.split('\n');
  const templateName = lines
    .find(line => /^\s*name:\s*/.test(line))
    ?.split(/name:\s*/)[1]
    ?.trim();
  const globalTimeout = lines
    .find(line => /^\s*global_timeout:\s*/.test(line))
    ?.split(/global_timeout:\s*/)[1]
    ?.trim();
  const tasksIndex = lines.findIndex(line => /^\s*tasks:\s*$/.test(line));

  if (tasksIndex === -1) {
    return { name: templateName, globalTimeout, tasks: [], actions: [] };
  }

  const tasksIndent = lines[tasksIndex].search(/\S/);
  const taskEntries: { lineIndex: number; indent: number; name: string }[] = [];

  for (const [offset, line] of lines.slice(tasksIndex + 1).entries()) {
    if (!line.trim()) {
      continue;
    }

    const indent = line.search(/\S/);
    if (indent <= tasksIndent) {
      break;
    }

    const name = line.match(/^\s*-\s+name:\s*"?([^"]+)"?/)?.[1];
    if (name) {
      taskEntries.push({ lineIndex: tasksIndex + 1 + offset, indent, name });
    }
  }

  const taskIndent = Math.min(...taskEntries.map(task => task.indent));
  const topLevelTasks = taskEntries.filter(task => task.indent === taskIndent);
  const tasks = topLevelTasks.map((task, index) => {
    const nextTask = topLevelTasks[index + 1];
    const taskLines = lines.slice(task.lineIndex, nextTask?.lineIndex);
    const worker = taskLines
      .find(line => /^\s*worker:\s*/.test(line))
      ?.split(/worker:\s*/)[1]
      ?.replace(/"/g, '')
      ?.trim();

    return {
      name: task.name,
      worker,
      actionCount: taskLines.filter(line => /^\s*-\s+name:/.test(line)).length - 1,
      volumeCount: taskLines.filter(line => /^\s*-\s+[^:]+:[^/]*\//.test(line)).length,
    };
  });

  const actions = topLevelTasks.flatMap((task, index) => {
    const nextTask = topLevelTasks[index + 1];
    const taskLines = lines.slice(task.lineIndex, nextTask?.lineIndex);

    return taskLines.reduce<ParsedTemplateAction[]>((actions, line, lineIndex) => {
      const actionName = line.match(/^\s*-\s+name:\s*"?([^"]+)"?/)?.[1];
      if (!actionName || lineIndex === 0) {
        return actions;
      }

      const followingLines = taskLines.slice(lineIndex, lineIndex + 8);
      actions.push({
        taskName: task.name,
        name: actionName,
        image: followingLines
          .find(nextLine => /^\s*image:\s*/.test(nextLine))
          ?.split(/image:\s*/)[1]
          ?.trim(),
        timeout: followingLines
          .find(nextLine => /^\s*timeout:\s*/.test(nextLine))
          ?.split(/timeout:\s*/)[1]
          ?.trim(),
      });

      return actions;
    }, []);
  });

  return { name: templateName, globalTimeout, tasks, actions };
}

/**
 * Renders the Tinkerbell Template detail view.
 *
 * @returns Template detail page with summary, parsed tasks, actions, and raw data.
 */
export function TemplateDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <DetailsGrid
      resourceType={Template}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={item => {
        const parsedTemplate = parseTemplateData(item?.data);

        return item
          ? [
              { name: 'Status', value: statusValue(normalizeState(item.status?.state)) },
              { name: 'Template Name', value: fallback(parsedTemplate.name) },
              { name: 'Global Timeout', value: fallback(parsedTemplate.globalTimeout) },
              { name: 'Tasks', value: fallback(parsedTemplate.tasks.length) },
              { name: 'Actions', value: fallback(parsedTemplate.actions.length) },
              { name: 'Template Data Size', value: fallback(`${item.data?.length ?? 0} chars`) },
            ]
          : [];
      }}
      extraSections={item => {
        const parsedTemplate = parseTemplateData(item?.data);

        return item
          ? [
              {
                id: 'tinkerbell.template-summary',
                section: (
                  <SectionBox title="Template Summary">
                    <NameValueTable
                      rows={[
                        { name: 'Name', value: fallback(parsedTemplate.name) },
                        { name: 'Global Timeout', value: fallback(parsedTemplate.globalTimeout) },
                        { name: 'Tasks', value: fallback(parsedTemplate.tasks.length) },
                        { name: 'Actions', value: fallback(parsedTemplate.actions.length) },
                      ]}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'tinkerbell.template-tasks',
                section: (
                  <SectionBox title="Tasks">
                    <SimpleTable
                      columns={[
                        { label: 'Name', getter: row => row.name },
                        { label: 'Worker', getter: row => fallback(row.worker) },
                        { label: 'Actions', getter: row => fallback(row.actionCount) },
                        { label: 'Volumes', getter: row => fallback(row.volumeCount) },
                      ]}
                      data={parsedTemplate.tasks}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'tinkerbell.template-actions',
                section: (
                  <SectionBox title="Actions">
                    <SimpleTable
                      columns={[
                        { label: 'Task', getter: row => row.taskName },
                        { label: 'Action', getter: row => row.name },
                        { label: 'Image', getter: row => fallback(row.image) },
                        { label: 'Timeout', getter: row => fallback(row.timeout) },
                      ]}
                      data={parsedTemplate.actions}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'tinkerbell.template-data',
                section: renderTextSection('Raw Template Data', item.data),
              },
            ]
          : [];
      }}
    />
  );
}

/** Parsed summary for one task in a Tinkerbell template. */
export interface ParsedTemplateTask {
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
export interface ParsedTemplateAction {
  /** Name of the parent task that contains this action. */
  taskName: string;
  /** Action name from the template data. */
  name: string;
  /** Alternative action names controlled by template conditionals. */
  alternatives?: string[];
  /** Template conditional expression that chooses the alternatives. */
  condition?: string;
  /** Container image used by the action, when present. */
  image?: string;
  /** Action timeout value, when present. */
  timeout?: string;
}

/** Best-effort parsed summary of template YAML stored in `spec.data`. */
export interface ParsedTemplate {
  /** Template name from the embedded template YAML. */
  name?: string;
  /** Global timeout from the embedded template YAML. */
  globalTimeout?: string;
  /** Parsed task summaries. */
  tasks: ParsedTemplateTask[];
  /** Parsed action summaries across all tasks. */
  actions: ParsedTemplateAction[];
  /** Unique container images referenced by parsed actions. */
  images: string[];
}

/** Parsed template control-flow marker. */
interface TemplateMarker {
  /** Marker keyword such as if, else, or end. */
  keyword: 'if' | 'else' | 'end';
  /** Marker expression following the keyword, when present. */
  expression?: string;
}

/**
 * Gets an action name from a template line.
 *
 * @param line - One line from `spec.data`.
 * @returns Parsed action name or undefined.
 */
function getActionName(line: string): string | undefined {
  return line.match(/^\s*-\s+name:\s*"?([^"]+)"?/)?.[1];
}

/**
 * Gets a Go template control-flow marker from a line.
 *
 * @param line - One line from `spec.data`.
 * @returns Parsed marker or undefined.
 */
function getTemplateMarker(line: string): TemplateMarker | undefined {
  const match = line.match(/^\s*\{\{-?\s*(if|else|end)\b(.*?)\s*-?}}\s*$/);
  if (!match) {
    return undefined;
  }

  return {
    keyword: match[1] as TemplateMarker['keyword'],
    expression: match[2]?.trim(),
  };
}

/**
 * Finds the end of a simple Go template conditional block.
 *
 * @param lines - Task lines to search.
 * @param startIndex - Index of the opening `if` marker.
 * @returns Indexes for the optional `else` marker and required `end` marker.
 */
function findConditionalBounds(
  lines: string[],
  startIndex: number
): { elseIndex?: number; endIndex?: number } {
  let depth = 0;
  let elseIndex: number | undefined;

  for (let index = startIndex; index < lines.length; index++) {
    const marker = getTemplateMarker(lines[index]);
    if (!marker) {
      continue;
    }

    if (marker.keyword === 'if') {
      depth += 1;
      continue;
    }

    if (marker.keyword === 'else' && depth === 1) {
      elseIndex = index;
      continue;
    }

    if (marker.keyword === 'end') {
      depth -= 1;
      if (depth === 0) {
        return { elseIndex, endIndex: index };
      }
    }
  }

  return { elseIndex };
}

/**
 * Finds the first action name between two indexes.
 *
 * @param lines - Task lines to search.
 * @param startIndex - Inclusive start index.
 * @param endIndex - Exclusive end index.
 * @returns Parsed action name or undefined.
 */
function findActionNameBetween(
  lines: string[],
  startIndex: number,
  endIndex: number | undefined
): string | undefined {
  for (const line of lines.slice(startIndex, endIndex)) {
    const actionName = getActionName(line);
    if (actionName) {
      return actionName;
    }
  }

  return undefined;
}

/**
 * Finds where the next action or control marker begins after startIndex,
 * bounding how far an action's own detail lines (image, timeout, ...) extend.
 *
 * A fixed-size line window can either truncate an action's own fields or
 * bleed into the next action's fields when actions are shorter than the
 * window; searching for the actual next boundary avoids both.
 *
 * @param lines - Task lines to search.
 * @param startIndex - Index to search after, exclusive.
 * @returns Index of the next action/marker line, or `lines.length` when none follow.
 */
function findNextActionBoundary(lines: string[], startIndex: number): number {
  for (let index = startIndex + 1; index < lines.length; index++) {
    if (getActionName(lines[index]) || getTemplateMarker(lines[index])) {
      return index;
    }
  }

  return lines.length;
}

/**
 * Reads common action details near an action definition.
 *
 * @param lines - Lines that belong to the action.
 * @returns Image and timeout summary fields.
 */
function getActionDetails(lines: string[]): Pick<ParsedTemplateAction, 'image' | 'timeout'> {
  return {
    image: lines
      .find(nextLine => /^\s*image:\s*/.test(nextLine))
      ?.split(/image:\s*/)[1]
      ?.trim(),
    timeout: lines
      .find(nextLine => /^\s*timeout:\s*/.test(nextLine))
      ?.split(/timeout:\s*/)[1]
      ?.trim(),
  };
}

/**
 * Parses action rows from one template task.
 *
 * Conditional action alternatives are shown as one executable action slot
 * because only one branch is rendered into a Workflow.
 *
 * @param taskName - Name of the parent task.
 * @param taskLines - Lines that belong to the task.
 * @returns Parsed action rows.
 */
function parseTaskActions(taskName: string, taskLines: string[]): ParsedTemplateAction[] {
  const actions: ParsedTemplateAction[] = [];

  for (let lineIndex = 1; lineIndex < taskLines.length; lineIndex++) {
    const marker = getTemplateMarker(taskLines[lineIndex]);

    if (marker?.keyword === 'if') {
      const { elseIndex, endIndex } = findConditionalBounds(taskLines, lineIndex);
      if (endIndex) {
        const firstBranchName = findActionNameBetween(
          taskLines,
          lineIndex + 1,
          elseIndex ?? endIndex
        );
        const secondBranchName =
          elseIndex !== undefined
            ? findActionNameBetween(taskLines, elseIndex + 1, endIndex)
            : undefined;
        const alternatives = [firstBranchName, secondBranchName].filter(Boolean) as string[];

        if (alternatives.length > 0) {
          actions.push({
            taskName,
            name: alternatives.join(' / '),
            alternatives,
            condition: marker.expression,
            ...getActionDetails(
              taskLines.slice(lineIndex, findNextActionBoundary(taskLines, endIndex))
            ),
          });
        }

        lineIndex = endIndex;
      }

      continue;
    }

    const actionName = getActionName(taskLines[lineIndex]);
    if (!actionName) {
      continue;
    }

    actions.push({
      taskName,
      name: actionName,
      ...getActionDetails(
        taskLines.slice(lineIndex, findNextActionBoundary(taskLines, lineIndex))
      ),
    });
  }

  return actions;
}

/**
 * Parses the common Tinkerbell template fields used in the detail summary.
 *
 * @param data - Template YAML stored in `spec.data`.
 * @returns A best-effort parsed template summary.
 */
export function parseTemplateData(data: string | undefined): ParsedTemplate {
  if (!data) {
    return { tasks: [], actions: [], images: [] };
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
    return { name: templateName, globalTimeout, tasks: [], actions: [], images: [] };
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
      actionCount: parseTaskActions(task.name, taskLines).length,
      volumeCount: taskLines.filter(line => /^\s*-\s+[^:]+:[^/]*\//.test(line)).length,
    };
  });

  const actions = topLevelTasks.flatMap((task, index) => {
    const nextTask = topLevelTasks[index + 1];
    const taskLines = lines.slice(task.lineIndex, nextTask?.lineIndex);

    return parseTaskActions(task.name, taskLines);
  });

  const images = Array.from(
    new Set(actions.map(action => action.image).filter(Boolean) as string[])
  );

  return { name: templateName, globalTimeout, tasks, actions, images };
}

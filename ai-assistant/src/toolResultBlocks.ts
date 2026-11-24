/** Agent tool-result block markers emitted by Holmes. */
const TOOL_ICON = '🔧';
const RESULT_LABEL = 'result:';

// These scanners replace `/🔧\s*\S+\s+result:[\s\S]*?(?=\n\s*##)/g` and
// `/🔧\s*\S+\s+result:[\s\S]*$/g`, which are quadratic on adversarial agent
// output, with linear scans that remove the same text.

/** Precomputed `\s` run boundaries for constant-time header checks. */
interface WhitespaceIndex {
  /** First index at or after `i` that is not `\s`, or the text length. */
  nextNonWs: Int32Array;
  /** First index at or after `i` that is `\s`, or the text length. */
  nextWs: Int32Array;
}

/** @returns Whitespace run boundaries for every index of `text`. */
function buildWhitespaceIndex(text: string): WhitespaceIndex {
  const nextNonWs = new Int32Array(text.length + 1).fill(text.length);
  const nextWs = new Int32Array(text.length + 1).fill(text.length);
  for (let i = text.length - 1; i >= 0; i--) {
    const isWs = /\s/.test(text[i]);
    nextNonWs[i] = isWs ? nextNonWs[i + 1] : i;
    nextWs[i] = isWs ? i : nextWs[i + 1];
  }
  return { nextNonWs, nextWs };
}

/** @returns Index after a `🔧 <tool> result:` header starting at `start`, or -1. */
function matchToolResultHeader(text: string, start: number, index: WhitespaceIndex): number {
  const toolStart = index.nextNonWs[start + TOOL_ICON.length];
  if (toolStart === text.length) return -1;
  const toolEnd = index.nextWs[toolStart];
  if (toolEnd === text.length) return -1;
  const labelStart = index.nextNonWs[toolEnd];
  return text.startsWith(RESULT_LABEL, labelStart) ? labelStart + RESULT_LABEL.length : -1;
}

/**
 * Removes `🔧 <tool> result: ...` blocks that are followed by a `##` heading.
 *
 * Each block runs up to, but not including, the newline before the heading.
 *
 * @param text - Agent output.
 * @returns The output without those tool-result blocks.
 */
export function removeToolResultBlocksBeforeHeadings(text: string): string {
  const index = buildWhitespaceIndex(text);
  // First newline at or after `i` whose next non-whitespace text is `##`.
  const nextHeadingBreak = new Int32Array(text.length + 1).fill(-1);
  for (let i = text.length - 1; i >= 0; i--) {
    nextHeadingBreak[i] =
      text[i] === '\n' && text.startsWith('##', index.nextNonWs[i + 1])
        ? i
        : nextHeadingBreak[i + 1];
  }

  let out = '';
  let copied = 0;
  let search = 0;
  for (;;) {
    const start = text.indexOf(TOOL_ICON, search);
    if (start === -1) break;
    const headerEnd = matchToolResultHeader(text, start, index);
    if (headerEnd === -1) {
      search = start + 1;
      continue;
    }
    const blockEnd = nextHeadingBreak[headerEnd];
    // Later headers end at or after this one, so they cannot reach a heading either.
    if (blockEnd === -1) break;
    out += text.slice(copied, start);
    copied = search = blockEnd;
  }
  return out + text.slice(copied);
}

/**
 * Removes everything from the first `🔧 <tool> result:` header to the end.
 *
 * @param text - Agent output.
 * @returns The output before the first tool-result header.
 */
export function removeTrailingToolResultBlock(text: string): string {
  const index = buildWhitespaceIndex(text);
  for (
    let start = text.indexOf(TOOL_ICON);
    start !== -1;
    start = text.indexOf(TOOL_ICON, start + 1)
  ) {
    if (matchToolResultHeader(text, start, index) !== -1) return text.slice(0, start);
  }
  return text;
}

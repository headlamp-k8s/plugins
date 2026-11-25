/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CORE_SCHEMA, dump, loadAll } from 'js-yaml';

const REDACTED = '[REDACTED]';

/** Levels of JSON or YAML inside strings that are read; deeper text is withheld. */
const MAX_TEXT_NESTING = 6;

/** Depth up to which a JSON or YAML value is read; deeper parts are withheld. */
const MAX_VALUE_DEPTH = 100;

// Text without any of these can't hold a credential key, a data key or an
// escape that spells one, so the patterns alone are enough for it.
const MAY_NEED_PARSING =
  /data|password|passwd|secret|token|bearer|authorization|credential|(?:api|access|private|signing|encryption|master|hmac|shared|session|ssh)[_-]?key|certificate|client[_-]?key|\\/i;

// Keys whose values are credentials: the names the patterns below look for,
// also at the end of a longer name like DB_PASSWORD, x-api-key or, once
// camelCase is split, refreshToken.
const CREDENTIAL_KEY =
  /(?:^|[^a-z0-9])(?:password|passwd|secret|token|bearer|authorization|credentials?|api[_-]?key|access[_-]?key(?:[_-]?id)?|private[_-]?key|(?:secret|signing|encryption|master|hmac|shared|session|ssh)[_-]?key|client[_-]?secret|auth[_-]?token|certificate[_-]?authority[_-]?data|client[_-]?(?:certificate|key)(?:[_-]?data)?)$/i;

// Names of credential keys in text that can't be read as JSON or YAML.
const KUBECONFIG_KEY =
  'client[_-]?(?:key|certificate)(?:[_-]?data)?|certificate[_-]?authority[_-]?data';

const CREDENTIAL_WORDS =
  '(?:' +
  KUBECONFIG_KEY +
  '|password|passwd|secret|token|bearer|authorization|credentials?|api[_-]?key|access[_-]?key|private[_-]?key|(?:secret|signing|encryption|master|hmac|shared|session|ssh)[_-]?key|client[_-]?secret|auth[_-]?token)';

// The same names at the end of a camelCase name, like refreshToken; matched
// with case, since camelCase has no other boundary.
const CAMEL_CREDENTIAL =
  '(?:[a-z][a-zA-Z0-9]*(?:Password|Passwd|Secret|Token|Bearer|Authorization|Credentials?|(?:Api|Access|Private|Secret|Signing|Encryption|Master|Hmac|Shared|Session|Ssh)Key)|(?:api|access|private|secret|signing|encryption|master|hmac|shared|session|ssh)Key)';

// In text that can't be read as JSON or YAML, Secret data can only start on a
// line with one of these: a data key, a credential key whose value goes on
// over the next lines, an escaped letter that could spell either, or a YAML
// anchor that could repeat a value under one.
const UNREAD_SECRET_START = new RegExp(
  [
    String.raw`\\?["'](?:data|stringdata|binarydata)\\?["']\s*:`,
    String.raw`(?:^[ \t]*(?:-[ \t]+)*|[{,][ \t]*)(?:data|stringdata|binarydata)\s*:`,
    String.raw`^[ \t]*(?:-[ \t]+)*\?[ \t]+(?:\\?["'])?(?:data|stringdata|binarydata)(?:\\?["'])?[ \t]*$`,
    String.raw`(?:^|[^a-z0-9])${CREDENTIAL_WORDS}(?:\\?["'])?[ \t]*[:=][ \t]*(?:[|>].*|'(?:[^'\n]|'')*)?$`,
    String.raw`(?:^|[^a-z0-9])(?:${KUBECONFIG_KEY})["']?[ \t]*[:=][ \t]*["']`,
    String.raw`\\(?:u00[4-7][0-9a-f]|U0000[4-7][0-9a-f]|x[4-7][0-9a-f])`,
    String.raw`(?:^|[:\-[{,])[ \t]*&[\w-]`,
  ].join('|'),
  'im'
);

// A credential key in a line of text that can't be read as JSON or YAML.
const CREDENTIAL_LABEL = new RegExp(
  String.raw`(?:^|[^a-z0-9])${CREDENTIAL_WORDS}(?:\\?["'])?[ \t]*[:=]`,
  'i'
);
const CAMEL_CREDENTIAL_LABEL = new RegExp(String.raw`\b${CAMEL_CREDENTIAL}(?:\\?["'])?[ \t]*[:=]`);

// A camelCase credential key whose value goes on over the next lines, like the
// matching part of UNREAD_SECRET_START.
const CAMEL_CREDENTIAL_OPEN = new RegExp(
  String.raw`\b${CAMEL_CREDENTIAL}(?:\\?["'])?[ \t]*[:=][ \t]*(?:[|>].*|'(?:[^'\n]|'')*)?$`,
  'm'
);

// The credential patterns for camelCase keys: quoted with a quoted value,
// quoted with another value, and not quoted.
const CAMEL_PATTERNS: Array<[RegExp, string]> = [
  [
    new RegExp(String.raw`"(${CAMEL_CREDENTIAL})"(\s*:\s*)"(?:[^"\\]|\\.)*"`, 'g'),
    '"$1"$2"[REDACTED]"',
  ],
  [
    new RegExp(
      String.raw`(\\?["'])(${CAMEL_CREDENTIAL})\1([^\S\r\n]*:[^\S\r\n]*)(?![\s"'\\])[^\r\n]+`,
      'g'
    ),
    '$1$2$1$3[REDACTED]',
  ],
  [
    new RegExp(
      String.raw`\b(${CAMEL_CREDENTIAL})(?![^\S\r\n]*[:=][^\S\r\n]*\[REDACTED\][^\S\r\n]*$)([^\S\r\n]*[:=][^\S\r\n]*)[^\r\n]+`,
      'gm'
    ),
    '$1$2[REDACTED]',
  ],
];

// A YAML anchor (`&name`), which lets one value show up in several places.
const YAML_ANCHOR = /(?:^|[\s,[{])&[^\s,[\]{}]/;

// A line that can start YAML between other lines: a document marker, a list
// item, an explicit key or value, or a key at the start of the line.
const YAML_START = /^(?:---|\.\.\.|[-?:](?:[ \t]|$)|[^\s#\-?:{[`][^\n]*?:(?:[ \t]|$))/;

/**
 * Redacts common secret and credential patterns from a string before it is
 * sent to an LLM or rendered in the UI.
 *
 * Patterns covered:
 * - PEM-encoded certificates and private keys (-----BEGIN … -----END …-----)
 * - JWT tokens (three-part base64url strings starting with eyJ…)
 * - AWS access key IDs (AKIA… / ASIA…) and named AWS credential fields
 * - HTTP Authorization / X-Api-Key / X-Auth-Token headers
 * - Kubernetes kubeconfig inline certificate/key data (base64 fields)
 * - Generic key=value / key: value pairs whose key name suggests a credential
 *   (password, token, secret, api_key, access_key, private_key, …)
 *
 * JSON and YAML in the text, also in fenced blocks, between other lines or
 * cut off at the end, are read with a parser as well and redacted by key:
 * every value under `stringData`, under `data` and `binaryData` of a Secret,
 * and of a credential key. When the patterns already redact all of that,
 * their output is returned; otherwise the redacted value is printed again.
 * Text that can't be read is withheld from the first line that could start
 * Secret data.
 *
 * Each match is replaced with `[REDACTED]`. The original string is never
 * modified; a new string is returned.
 *
 * @param input - Raw text that may contain credentials or secret material.
 * @returns A copy of the input with recognized secret patterns replaced.
 */
export function redactSecrets(input: string): string {
  try {
    // Allow repeated parsing of ordinary text, while bounding YAML alias expansion.
    return redactText(input, 0, { remaining: 16 * input.length + 10_000 });
  } catch {
    // Whatever went wrong, the input is withheld rather than passed on.
    return REDACTED;
  }
}

/**
 * Returns a deep redacted copy of a JSON-like value.
 *
 * @param value - Structured tool result or nested JSON-compatible value.
 * @returns A deep copy with strings, credentials and Kubernetes Secret payloads redacted.
 */
export function redactSecretsInValue(value: unknown): unknown {
  const walk: Walk = { nesting: 0, json: true, budget: { remaining: 10_000_000 }, changed: false };
  try {
    return redactValue(value, walk, 0);
  } catch {
    // Like a value too large to walk, or a getter that throws, the value is
    // withheld rather than passed on.
    return REDACTED;
  }
}

/** Shared allowance for visited nodes and scanned string characters, including YAML aliases. */
interface Budget {
  remaining: number;
}

/** Thrown when a value has more nodes than its budget. */
class TooLarge extends Error {}

/** JSON or YAML read from text, with one entry per YAML document. */
interface Parsed {
  format: 'json' | 'yaml';
  docs: unknown[];
}

/**
 * Redacts text, reading it as JSON or YAML when it may need that.
 *
 * @param text - Text that may contain credentials or secret material.
 * @param nesting - How many levels of JSON or YAML strings the text is in.
 * @param budget - Remaining traversal and string scanning allowance.
 * @returns The redacted text.
 */
function redactText(text: string, nesting: number, budget: Budget): string {
  budget.remaining -= text.length;
  if (budget.remaining < 0) throw new TooLarge();
  if (!MAY_NEED_PARSING.test(text)) return redactPatterns(text);
  // Real tool output doesn't nest this deeply, so such text is withheld.
  if (nesting > MAX_TEXT_NESTING) return REDACTED;
  const parsed = parseWhole(text);
  return parsed
    ? redactStructured(text, parsed, nesting, budget).text
    : redactMixedText(text, nesting, budget);
}

/**
 * Reads text that is one JSON value, possibly cut off at the end, or YAML.
 *
 * @param text - Text to read.
 * @returns The value, or undefined when the text isn't JSON or YAML with a
 *   mapping or sequence in it.
 */
function parseWhole(text: string): Parsed | undefined {
  const start = skipSpace(text, 0);
  if (start === text.length) return undefined;
  if (text[start] === '{' || text[start] === '[') {
    const read = readJson(text, start);
    if ('value' in read && skipSpace(text, read.end) === text.length) {
      return { format: 'json', docs: [read.value] };
    }
  } else if (text[start] === '"') {
    try {
      return { format: 'json', docs: [JSON.parse(text)] };
    } catch {
      // Not a single JSON string.
    }
  }
  const docs = parseYaml(text);
  return docs && { format: 'yaml', docs };
}

/**
 * Reads YAML documents.
 *
 * @param text - Text to read.
 * @returns The documents, or undefined when the text isn't YAML or holds no
 *   mapping or sequence.
 */
function parseYaml(text: string): unknown[] | undefined {
  try {
    const docs = loadAll(text, undefined, { schema: CORE_SCHEMA });
    return docs.some(doc => typeof doc === 'object' && doc !== null) ? docs : undefined;
  } catch {
    return undefined;
  }
}

/** Redacted text, and whether anything in it was redacted. */
interface Redacted {
  text: string;
  changed: boolean;
}

/**
 * Redacts JSON or YAML text. Returns the patterns' output when it reads back as
 * the redacted value, or hides more of it, and otherwise prints the value again
 * with every Secret value and credential redacted.
 *
 * @param text - The JSON or YAML text.
 * @param parsed - The text, read.
 * @param nesting - How many levels of JSON or YAML strings the text is in.
 * @param budget - Remaining traversal and string scanning allowance.
 * @returns The redacted text.
 */
function redactStructured(text: string, parsed: Parsed, nesting: number, budget: Budget): Redacted {
  try {
    // An anchor can repeat a value that needs redacting in places that don't
    // look sensitive, so such YAML is withheld whole.
    const hasComment = parsed.format === 'yaml' && /(?:^|\s)#/.test(text);
    if (parsed.format === 'yaml' && YAML_ANCHOR.test(text)) {
      if (hasComment || holdsSecrets(parsed, nesting, budget)) {
        return { text: withSpaceOf(text, REDACTED), changed: true };
      }
      const patterned = redactPatterns(text);
      return { text: patterned, changed: patterned !== text };
    }
    const walk: Walk = { nesting, json: parsed.format === 'json', budget, changed: false };
    const docs = parsed.docs.map(doc => redactValue(doc, walk, 0));
    // The patterns' output keeps the text as it was around what they replace,
    // so it's used when it reads back as exactly the redacted value.
    const patterned = redactPatterns(text);
    if (hasComment) return { text: withSpaceOf(text, print(parsed.format, docs)), changed: true };
    const check = patterned === text ? parsed : parseWhole(patterned);
    if (
      check?.format === parsed.format &&
      (parsed.format === 'json' || !cutsMultiLineValue(text, patterned)) &&
      sameValue(check.docs, docs, budget, 0)
    ) {
      return { text: patterned, changed: patterned !== text };
    }
    // The patterns can also match what isn't redacted here, like `"password": true`.
    if (!walk.changed) return { text, changed: false };
    return { text: withSpaceOf(text, print(parsed.format, docs)), changed: true };
  } catch (error) {
    if (!(error instanceof TooLarge)) throw error;
    return { text: withSpaceOf(text, REDACTED), changed: true };
  }
}

/**
 * Whether the patterns changed a YAML line whose value goes on over the next,
 * more indented lines. YAML then reads those lines as something else, like a
 * block scalar's `# ...` line as a comment, which the value doesn't show.
 *
 * @param text - The YAML text.
 * @param patterned - The patterns' output.
 * @returns Whether such a line was changed.
 */
function cutsMultiLineValue(text: string, patterned: string): boolean {
  const lines = text.split('\n');
  const patternedLines = patterned.split('\n');
  if (lines.length !== patternedLines.length) return true;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === patternedLines[i]) continue;
    let next = i + 1;
    while (next < lines.length && lines[next].trim() === '') next++;
    if (next < lines.length && indentOf(lines[next]) > indentOf(lines[i])) return true;
  }
  return false;
}

/**
 * Returns how many spaces and tabs a line starts with.
 *
 * @param line - A line of text.
 * @returns The line's indentation.
 */
function indentOf(line: string): number {
  return skipIndent(line, 0);
}

/**
 * Prints redacted JSON or YAML documents.
 *
 * @param format - The format the documents were read from.
 * @param docs - The redacted documents.
 * @returns The printed documents.
 */
function print(format: Parsed['format'], docs: unknown[]): string {
  if (format === 'json') return JSON.stringify(docs[0], null, 2);
  return (
    docs
      .filter(doc => doc !== null && doc !== undefined)
      .map(doc => dump(doc, { schema: CORE_SCHEMA, lineWidth: -1, noRefs: true }).trimEnd())
      .join('\n---\n')
      // Print the marker the way the patterns write it.
      .replace(/(: |- )'\[REDACTED\]'$/gm, `$1${REDACTED}`)
  );
}

/**
 * Redacts text that isn't one JSON or YAML value: fenced blocks, JSON and YAML
 * between other lines, and the text around them.
 *
 * @param text - Text to redact.
 * @param nesting - How many levels of JSON or YAML strings the text is in.
 * @param budget - Remaining traversal and string scanning allowance.
 * @returns The redacted text.
 */
function redactMixedText(text: string, nesting: number, budget: Budget): string {
  let out = '';
  // Start of the text that wasn't written yet.
  let unread = 0;
  let pos = 0;
  // Characters read as JSON that turned out not to be, bounded to stay linear.
  let jsonTried = 0;
  // Whether what follows may still hold Secret data. It's then withheld up to
  // the next fence, since JSON or YAML read in the middle of it doesn't mean
  // the Secret ended there.
  let withholding = false;
  const withhold = (): void => {
    out += `${REDACTED}\n`;
    withholding = true;
  };
  // Writes the text up to `end` that wasn't read as JSON or YAML.
  const writeUnread = (end: number): void => {
    if (!withholding) {
      const chunk = text.slice(unread, end);
      const start = unreadSecretStart(chunk);
      out += redactPatterns(start === -1 ? chunk : chunk.slice(0, start));
      if (start !== -1) withhold();
    }
    unread = end;
  };
  while (pos < text.length) {
    const end = lineEnd(text, pos);
    const line = text.slice(pos, end).replace(/\r$/, '');
    const atLineStart = pos === 0 || text[pos - 1] === '\n';
    const first = Math.min(skipIndent(text, pos), end);
    if (atLineStart && first === pos && text.startsWith('```', pos)) {
      writeUnread(pos);
      withholding = false;
      // A fenced block runs to its closing fence, or to the end of the text.
      const bodyStart = Math.min(end + 1, text.length);
      let close = fenceClose(text, bodyStart);
      // A fence can also close at the end of the block's last line.
      if (close === text.length && /```\s*$/.test(text.slice(bodyStart))) {
        close = text.lastIndexOf('```');
      }
      out +=
        redactPatterns(text.slice(pos, bodyStart)) +
        redactText(text.slice(bodyStart, close), nesting, budget);
      unread = close;
      pos = Math.min(lineEnd(text, close) + 1, text.length);
      continue;
    }
    if (withholding) {
      pos = end + 1;
      continue;
    }
    const bracket = text[first] === '{' || text[first] === '[';
    if (bracket && jsonTried <= 4 * text.length) {
      const read = readJson(text, first);
      if ('value' in read) {
        writeUnread(first);
        if (!withholding) {
          const json: Parsed = { format: 'json', docs: [read.value] };
          out += redactStructured(text.slice(first, read.end), json, nesting, budget).text;
        }
        unread = pos = read.end;
        continue;
      }
      jsonTried += read.tried;
    }
    // A line with a bracket that isn't JSON can still start YAML in flow style.
    if (atLineStart && (bracket || YAML_START.test(line))) {
      const blockEnd = yamlBlockEnd(text, Math.min(end + 1, text.length));
      const block = text.slice(pos, blockEnd);
      const docs = parseYaml(block);
      if (docs) {
        writeUnread(pos);
        if (!withholding) {
          const redacted = redactStructured(block, { format: 'yaml', docs }, nesting, budget);
          out += redacted.text;
          // YAML that needed redacting and stops right before another line may
          // have been cut short by that line, so what follows is withheld too.
          if (redacted.changed && /\S/.test(text.slice(blockEnd, lineEnd(text, blockEnd)))) {
            withhold();
          }
        }
        unread = blockEnd;
      }
      pos = blockEnd;
      continue;
    }
    pos = end + 1;
  }
  writeUnread(text.length);
  // What is withheld ran to the end, so the marker ends the text like it did.
  return withholding && !text.endsWith('\n') ? out.slice(0, -1) : out;
}

/**
 * Returns where text that couldn't be read as JSON or YAML could start Secret
 * data: the first line with a data key, or with a credential whose value goes
 * on over the next lines.
 *
 * @param text - Text that couldn't be read.
 * @returns Start of that line, or -1 when there is none.
 */
function unreadSecretStart(text: string): number {
  let start = Math.min(
    UNREAD_SECRET_START.exec(text)?.index ?? text.length,
    CAMEL_CREDENTIAL_OPEN.exec(text)?.index ?? text.length
  );
  // A credential's value also goes on over the next line when a quote or
  // bracket in it isn't closed on its line, or when that line is indented more.
  for (let line = 0; line < start; ) {
    const end = lineEnd(text, line);
    const next = end + 1;
    const nextFirst = skipIndent(text, next);
    const lineText = text.slice(line, end);
    const label = CREDENTIAL_LABEL.exec(lineText) ?? CAMEL_CREDENTIAL_LABEL.exec(lineText);
    if (
      label &&
      (leavesValueOpen(text, line + label.index + label[0].length, end) ||
        (nextFirst - next > skipIndent(text, line) - line && /\S/.test(text[nextFirst] ?? '')))
    ) {
      start = line;
    }
    line = next;
  }
  return start === text.length ? -1 : text.lastIndexOf('\n', start) + 1;
}

/**
 * Whether a double quote, bracket or brace in part of a line isn't closed by
 * the line's end, so what it opens goes on over the next line.
 *
 * @param text - Text being read.
 * @param from - Where the part starts.
 * @param end - End of the line.
 * @returns Whether something is left open.
 */
function leavesValueOpen(text: string, from: number, end: number): boolean {
  let depth = 0;
  let quoted = false;
  for (let pos = from; pos < end; pos++) {
    const char = text[pos];
    if (quoted) {
      if (char === '\\') pos++;
      else if (char === '"') quoted = false;
    } else if (char === '"') {
      quoted = true;
    } else if (char === '{' || char === '[') {
      depth++;
    } else if ((char === '}' || char === ']') && depth > 0) {
      depth--;
    }
  }
  return quoted || depth > 0;
}

/**
 * Returns where the YAML that starts at `start` ends: before the first line
 * that isn't blank, indented, a comment or a line that can start YAML.
 *
 * @param text - Text being read.
 * @param start - Start of the first line of the YAML.
 * @returns Index after the last line of the YAML.
 */
function yamlBlockEnd(text: string, start: number): number {
  let pos = start;
  while (pos < text.length) {
    const end = lineEnd(text, pos);
    const line = text.slice(pos, end).replace(/\r$/, '');
    // Lines that start with a closing bracket end a flow collection.
    if (/^```/.test(line) || !(/^(?:[ \t#}\]]|$)/.test(line) || YAML_START.test(line))) {
      break;
    }
    pos = end + 1;
  }
  return Math.min(pos, text.length);
}

/**
 * Returns the start of the line that closes a fenced block.
 *
 * @param text - Text being read.
 * @param from - Start of the block's first line.
 * @returns Start of the closing fence's line, or the text's length.
 */
function fenceClose(text: string, from: number): number {
  for (let pos = from; pos < text.length; pos = lineEnd(text, pos) + 1) {
    if (text.startsWith('```', pos)) return pos;
  }
  return text.length;
}

/** What {@link readJson} found: a value and where it ends, or how far it read. */
type JsonRead = { end: number; value: unknown } | { tried: number };

/**
 * Reads the JSON value that starts at `start` (a `{` or `[`), like JSON.parse,
 * also when the text stops inside it: the value is then read as if it were
 * closed right there, so a cut-off string or other token ends as a string, a
 * cut-off key is left out and open objects and arrays close. An object that
 * repeats a key isn't read, since JSON.parse would keep only one of its values.
 *
 * @param text - Text being read.
 * @param start - Index of the opening bracket.
 * @returns The value and the index after it, or how many characters were read.
 */
function readJson(text: string, start: number): JsonRead {
  // One entry per open container: the keys of an object, or null for an array.
  const open: Array<Set<string> | null> = [];
  let expect: 'value' | 'key' | 'colon' | 'next' = 'value';
  let justOpened = false;
  let lastComma = -1;
  let pos = start;
  const fail = (): JsonRead => ({ tried: pos - start + 1 });
  for (;;) {
    while (pos < text.length && isJsonSpace(text.charCodeAt(pos))) pos++;
    if (pos === text.length) {
      // The text stops between tokens: finish what was expected and close.
      let body = text.slice(start, pos);
      if (expect === 'colon') body += ':null';
      else if (expect === 'value' && !justOpened) body += 'null';
      else if (expect === 'key' && !justOpened) body = text.slice(start, lastComma);
      return closeJson(body, open, text.length);
    }
    const char = text[pos];
    const keys = open[open.length - 1];
    if ((expect === 'next' || justOpened) && char === (keys ? '}' : ']')) {
      open.pop();
      pos++;
      justOpened = false;
      expect = 'next';
      if (open.length === 0) return parseJson(text, start, pos);
      continue;
    }
    const firstKey = justOpened;
    justOpened = false;
    if (expect === 'next') {
      if (char !== ',') return fail();
      lastComma = pos++;
      expect = keys ? 'key' : 'value';
    } else if (expect === 'colon') {
      if (char !== ':') return fail();
      pos++;
      expect = 'value';
    } else if (char === '"') {
      const end = jsonStringEnd(text, pos);
      if (end === -1) return fail();
      if (end === -2) {
        // A key the text stops in has no value yet, so it's left out; it could
        // otherwise repeat an earlier key and hide its value.
        if (expect === 'key') {
          return closeJson(text.slice(start, firstKey ? pos : lastComma), open, text.length);
        }
        return closeJson(text.slice(start, cutJsonString(text, pos)) + '"', open, text.length);
      }
      if (expect === 'key') {
        let key: string;
        try {
          key = JSON.parse(text.slice(pos, end));
        } catch {
          return fail();
        }
        if (keys!.has(key)) return fail();
        keys!.add(key);
        expect = 'colon';
      } else {
        expect = 'next';
      }
      pos = end;
    } else if (expect === 'key') {
      return fail();
    } else if (char === '{' || char === '[') {
      open.push(char === '{' ? new Set() : null);
      expect = char === '{' ? 'key' : 'value';
      justOpened = true;
      pos++;
    } else {
      const end = jsonLiteralEnd(text, pos);
      if (end === pos) return fail();
      if (end === text.length) {
        // A token the text stops in is kept as a string, so it's still there
        // to redact.
        return closeJson(text.slice(start, pos) + JSON.stringify(text.slice(pos)), open, end);
      }
      pos = end;
      expect = 'next';
    }
  }
}

/**
 * Closes the containers left open in a JSON value and parses it.
 *
 * @param body - The value up to where the text stops, completed to a token end.
 * @param open - The containers still open, outermost first.
 * @param end - Index where the text stops.
 * @returns The value, or how many characters were read when it doesn't parse.
 */
function closeJson(body: string, open: Array<Set<string> | null>, end: number): JsonRead {
  let closed = body;
  for (let i = open.length - 1; i >= 0; i--) closed += open[i] ? '}' : ']';
  try {
    return { end, value: JSON.parse(closed) };
  } catch {
    return { tried: body.length };
  }
}

/**
 * Parses a complete JSON value.
 *
 * @param text - Text being read.
 * @param start - Index of the value.
 * @param end - Index after the value.
 * @returns The value, or how many characters were read when it doesn't parse.
 */
function parseJson(text: string, start: number, end: number): JsonRead {
  try {
    return { end, value: JSON.parse(text.slice(start, end)) };
  } catch {
    return { tried: end - start };
  }
}

/**
 * Returns the index after the JSON string starting at `start`.
 *
 * @param text - Text being read.
 * @param start - Index of the opening quote.
 * @returns Index after the closing quote, -1 when the string holds a raw
 *   control character, or -2 when the text stops inside it.
 */
function jsonStringEnd(text: string, start: number): number {
  for (let pos = start + 1; pos < text.length; pos++) {
    const code = text.charCodeAt(pos);
    if (code === 34) return pos + 1; // "
    if (code < 32) return -1;
    if (code === 92) pos++; // \ escapes the next character
  }
  return -2;
}

/**
 * Returns where a JSON string that the text stops inside can be closed: before
 * an escape that the text cut short.
 *
 * @param text - Text being read.
 * @param start - Index of the opening quote.
 * @returns Index where the string can end.
 */
function cutJsonString(text: string, start: number): number {
  let pos = start + 1;
  while (pos < text.length) {
    if (text.charCodeAt(pos) !== 92) {
      pos++;
      continue;
    }
    const escapeEnd = pos + (text[pos + 1] === 'u' ? 6 : 2);
    if (escapeEnd > text.length) return pos;
    pos = escapeEnd;
  }
  return text.length;
}

/**
 * Returns the end of a JSON number or literal (`true`, `false`, `null`).
 *
 * @param text - Text being read.
 * @param start - Index of the token.
 * @returns Index after the token.
 */
function jsonLiteralEnd(text: string, start: number): number {
  let pos = start;
  while (pos < text.length && /[-+.0-9a-zA-Z]/.test(text[pos])) pos++;
  return pos;
}

/**
 * Whether a character is JSON whitespace.
 *
 * @param code - Character code.
 * @returns Whether it's a space, tab, line feed or carriage return.
 */
function isJsonSpace(code: number): boolean {
  return code === 32 || code === 9 || code === 10 || code === 13;
}

/** State of one walk over a parsed value. */
interface Walk {
  /** How many levels of JSON or YAML strings the value is in. */
  nesting: number;
  /** Whether the value was read from JSON or given as a value, not read from YAML. */
  json: boolean;
  /** Remaining traversal and string scanning allowance. */
  budget: Budget;
  /** Whether anything was redacted. */
  changed: boolean;
}

/**
 * Returns a copy of a parsed value with Secret data, credentials and the
 * patterns redacted.
 *
 * @param value - Parsed value.
 * @param walk - State of the walk.
 * @param depth - Depth of the value.
 * @param itemKind - Kind of the items when the value is the items of a list.
 * @returns The redacted copy.
 */
function redactValue(
  value: unknown,
  walk: Walk,
  depth: number,
  itemKind?: string,
  path = ''
): unknown {
  if (--walk.budget.remaining < 0) throw new TooLarge();
  if (typeof value === 'string') {
    const redacted = redactText(value, walk.nesting + 1, walk.budget);
    if (redacted !== value) walk.changed = true;
    return redacted;
  }
  if (typeof value !== 'object' || value === null || isMarker(value)) return value;
  // Real tool output is never this deep, so a value this deep is withheld.
  if (depth >= MAX_VALUE_DEPTH) return markChanged(walk);
  if (Array.isArray(value))
    return value.map(item => redactValue(item, walk, depth + 1, itemKind, path && path + '[]'));
  if (!isRecord(value)) return value;
  const kind = typeof value.kind === 'string' ? value.kind : itemKind;
  const copy: Record<string, unknown> = {};
  // Whether the object's apiVersion or kind came before the key at hand, as
  // they do in a real object, whether in kubectl's order or the apiserver's.
  // Only YAML can merge two objects that follow each other without `---`, so
  // JSON objects count as typed, like items that get their kind from a list.
  let typed = walk.json || (kind === itemKind && kind !== undefined);
  for (const [key, item] of Object.entries(value)) {
    const field = key.trim().toLowerCase();
    const redactedKey = redactKey(key, walk);
    let redacted: unknown;
    if (
      field === 'stringdata' ||
      ((field === 'data' || field === 'binarydata') && holdsSecretData(kind, typed, item))
    ) {
      redacted = redactDataValues(item, walk);
    } else if (
      CREDENTIAL_KEY.test(key.trim().replace(/([a-z0-9])([A-Z])/g, '$1_$2')) ||
      (redactedKey !== key &&
        (CREDENTIAL_LABEL.test(key) ||
          CAMEL_CREDENTIAL_LABEL.test(key) ||
          unreadSecretStart(key) !== -1))
    ) {
      // A key with a credential's label in it, like a line that YAML split at
      // a colon after the label, also has the rest of the credential in its value.
      redacted =
        ((path === 'pod.spec.volumes[]' && field === 'secret') || path === 'projected.sources[]') &&
        isVolumeSource(field, item)
          ? redactValue(item, walk, depth + 1)
          : redactLeaves(item, walk, depth + 1);
    } else {
      const items = field === 'items' ? listItemKind(kind) : undefined;
      redacted = redactValue(item, walk, depth + 1, items, podFieldPath(kind, path, key, item));
    }
    setOwn(copy, redactedKey, redacted);
    typed ||= field === 'apiversion' || field === 'api_version' || field === 'kind';
  }
  return copy;
}

const POD_TEMPLATE_WORKLOADS = new Set([
  'Deployment',
  'ReplicaSet',
  'StatefulSet',
  'DaemonSet',
  'ReplicationController',
  'Job',
]);

/** Track only the Kubernetes paths where credentials are references. */
function podFieldPath(
  kind: string | undefined,
  parent: string,
  key: string,
  value: unknown
): string {
  if (key === 'spec') {
    if (kind === 'Pod' || parent === 'podTemplate') return 'pod.spec';
    if (parent === 'jobTemplate' || (kind && POD_TEMPLATE_WORKLOADS.has(kind)))
      return 'workload.spec';
    if (kind === 'CronJob') return 'cronJob.spec';
  }
  if (key === 'template' && (parent === 'workload.spec' || kind === 'PodTemplate'))
    return 'podTemplate';
  if (key === 'jobTemplate' && parent === 'cronJob.spec') return 'jobTemplate';
  if (parent === 'pod.spec' && key === 'volumes' && Array.isArray(value)) return 'pod.spec.volumes';
  if (parent === 'pod.spec.volumes[]' && key === 'projected') return 'projected';
  if (parent === 'projected' && key === 'sources' && Array.isArray(value))
    return 'projected.sources';
  return '';
}

/**
 * Whether the `data` or `binaryData` of an object of this kind holds Secret
 * data: always for a Secret, also with its kind cut off (`Sec`) or written
 * over several lines, not for a ConfigMap whose apiVersion or kind comes
 * first, and otherwise when the data has the shape of Secret data, which only
 * holds strings. Without that order, the data can belong to an object that
 * came before the ConfigMap without a `---` between them.
 *
 * @param kind - The object's kind, if it has one.
 * @param typed - Whether the object's apiVersion or kind came before its data.
 * @param data - The value under `data` or `binaryData`.
 * @returns Whether the data is redacted.
 */
function holdsSecretData(kind: string | undefined, typed: boolean, data: unknown): boolean {
  const name = kind?.replace(/\s/g, '').toLowerCase();
  if (name !== undefined && /^[a-z0-9]*$/.test(name)) {
    if (name.startsWith('secret') || 'secret'.startsWith(name)) return true;
    if (name === 'configmap' && typed) return false;
  }
  return isRecord(data) && Object.values(data).every(isLeaf);
}

/**
 * Returns the kind of the items of a list kind, like Secret for SecretList.
 *
 * @param kind - The list's kind.
 * @returns The items' kind, or undefined when the items carry their own.
 */
function listItemKind(kind: string | undefined): string | undefined {
  const name = kind?.replace(/\s/g, '');
  return name && name.length > 4 && name.endsWith('List') ? name.slice(0, -4) : undefined;
}

/**
 * Redacts every value of Secret data, keeping its keys.
 *
 * @param data - The value under `data`, `stringData` or `binaryData`.
 * @param walk - State of the walk.
 * @returns The redacted data.
 */
function redactDataValues(data: unknown, walk: Walk): unknown {
  if (!isRecord(data)) return isEmptyOrMarker(data) ? data : markChanged(walk);
  const copy: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(data)) {
    setOwn(copy, redactKey(key, walk), isEmptyOrMarker(item) ? item : markChanged(walk));
  }
  return copy;
}

/**
 * Redacts every string and number in the value of a credential key.
 *
 * @param value - The credential's value.
 * @param walk - State of the walk.
 * @param depth - Depth of the value.
 * @returns The redacted value.
 */
function redactLeaves(value: unknown, walk: Walk, depth: number): unknown {
  if (--walk.budget.remaining < 0) throw new TooLarge();
  if (isEmptyOrMarker(value) || typeof value === 'boolean') return value;
  if (depth >= MAX_VALUE_DEPTH || !isRecordOrArray(value)) return markChanged(walk);
  if (Array.isArray(value)) return value.map(item => redactLeaves(item, walk, depth + 1));
  const copy: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    setOwn(copy, redactKey(key, walk), redactLeaves(item, walk, depth + 1));
  }
  return copy;
}

/**
 * Whether a value is one of a Pod's volume sources whose keys look like a
 * credential's, `secret` and `serviceAccountToken`, which only name what to
 * mount.
 *
 * @param field - The key in lowercase.
 * @param value - The value under the key.
 * @returns Whether it's such a volume source.
 */
function isVolumeSource(field: string, value: unknown): boolean {
  if (field === 'secret') return isSecretVolumeSource(value);
  return (
    field === 'serviceaccounttoken' &&
    isRecord(value) &&
    Object.entries(value).every(([key, item]) =>
      key === 'expirationSeconds'
        ? typeof item === 'number'
        : (key === 'audience' || key === 'path') && typeof item === 'string'
    )
  );
}

/**
 * Whether a value under a `secret` key is a Pod's Secret volume source, which
 * only names a Secret and the keys to mount.
 *
 * @param value - The value under the key.
 * @returns Whether every field is one of a Secret volume source's.
 */
function isSecretVolumeSource(value: unknown): boolean {
  return (
    isRecord(value) &&
    Object.entries(value).every(([key, item]) => {
      if (key === 'secretName' || key === 'name') return typeof item === 'string';
      if (key === 'defaultMode') return typeof item === 'number';
      if (key === 'optional') return typeof item === 'boolean';
      return key === 'items' && Array.isArray(item) && item.every(isKeyToPath);
    })
  );
}

/**
 * Whether a value is one item of a Secret volume source: a key and its path.
 *
 * @param value - An item of the source's `items`.
 * @returns Whether it only has `key`, `path` and `mode`.
 */
function isKeyToPath(value: unknown): boolean {
  return (
    isRecord(value) &&
    Object.entries(value).every(([field, item]) =>
      field === 'mode'
        ? typeof item === 'number'
        : (field === 'key' || field === 'path') && typeof item === 'string'
    )
  );
}

/**
 * Whether a value read from text holds anything that needs redacting.
 *
 * @param parsed - The text, read.
 * @param nesting - How many levels of JSON or YAML strings the text is in.
 * @param budget - Remaining traversal and string scanning allowance.
 * @returns Whether redacting the documents would change them.
 */
function holdsSecrets(parsed: Parsed, nesting: number, budget: Budget): boolean {
  const walk: Walk = { nesting, json: parsed.format === 'json', budget, changed: false };
  for (const doc of parsed.docs) redactValue(doc, walk, 0);
  return walk.changed;
}

/**
 * Whether a value read from the patterns' output shows no more than the
 * redacted value: it's the same, except that it can hide more behind the
 * marker, however the marker was read.
 *
 * @param value - The value read from the patterns' output.
 * @param redacted - The redacted value.
 * @param budget - Remaining traversal and string scanning allowance.
 * @param depth - Depth of the values.
 * @returns Whether it shows no more.
 */
function sameValue(value: unknown, redacted: unknown, budget: Budget, depth: number): boolean {
  if (--budget.remaining < 0) throw new TooLarge();
  if (isMarker(value)) return true;
  if (isMarker(redacted)) return false;
  if (Array.isArray(value)) {
    return (
      Array.isArray(redacted) &&
      depth < MAX_VALUE_DEPTH &&
      value.length === redacted.length &&
      value.every((item, i) => sameValue(item, redacted[i], budget, depth + 1))
    );
  }
  if (isRecord(value)) {
    if (!isRecord(redacted) || depth >= MAX_VALUE_DEPTH) return false;
    const keys = Object.keys(value);
    const redactedKeys = Object.keys(redacted);
    return (
      keys.length === redactedKeys.length &&
      keys.every(
        (key, i) =>
          key === redactedKeys[i] && sameValue(value[key], redacted[key], budget, depth + 1)
      )
    );
  }
  return value === redacted;
}

/**
 * Redacts a key like any other text, since YAML can read a whole line of
 * other text as a key, noting when that changes it.
 *
 * @param key - Key of a parsed object.
 * @param walk - State of the walk.
 * @returns The redacted key.
 */
function redactKey(key: string, walk: Walk): string {
  const redacted = redactText(key, walk.nesting + 1, walk.budget);
  if (redacted !== key) walk.changed = true;
  return redacted;
}

/**
 * Notes that a value was redacted.
 *
 * @param walk - State of the walk.
 * @returns The marker that replaces the value.
 */
function markChanged(walk: Walk): string {
  walk.changed = true;
  return REDACTED;
}

/**
 * Whether a value is the marker: the string, or how YAML reads `[REDACTED]`.
 *
 * @param value - Parsed value.
 * @returns Whether it's the marker.
 */
function isMarker(value: unknown): boolean {
  return (
    value === REDACTED || (Array.isArray(value) && value.length === 1 && value[0] === 'REDACTED')
  );
}

/**
 * Whether a value is null, missing or already the marker.
 *
 * @param value - Parsed value.
 * @returns Whether there's nothing to redact in it.
 */
function isEmptyOrMarker(value: unknown): boolean {
  return value === null || value === undefined || isMarker(value);
}

/**
 * Whether a value is a scalar or the marker.
 *
 * @param value - Parsed value.
 * @returns Whether it holds no other values.
 */
function isLeaf(value: unknown): boolean {
  return !isRecordOrArray(value) || isMarker(value);
}

/**
 * Whether a value is a plain object.
 *
 * @param value - Any value.
 * @returns Whether it's a plain object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * Whether a value is a plain object or an array.
 *
 * @param value - Any value.
 * @returns Whether it holds other values.
 */
function isRecordOrArray(value: unknown): boolean {
  return Array.isArray(value) || isRecord(value);
}

/**
 * Sets a property as an own property, also for keys like `__proto__`.
 *
 * @param record - Object to set it on.
 * @param key - Property name.
 * @param value - Property value.
 */
function setOwn(record: Record<string, unknown>, key: string, value: unknown): void {
  Object.defineProperty(record, key, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  });
}

/**
 * Puts the leading and trailing whitespace of `text` around `body`.
 *
 * @param text - Original text.
 * @param body - Text to replace it with.
 * @returns The body with the original's surrounding whitespace.
 */
function withSpaceOf(text: string, body: string): string {
  const start = skipSpace(text, 0);
  let end = text.length;
  while (end > start && /\s/.test(text[end - 1])) end--;
  return text.slice(0, start) + body + text.slice(end);
}

/**
 * Returns the index of the first non-whitespace character at or after `from`.
 *
 * @param text - Text being read.
 * @param from - Where to start.
 * @returns Index of the character, or the text's length.
 */
function skipSpace(text: string, from: number): number {
  let pos = from;
  while (pos < text.length && /\s/.test(text[pos])) pos++;
  return pos;
}

/**
 * Returns the index after the spaces and tabs at `from`.
 *
 * @param text - Text being read.
 * @param from - Start of a line.
 * @returns Index of the line's first other character.
 */
function skipIndent(text: string, from: number): number {
  let pos = from;
  while (text[pos] === ' ' || text[pos] === '\t') pos++;
  return pos;
}

/**
 * Returns the index of the line break that ends the line at `pos`.
 *
 * @param text - Text being read.
 * @param pos - Index in the line.
 * @returns Index of the line break, or the text's length.
 */
function lineEnd(text: string, pos: number): number {
  const end = text.indexOf('\n', pos);
  return end === -1 ? text.length : end;
}

/**
 * Applies the credential patterns.
 *
 * @param input - Text that may contain credentials.
 * @returns The text with each match replaced.
 */
function redactPatterns(input: string): string {
  let out = input;

  // PEM blocks — run first so private-key content is gone before the
  // generic key-value patterns could match individual lines inside them.
  out = redactPemBlocks(out);

  // JWT tokens: three base64url segments separated by dots.
  // The first two start with "eyJ" (base64 of '{"').
  out = redactJwts(out);

  // AWS long-lived and temporary access key IDs.
  out = out.replace(/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, '[REDACTED]');

  // AWS environment/JSON credential names are explicit because underscores
  // prevent the generic key-name pattern's word boundary from matching them.
  out = out.replace(
    /"(AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|AWS_SESSION_TOKEN)"(\s*:\s*)"(?:[^"\\]|\\.)*"/gi,
    '"$1"$2"[REDACTED]"'
  );
  out = out.replace(
    /\b(AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|AWS_SESSION_TOKEN)([^\S\r\n]*[:=][^\S\r\n]*)[^\r\n]+/gi,
    '$1$2[REDACTED]'
  );

  // High-confidence provider token formats with distinctive prefixes. These
  // have negligible false-positive risk and cover credentials the generic
  // key-name patterns miss when they appear as bare values.
  // GitHub personal access / OAuth / app tokens.
  out = out.replace(/\b(gh[posur]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g, '[REDACTED]');
  // Google API keys.
  out = out.replace(/\bAIza[0-9A-Za-z_-]{35}\b/g, '[REDACTED]');
  // Google OAuth client secrets.
  out = out.replace(/\bGOCSPX-[A-Za-z0-9_-]{10,}\b/g, '[REDACTED]');
  // Slack tokens.
  out = out.replace(/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, '[REDACTED]');
  // OpenAI / Stripe-style secret keys (sk-..., including sk-proj-...).
  out = out.replace(/\b(sk|rk)-[A-Za-z0-9_-]{20,}\b/g, '[REDACTED]');
  // One of the tokens above that the end of the text cut short.
  out = out.replace(
    /\b(?:gh[posur]_|github_pat_|AIza|GOCSPX-|xox[baprs]-|(?:sk|rk)-)[A-Za-z0-9_-]+$/,
    '[REDACTED]'
  );
  // Azure Storage account keys and connection-string key material.
  out = out.replace(
    /\b(AccountKey|SharedAccessKey|SharedAccessSignature)\s*=\s*[^;"'\s\\]+/gi,
    '$1=[REDACTED]'
  );

  // HTTP Authorization / credential headers — JSON-quoted form first so the
  // quoted key and value are matched before the unquoted fallback below.
  // e.g. "Authorization": "Bearer eyJ..." → "Authorization": "[REDACTED]"
  out = out.replace(
    /"(authorization|x-api-key|x-auth-token)"(\s*:\s*)"(?:[^"\\]|\\.)*"/gi,
    '"$1"$2"[REDACTED]"'
  );

  // HTTP Authorization / credential headers in YAML/plain-text (unquoted key).
  // Match everything to end of line so multi-token values like "Bearer <tok>"
  // are fully redacted rather than just the scheme word.
  out = out.replace(
    /\b(authorization|x-api-key|x-auth-token)([^\S\r\n]*:[^\S\r\n]*)[^\r\n]+/gi,
    '$1$2[REDACTED]'
  );

  // Kubernetes kubeconfig inline base64 certificate / key fields. The value
  // stops at a quote or backslash, so in escaped JSON it can't run on into the
  // next line.
  out = out.replace(
    /\b(certificate[_-]?authority[_-]?data|client[_-]?(?:certificate|key)(?:[_-]?data)?)[^\S\r\n]*:[^\S\r\n]*[^\s"'\\]+/gi,
    '$1: [REDACTED]'
  );

  // Generic credential key/value — JSON-quoted form first.
  // Covers "password": "s3cr3t", "token": "abc 123", etc.
  // Values in JSON can contain spaces and escaped quotes, so match the whole
  // string rather than \S+.
  out = out.replace(
    /"(password|passwd|secret|token|credentials?|api[_-]?key|access[_-]?key|private[_-]?key|(?:secret|signing|encryption|master|hmac|shared|session|ssh)[_-]?key|client[_-]?secret|auth[_-]?token|bearer)"(\s*:\s*)"(?:[^"\\]|\\.)*"/gi,
    '"$1"$2"[REDACTED]"'
  );

  // A quoted credential key whose value isn't quoted, as in YAML or broken
  // JSON: redact through end-of-line like the unquoted form below.
  out = out.replace(
    /(\\?["'])(password|passwd|secret|token|credentials?|api[_-]?key|access[_-]?key|private[_-]?key|(?:secret|signing|encryption|master|hmac|shared|session|ssh)[_-]?key|client[_-]?secret|auth[_-]?token|bearer)\1([^\S\r\n]*:[^\S\r\n]*)(?![\s"'\\])[^\r\n]+/gi,
    '$1$2$1$3[REDACTED]'
  );

  // Generic credential key=value or key: value patterns (unquoted / YAML / env-var).
  // Matches common secret-sounding key names and redacts through end-of-line so
  // YAML/plain-text values containing spaces cannot leak trailing words.
  // Capture the separator including surrounding whitespace in group $2 and replay
  // it so the output preserves the original style exactly:
  //   passwd=s3cr3t    → passwd=[REDACTED]
  //   password: hunter → password: [REDACTED]
  // Negative lookahead prevents double-redacting a value that is already just
  // the marker, but not one that only starts with it.
  out = out.replace(
    /\b(password|passwd|secret|token|credentials?|api[_-]?key|access[_-]?key|private[_-]?key|(?:secret|signing|encryption|master|hmac|shared|session|ssh)[_-]?key|client[_-]?secret|auth[_-]?token|bearer)(?![^\S\r\n]*[:=][^\S\r\n]*\[REDACTED\][^\S\r\n]*$)([^\S\r\n]*[:=][^\S\r\n]*)[^\r\n]+/gim,
    '$1$2[REDACTED]'
  );

  // The same three for credential keys in camelCase, like refreshToken.
  for (const [pattern, replacement] of CAMEL_PATTERNS) out = out.replace(pattern, replacement);

  return out;
}

/**
 * Returns the end of a run of base64url characters (`[A-Za-z0-9_-]`).
 *
 * @param text - Text being scanned.
 * @param from - Index where the run starts.
 * @returns Index after the last base64url character.
 */
function base64UrlRunEnd(text: string, from: number): number {
  let end = from;
  while (end < text.length) {
    const code = text.charCodeAt(end);
    const isBase64Url =
      (code >= 48 && code <= 57) || // 0-9
      (code >= 65 && code <= 90) || // A-Z
      (code >= 97 && code <= 122) || // a-z
      code === 95 || // _
      code === 45; // -
    if (!isBase64Url) break;
    end++;
  }
  return end;
}

/**
 * Replaces JWTs (`eyJ<b64>.eyJ<b64>.<b64>`) with `[REDACTED]`.
 *
 * Matches `/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g` in linear
 * time; that regex is quadratic on long runs of `eyJ`.
 *
 * @param text - Text that may contain JWTs.
 * @returns The text with each JWT replaced.
 */
function redactJwts(text: string): string {
  let out = '';
  let copied = 0;
  let search = 0;
  for (;;) {
    const start = text.indexOf('eyJ', search);
    if (start === -1) break;
    // The dots aren't base64url, so each segment must span a whole run.
    const headerEnd = base64UrlRunEnd(text, start + 3);
    const payloadStart = headerEnd + 4;
    const payloadEnd = base64UrlRunEnd(text, payloadStart);
    const signatureEnd = base64UrlRunEnd(text, payloadEnd + 1);
    const isJwt =
      headerEnd > start + 3 &&
      text.startsWith('.eyJ', headerEnd) &&
      payloadEnd > payloadStart &&
      text[payloadEnd] === '.' &&
      signatureEnd > payloadEnd + 1;
    if (!isJwt) {
      // Any later `eyJ` in the same run shares this header end and fails too.
      search = Math.max(headerEnd, start + 1);
      continue;
    }
    out += text.slice(copied, start) + '[REDACTED]';
    copied = search = signatureEnd;
  }
  return out + text.slice(copied);
}

// The scanner below replaces a regex that was quadratic on adversarial input
// (`/-----BEGIN [A-Z ]+-----[\s\S]*?-----END [A-Z ]+-----/g`) with a linear
// scan that matches the same text.

/**
 * Returns the index after a `[A-Z ]+-----` PEM label starting at `from`.
 *
 * @param text - Text being scanned.
 * @param from - Index where the label should start.
 * @returns Index after the closing dashes, or -1 when there is no label.
 */
function matchPemLabel(text: string, from: number): number {
  let end = from;
  while (end < text.length) {
    const code = text.charCodeAt(end);
    if (code !== 32 && (code < 65 || code > 90)) break;
    end++;
  }
  return end > from && text.startsWith('-----', end) ? end + 5 : -1;
}

/**
 * Replaces `-----BEGIN X----- ... -----END Y-----` blocks with `[REDACTED]`.
 *
 * @param text - Text that may contain PEM blocks.
 * @returns The text with each PEM block replaced.
 */
function redactPemBlocks(text: string): string {
  const begin = '-----BEGIN ';
  const end = '-----END ';
  let out = '';
  let copied = 0;
  let search = 0;
  for (;;) {
    const blockStart = text.indexOf(begin, search);
    if (blockStart === -1) break;
    const headerEnd = matchPemLabel(text, blockStart + begin.length);
    if (headerEnd === -1) {
      search = blockStart + 1;
      continue;
    }
    let blockEnd = -1;
    for (let footer = text.indexOf(end, headerEnd); footer !== -1; ) {
      blockEnd = matchPemLabel(text, footer + end.length);
      if (blockEnd !== -1) break;
      footer = text.indexOf(end, footer + 1);
    }
    // Later blocks start after this header, so they cannot find a footer either.
    if (blockEnd === -1) break;
    out += text.slice(copied, blockStart) + '[REDACTED]';
    copied = search = blockEnd;
  }
  return out + text.slice(copied);
}

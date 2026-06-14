import jsYaml from 'js-yaml';

/** YAML mapping returned by the untrusted parser boundary. */
type ParsedYaml = Record<string, unknown>;

/** Metadata extracted from a valid Kubernetes manifest. */
export interface ParsedKubernetesYaml {
  /** Whether the YAML contains a Kubernetes `apiVersion` and `kind`. */
  isValid: boolean;
  /** Kubernetes resource kind. */
  resourceType?: string;
  /** Resource name, when present. */
  name?: string;
  /** Resource namespace, defaulting to `default`. */
  namespace?: string;
}

/** Extracted Kubernetes manifest and optional surrounding title. */
export interface ExtractedYamlContent {
  /** Raw manifest content with indentation preserved. */
  yaml: string;
  /** Kubernetes resource kind. */
  resourceType: string;
  /** Human-authored title preceding a dashed manifest block. */
  title?: string;
}

/** Describes a named YAML example used in the UI. */
export interface YamlExample {
  /** Display title for the example. */
  title: string;
  /** Suggested filename for the YAML example. */
  filename: string;
  /** Raw YAML manifest content. */
  yaml: string;
  /** Kubernetes resource kind represented by the YAML. */
  resourceType: string;
}

/**
 * Checks whether an untrusted YAML value is a mapping.
 *
 * @param value - Parsed YAML value.
 * @returns Whether the value can be safely accessed by string keys.
 */
function isRecord(value: unknown): value is ParsedYaml {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Returns a non-empty string field from a parsed mapping.
 *
 * @param record - Mapping to inspect.
 * @param key - Field name.
 * @returns Trimmed string field, or undefined when absent or invalid.
 */
function getString(record: ParsedYaml, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/**
 * Loads the first YAML document as a mapping.
 *
 * @param text - YAML source text.
 * @returns First document mapping, or null for empty and scalar documents.
 * @throws When the YAML syntax is malformed.
 */
function loadFirstYamlDocument(text: string): ParsedYaml | null {
  const documents = jsYaml.loadAll(text);
  return isRecord(documents[0]) ? documents[0] : null;
}

/**
 * Reads Kubernetes resource identity from a parsed mapping.
 *
 * @param parsed - Parsed YAML mapping.
 * @returns Resource metadata, or null when required fields are missing.
 */
function getKubernetesIdentity(parsed: ParsedYaml): Omit<ParsedKubernetesYaml, 'isValid'> | null {
  const apiVersion = getString(parsed, 'apiVersion');
  const resourceType = getString(parsed, 'kind');
  if (!apiVersion || !resourceType) return null;

  const metadata = isRecord(parsed.metadata) ? parsed.metadata : null;
  return {
    resourceType,
    name: metadata ? getString(metadata, 'name') : undefined,
    namespace: (metadata && getString(metadata, 'namespace')) || 'default',
  };
}

/**
 * Parses Kubernetes YAML and extracts basic resource metadata.
 *
 * Multi-document input is accepted and only its first document is inspected.
 *
 * @param yamlStr - YAML manifest source.
 * @returns Validation result and resource metadata when valid.
 */
export function parseKubernetesYAML(yamlStr: string): ParsedKubernetesYaml {
  try {
    const parsed = loadFirstYamlDocument(yamlStr);
    if (!parsed) return { isValid: false };

    const identity = getKubernetesIdentity(parsed);
    return identity ? { isValid: true, ...identity } : { isValid: false };
  } catch (error: unknown) {
    console.warn('Failed to parse YAML:', error);
    return { isValid: false };
  }
}

/**
 * Adds a valid Kubernetes manifest to an extraction result.
 *
 * @param results - Mutable extraction result owned by the caller.
 * @param yaml - Candidate YAML source.
 * @param title - Optional human-authored title.
 * @returns Whether a valid manifest was appended.
 */
function appendYamlResult(results: ExtractedYamlContent[], yaml: string, title?: string): boolean {
  const normalizedYaml = yaml.trim();
  if (!normalizedYaml) return false;

  try {
    const parsed = loadFirstYamlDocument(normalizedYaml);
    if (!parsed) return false;
    const identity = getKubernetesIdentity(parsed);
    if (!identity?.resourceType) return false;

    results.push({
      yaml: normalizedYaml,
      resourceType: identity.resourceType,
      ...(title ? { title } : {}),
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Appends the longest valid Kubernetes prefix from a bare response section.
 *
 * This preserves YAML-internal blank lines while excluding trailing prose that
 * makes the complete candidate invalid.
 *
 * @param results - Mutable extraction result owned by the caller.
 * @param lines - Candidate lines beginning with `apiVersion`.
 * @returns Whether a valid prefix was appended.
 */
function appendLongestBareYamlResult(results: ExtractedYamlContent[], lines: string[]): boolean {
  for (let end = lines.length; end > 0; end -= 1) {
    if (appendYamlResult(results, lines.slice(0, end).join('\n'))) return true;
  }
  return false;
}

/**
 * Extracts Kubernetes YAML snippets from markdown, dashed blocks, or plain text.
 *
 * Fenced blocks take precedence over dashed blocks, which take precedence over
 * bare manifests. Bare extraction retains the longest valid YAML prefix so
 * internal blank lines are preserved without including trailing prose.
 *
 * @param content - Assistant response content that may contain manifests.
 * @returns Extracted manifests in source order, or null when none are valid.
 */
export function extractYamlContent(content: string): ExtractedYamlContent[] | null {
  if (!content) return null;

  const results: ExtractedYamlContent[] = [];
  const fencedPattern = /^(`{3,}|~{3,})(?:ya?ml)?[^\S\r\n]*\r?\n([\s\S]*?)^\1[^\S\r\n]*$/gm;
  let match: RegExpExecArray | null;

  while ((match = fencedPattern.exec(content)) !== null) {
    appendYamlResult(results, match[2]);
  }
  if (results.length > 0) return results;

  const dashedPattern = /^-{3,}[^\S\r\n]*\r?\n([\s\S]*?)\r?\n^-{3,}[^\S\r\n]*$/gm;
  while ((match = dashedPattern.exec(content)) !== null) {
    const precedingContent = content.slice(0, match.index).trim();
    const possibleTitle = precedingContent.slice(precedingContent.lastIndexOf('\n') + 1).trim();
    appendYamlResult(results, match[1], possibleTitle || undefined);
  }
  if (results.length > 0) return results;

  const lines = content.split(/\r?\n/);
  let currentYaml: string[] | null = null;

  for (const line of lines) {
    if (line.trimStart().startsWith('apiVersion:')) {
      if (currentYaml) appendLongestBareYamlResult(results, currentYaml);
      currentYaml = [line];
    } else if (currentYaml) {
      currentYaml.push(line);
    }
  }
  if (currentYaml) appendLongestBareYamlResult(results, currentYaml);

  return results.length > 0 ? results : null;
}

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
 * Each match is replaced with `[REDACTED]`. The original string is never
 * modified; a new string is returned.
 *
 * @param input - Raw text that may contain credentials or secret material.
 * @returns A copy of the input with recognized secret patterns replaced.
 */
export function redactSecrets(input: string): string {
  let out = input;

  // Kubernetes Secret payloads first: redact every value under `data` /
  // `stringData` regardless of the key name (the generic key-name patterns
  // below only catch credential-sounding keys and would miss entries like
  // `DATABASE_URL` or `session`). Covers both `-o json` and `-o yaml` output.
  out = redactKubernetesSecretValues(out);

  // PEM blocks — run first so private-key content is gone before the
  // generic key-value patterns could match individual lines inside them.
  out = out.replace(/-----BEGIN [A-Z ]+-----[\s\S]*?-----END [A-Z ]+-----/g, '[REDACTED]');

  // JWT tokens: three base64url segments separated by dots.
  // The first two start with "eyJ" (base64 of '{"').
  out = out.replace(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED]');

  // AWS long-lived and temporary access key IDs.
  out = out.replace(/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, '[REDACTED]');

  // AWS environment/JSON credential names are explicit because underscores
  // prevent the generic key-name pattern's word boundary from matching them.
  out = out.replace(
    /"(AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|AWS_SESSION_TOKEN)"(\s*:\s*)"[^"]*"/gi,
    '"$1"$2"[REDACTED]"'
  );
  out = out.replace(
    /\b(AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|AWS_SESSION_TOKEN)(\s*[:=]\s*)[^\r\n]+/gi,
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
  // Azure Storage account keys and connection-string key material.
  out = out.replace(
    /\b(AccountKey|SharedAccessKey|SharedAccessSignature)\s*=\s*[^;"'\s]+/gi,
    '$1=[REDACTED]'
  );

  // HTTP Authorization / credential headers — JSON-quoted form first so the
  // quoted key and value are matched before the unquoted fallback below.
  // e.g. "Authorization": "Bearer eyJ..." → "Authorization": "[REDACTED]"
  out = out.replace(
    /"(authorization|x-api-key|x-auth-token)"(\s*:\s*)"[^"]*"/gi,
    '"$1"$2"[REDACTED]"'
  );

  // HTTP Authorization / credential headers in YAML/plain-text (unquoted key).
  // Match everything to end of line so multi-token values like "Bearer <tok>"
  // are fully redacted rather than just the scheme word.
  out = out.replace(
    /\b(authorization|x-api-key|x-auth-token)(\s*:\s*)[^\r\n]+/gi,
    '$1$2[REDACTED]'
  );

  // Kubernetes kubeconfig inline base64 certificate / key fields.
  out = out.replace(
    /\b(certificate-authority-data|client-certificate-data|client-key-data|client-certificate|client-key)\s*:\s*\S+/gi,
    '$1: [REDACTED]'
  );

  // Generic credential key/value — JSON-quoted form first.
  // Covers "password": "s3cr3t", "token": "abc 123", etc.
  // Values in JSON can contain spaces, so match [^"]* rather than \S+.
  out = out.replace(
    /"(password|passwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|client[_-]?secret|auth[_-]?token|bearer)"(\s*:\s*)"[^"]*"/gi,
    '"$1"$2"[REDACTED]"'
  );

  // Generic credential key=value or key: value patterns (unquoted / YAML / env-var).
  // Matches common secret-sounding key names and redacts through end-of-line so
  // YAML/plain-text values containing spaces cannot leak trailing words.
  // Capture the separator including surrounding whitespace in group $2 and replay
  // it so the output preserves the original style exactly:
  //   passwd=s3cr3t    → passwd=[REDACTED]
  //   password: hunter → password: [REDACTED]
  // Negative lookahead prevents double-redacting already-replaced values.
  out = out.replace(
    /\b(password|passwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|client[_-]?secret|auth[_-]?token|bearer)(?![^\S\r\n]*[:=][^\S\r\n]*\[REDACTED\])([^\S\r\n]*[:=][^\S\r\n]*)[^\r\n]+/gi,
    '$1$2[REDACTED]'
  );

  return out;
}

/**
 * Redacts every value under `data` / `stringData` of Kubernetes Secret objects.
 *
 * Unlike the key-name heuristics, this removes secret material even when the
 * data keys are arbitrary (e.g. `DATABASE_URL`, `session`). Handles both JSON
 * (`kubectl -o json`, including `List` responses) and YAML (`-o yaml`) output.
 * Input that does not look like a Secret is returned unchanged so ConfigMaps
 * and unrelated payloads are not over-redacted.
 *
 * @param input - Raw text that may contain one or more Kubernetes Secrets.
 * @returns The input with Secret data values replaced by `[REDACTED]`.
 */
function redactKubernetesSecretValues(input: string): string {
  // Cheap early-out: only act when the text mentions a Secret kind.
  if (!/\bkind\b["\s]*:\s*["']?Secret\b/i.test(input)) {
    return input;
  }

  const fencedJson = input.replace(/```json\s*([\s\S]*?)```/gi, (block, body: string) => {
    try {
      const parsed: unknown = JSON.parse(body.trim());
      return redactSecretsInParsedJson(parsed)
        ? `\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``
        : block;
    } catch {
      return block;
    }
  });
  if (fencedJson !== input) return fencedJson;

  const trimmed = input.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (redactSecretsInParsedJson(parsed)) {
        return JSON.stringify(parsed, null, 2);
      }
      return input;
    } catch {
      // Not valid JSON — fall through to the YAML line scanner.
    }
  }

  return redactKubernetesSecretValuesYaml(input);
}

/**
 * Recursively redacts `data` / `stringData` values of Secret objects in a
 * parsed JSON structure. Mutates the value in place.
 *
 * @param value - Parsed JSON value to walk.
 * @returns Whether any redaction was applied.
 */
function redactSecretsInParsedJson(value: unknown): boolean {
  let changed = false;

  if (Array.isArray(value)) {
    for (const item of value) {
      changed = redactSecretsInParsedJson(item) || changed;
    }
    return changed;
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;

    if (obj.kind === 'Secret') {
      for (const field of ['data', 'stringData'] as const) {
        const bag = obj[field];
        if (bag && typeof bag === 'object' && !Array.isArray(bag)) {
          for (const key of Object.keys(bag as Record<string, unknown>)) {
            (bag as Record<string, unknown>)[key] = '[REDACTED]';
            changed = true;
          }
        }
      }
    }

    for (const key of Object.keys(obj)) {
      changed = redactSecretsInParsedJson(obj[key]) || changed;
    }
  }

  return changed;
}

/**
 * Line-based fallback that redacts `data` / `stringData` blocks of YAML Secret
 * documents. Over-redaction is preferred to leakage, so once a `Secret` kind is
 * seen the block scan stays active until a non-Secret `kind` or document break.
 *
 * @param input - YAML text that may contain Secret documents.
 * @returns The YAML with Secret data values replaced by `[REDACTED]`.
 */
function redactKubernetesSecretValuesYaml(input: string): string {
  const documents = input.split(/(^\s*---\s*$)/m);
  return documents
    .map(document => {
      if (
        /^\s*---\s*$/.test(document) ||
        !/^\s*(?:-\s*)?kind:\s*["']?Secret["']?\s*$/m.test(document)
      ) {
        return document;
      }
      return redactSecretYamlDocument(document);
    })
    .join('');
}

/**
 * Redacts data blocks in one YAML document already identified as a Secret.
 *
 * @param input - One Kubernetes Secret YAML document.
 * @returns YAML with data and stringData values replaced.
 */
function redactSecretYamlDocument(input: string): string {
  const lines = input.split('\n');
  let dataBlockIndent: number | null = null;
  let blockScalarIndent: number | null = null;

  const redacted = lines.map(line => {
    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    if (blockScalarIndent !== null) {
      if (line.trim() === '' || indent > blockScalarIndent) return '';
      blockScalarIndent = null;
    }

    const dataMatch = line.match(/^(\s*)(data|stringData):\s*$/);
    if (dataMatch) {
      dataBlockIndent = dataMatch[1].length;
      return line;
    }

    if (dataBlockIndent !== null && line.trim() !== '') {
      const entryMatch = line.match(/^(\s*)([^\s:][^:]*):\s*(.*)$/);
      if (entryMatch) {
        const entryIndent = entryMatch[1].length;
        if (entryIndent > dataBlockIndent) {
          if (/^[|>][-+]?\s*$/.test(entryMatch[3])) blockScalarIndent = entryIndent;
          return `${entryMatch[1]}${entryMatch[2]}: [REDACTED]`;
        }
        // Dedented back out of the data block; leave sibling keys intact.
        dataBlockIndent = null;
      }
    }

    return line;
  });

  return redacted.join('\n');
}

/**
 * Returns a deep redacted copy of a JSON-like value.
 *
 * @param value - Structured tool result or nested JSON-compatible value.
 * @returns A deep copy with strings and Kubernetes Secret payloads redacted.
 */
export function redactSecretsInValue(value: unknown): unknown {
  if (typeof value === 'string') return redactSecrets(value);
  if (Array.isArray(value)) return value.map(redactSecretsInValue);
  if (!value || typeof value !== 'object') return value;

  const copy: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    copy[key] = redactSecretsInValue(item);
  }
  if (copy.kind === 'Secret') {
    for (const field of ['data', 'stringData'] as const) {
      const bag = copy[field];
      if (bag && typeof bag === 'object' && !Array.isArray(bag)) {
        copy[field] = Object.fromEntries(
          Object.keys(bag as Record<string, unknown>).map(key => [key, '[REDACTED]'])
        );
      }
    }
  }
  return copy;
}

/*
 * Copyright 2026 The Kubernetes Authors
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
 * Hides what looks like a credential before values or manifests are displayed.
 *
 * This is a display courtesy, not an access control: whoever sees a release can already read the
 * Secret Helm stores it in. It keeps passwords off the screen until the user asks for them.
 */
import { isMap, isScalar, isSeq, parseAllDocuments } from 'yaml';
import { isPlainObject, ValuesMap } from './release';

export const MASK = '********';

const SENSITIVE_KEY =
  /pass(word|wd|phrase)|secret|token|credential|authorization|htpasswd|connection[-_.]?string|(private|api|access|signing|encryption|license|ssh|master|shared)[-_.]?key/i;

/** Keys that point to a secret (its name, its path...) rather than hold one. */
const REFERENCE_KEY =
  /^existing|pullsecrets?$|(names?|refs?|paths?|files?|dirs?|enabled|type|annotations|labels)$/i;

/** Private keys and URLs carrying credentials are sensitive whatever the key they sit under. */
const SENSITIVE_VALUE =
  /-----BEGIN [A-Z ]*PRIVATE KEY-----|\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:[^\s/@]+@/i;

/** YAML keywords carry no secret; masking them would only hide the structure. */
const KEYWORD_VALUE = /^(true|false|null|~)$/i;

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY.test(key) && !REFERENCE_KEY.test(key);
}

function isMaskableScalar(value: unknown): boolean {
  if (typeof value === 'string') return value !== '' && !KEYWORD_VALUE.test(value);
  return typeof value === 'number' || typeof value === 'bigint';
}

export interface MaskResult<T> {
  value: T;
  /** Number of values replaced by the mask. */
  hidden: number;
}

interface Counter {
  hidden: number;
}

/** Masks every scalar found below a sensitive key. */
function maskEverything(value: unknown, counter: Counter): unknown {
  if (Array.isArray(value)) return value.map(item => maskEverything(item, counter));
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, maskEverything(entry, counter)])
    );
  }
  if (!isMaskableScalar(value)) return value;
  counter.hidden += 1;
  return MASK;
}

/** `{ name: DB_PASSWORD, value: ... }`, the usual shape of an environment variable. */
function isSensitiveVariable(entry: Record<string, unknown>): boolean {
  return typeof entry.name === 'string' && 'value' in entry && SENSITIVE_KEY.test(entry.name);
}

function maskNode(value: unknown, counter: Counter): unknown {
  if (Array.isArray(value)) return value.map(item => maskNode(item, counter));
  if (isPlainObject(value)) {
    const sensitiveVariable = isSensitiveVariable(value);
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        (sensitiveVariable && key === 'value') || isSensitiveKey(key)
          ? maskEverything(entry, counter)
          : maskNode(entry, counter),
      ])
    );
  }
  if (typeof value === 'string' && SENSITIVE_VALUE.test(value)) {
    counter.hidden += 1;
    return MASK;
  }
  return value;
}

/**
 * Returns a copy of Helm values where everything below a sensitive key is masked, along with the
 * values that are credentials by themselves.
 */
export function maskValues(values: ValuesMap): MaskResult<ValuesMap> {
  const counter: Counter = { hidden: 0 };
  return { value: maskNode(values, counter) as ValuesMap, hidden: counter.hidden };
}

/** The manifest could not be parsed, so nothing guarantees that its secrets are hidden. */
export class ManifestMaskError extends Error {
  constructor() {
    super('The manifest could not be parsed to hide its sensitive values.');
    this.name = 'ManifestMaskError';
  }
}

function maskYamlEverything(node: unknown, counter: Counter): void {
  if (isScalar(node)) {
    if (isMaskableScalar(node.value)) {
      node.value = MASK;
      // A block scalar would otherwise keep its multi-line style.
      node.type = 'PLAIN';
      counter.hidden += 1;
    }
  } else if (isMap(node)) {
    node.items.forEach(pair => maskYamlEverything(pair.value, counter));
  } else if (isSeq(node)) {
    node.items.forEach(item => maskYamlEverything(item, counter));
  }
}

function scalarText(node: unknown): string | undefined {
  return isScalar(node) && typeof node.value === 'string' ? node.value : undefined;
}

/**
 * Masks a Kubernetes resource in place. A rendered manifest names many things after secrets
 * (volumes, references, RBAC rules): only the direct value of a sensitive key is hidden, plus the
 * whole content of the Secret resources.
 */
function maskYamlNode(node: unknown, counter: Counter, isSecretResource: boolean): void {
  if (isScalar(node)) {
    if (typeof node.value === 'string' && SENSITIVE_VALUE.test(node.value)) {
      maskYamlEverything(node, counter);
    }
    return;
  }
  if (isSeq(node)) {
    node.items.forEach(item => maskYamlNode(item, counter, false));
    return;
  }
  if (!isMap(node)) return;

  const variableName = scalarText(node.get('name', true));
  const sensitiveVariable = variableName !== undefined && SENSITIVE_KEY.test(variableName);

  for (const pair of node.items) {
    const key = scalarText(pair.key) ?? '';
    if (isSecretResource && (key === 'data' || key === 'stringData')) {
      maskYamlEverything(pair.value, counter);
    } else if (sensitiveVariable && key === 'value') {
      maskYamlEverything(pair.value, counter);
    } else if (isSensitiveKey(key) && isScalar(pair.value)) {
      maskYamlEverything(pair.value, counter);
    } else {
      maskYamlNode(pair.value, counter, false);
    }
  }
}

/**
 * Returns the rendered manifest with its sensitive values masked.
 *
 * The manifest is parsed without interpreting its scalars, so everything that is not masked is
 * printed as Helm rendered it, comments included.
 *
 * @throws ManifestMaskError when the manifest is not valid YAML: it must not be shown as is.
 */
export function maskManifest(manifest: string): MaskResult<string> {
  const counter: Counter = { hidden: 0 };
  const rendered: string[] = [];

  try {
    for (const document of parseAllDocuments(manifest, { schema: 'failsafe' })) {
      if (document.errors.length > 0) throw new ManifestMaskError();
      const root = document.contents;
      if (root === null) continue;
      const isSecretResource = isMap(root) && scalarText(root.get('kind', true)) === 'Secret';
      maskYamlNode(root, counter, isSecretResource);
      document.directives = undefined;
      rendered.push(document.toString({ lineWidth: 0 }));
    }
  } catch {
    throw new ManifestMaskError();
  }

  return { value: rendered.join('---\n'), hidden: counter.hidden };
}

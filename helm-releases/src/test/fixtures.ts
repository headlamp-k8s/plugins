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

import { gzipSync } from 'node:zlib';

/** Encodes a release the way Helm then Kubernetes do: base64(base64(gzip(JSON))). */
export function encodeRelease(release: unknown, compress: boolean = true): string {
  const json = Buffer.from(JSON.stringify(release));
  const helmEncoded = (compress ? gzipSync(json) : json).toString('base64');
  return Buffer.from(helmEncoded).toString('base64');
}

export interface ReleaseFixture {
  namespace?: string;
  name?: string;
  revision?: number;
  status?: string;
  chartVersion?: string;
  /** `icon` of the chart metadata. */
  icon?: string;
  userValues?: Record<string, unknown>;
  defaultValues?: Record<string, unknown>;
  manifest?: string;
  notes?: string;
}

/** A release as Helm serializes it in its storage. */
export function rawRelease(fixture: ReleaseFixture = {}) {
  const {
    namespace = 'team-a',
    name = 'web',
    revision = 1,
    status = 'deployed',
    chartVersion = '1.2.3',
    icon,
    userValues = { replicaCount: 2 },
    defaultValues = { replicaCount: 1, image: { tag: 'stable' } },
    manifest = '---\n# Source: web/templates/service.yaml\napiVersion: v1\nkind: Service\n',
    notes = 'Thank you for installing web.',
  } = fixture;

  return {
    name,
    namespace,
    version: revision,
    info: {
      first_deployed: '2026-04-02T18:49:13.512487578+02:00',
      last_deployed: '2026-11-17T10:38:29.273308353Z',
      description: revision === 1 ? 'Install complete' : 'Upgrade complete',
      status,
      notes,
    },
    chart: {
      metadata: {
        name: 'web',
        version: chartVersion,
        appVersion: '4.5.6',
        description: 'A web application',
        ...(icon === undefined ? {} : { icon }),
      },
      templates: [{ name: 'templates/service.yaml', data: 'aGVhdnk=' }],
      values: defaultValues,
      files: [],
    },
    config: userValues,
    manifest,
    hooks: [],
  };
}

/** The Secret in which Helm stores a revision of a release. */
export function releaseSecret(fixture: ReleaseFixture = {}) {
  const { namespace = 'team-a', name = 'web', revision = 1, status = 'deployed' } = fixture;

  return {
    apiVersion: 'v1',
    kind: 'Secret',
    type: 'helm.sh/release.v1',
    metadata: {
      name: `sh.helm.release.v1.${name}.v${revision}`,
      namespace,
      labels: { name, owner: 'helm', status, version: String(revision) },
    },
    data: { release: encodeRelease(rawRelease(fixture)) },
  };
}

export function secretList(items: unknown[], continueToken?: string) {
  return {
    apiVersion: 'v1',
    kind: 'SecretList',
    metadata: continueToken ? { continue: continueToken } : {},
    items,
  };
}

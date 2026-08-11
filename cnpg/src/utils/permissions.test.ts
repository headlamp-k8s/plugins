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

import { describeMissingPermission, describeMissingPermissions, isForbidden } from './permissions';

describe('isForbidden', () => {
  it('recognises a 403 response', () => {
    expect(isForbidden({ status: 403 })).toBe(true);
  });

  it('recognises a 401 response, which is also a permission problem', () => {
    expect(isForbidden({ status: 401 })).toBe(true);
  });

  it('does not treat a 404 as a permission problem', () => {
    expect(isForbidden({ status: 404 })).toBe(false);
  });

  it('does not treat a missing error as a permission problem', () => {
    expect(isForbidden(null)).toBe(false);
  });

  it('falls back to the message when no status is present', () => {
    expect(isForbidden({ message: 'clusters.postgresql.cnpg.io is forbidden' })).toBe(true);
  });
});

describe('describeMissingPermission', () => {
  it('names the verb, resource and API group for a cluster-wide denial', () => {
    expect(
      describeMissingPermission({
        verb: 'list',
        resource: 'clusters',
        apiGroup: 'postgresql.cnpg.io',
      })
    ).toBe('list clusters.postgresql.cnpg.io at the cluster scope');
  });

  it('names the namespace when the request was namespaced', () => {
    expect(
      describeMissingPermission({
        verb: 'list',
        resource: 'backups',
        apiGroup: 'postgresql.cnpg.io',
        namespace: 'db',
      })
    ).toBe('list backups.postgresql.cnpg.io in namespace "db"');
  });
});

describe('describeMissingPermissions', () => {
  const namespace = 'db';
  const apiGroup = 'postgresql.cnpg.io';

  it('returns one entry per denied resource, each independently readable', () => {
    expect(
      describeMissingPermissions({
        verb: 'list',
        resources: ['backups', 'scheduledbackups'],
        apiGroup,
        namespace,
      })
    ).toEqual([
      'list backups.postgresql.cnpg.io in namespace "db"',
      'list scheduledbackups.postgresql.cnpg.io in namespace "db"',
    ]);
  });

  // Two adjacent permissions used to be rendered as inline code spans separated
  // only by a margin, so they read as one run-on rule: `... in namespace "db"
  // list scheduledbackups ...`. Keeping them as separate strings is what lets
  // the view give each its own line.
  it('never joins two permissions into a single string', () => {
    const described = describeMissingPermissions({
      verb: 'list',
      resources: ['backups', 'scheduledbackups'],
      apiGroup,
      namespace,
    });

    expect(described).toHaveLength(2);
    for (const entry of described) {
      expect(entry.match(/\blist\b/g)).toHaveLength(1);
    }
  });

  it('describes a single denial the same way describeMissingPermission does', () => {
    expect(describeMissingPermissions({ verb: 'get', resources: ['clusters'], apiGroup })).toEqual([
      describeMissingPermission({ verb: 'get', resource: 'clusters', apiGroup }),
    ]);
  });

  it('returns nothing when no resource was denied', () => {
    expect(
      describeMissingPermissions({ verb: 'list', resources: [], apiGroup, namespace })
    ).toEqual([]);
  });
});

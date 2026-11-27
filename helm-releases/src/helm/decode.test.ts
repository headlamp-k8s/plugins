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

import { describe, expect, it } from 'vitest';
import { encodeRelease } from '../test/fixtures';
import { decodeReleasePayload, HelmDecodeError } from './decode';

async function decodeFailure(payload: unknown, maxBytes?: number) {
  try {
    await decodeReleasePayload(payload, maxBytes);
  } catch (error) {
    return error;
  }
  throw new Error('the payload was decoded');
}

describe('decodeReleasePayload', () => {
  it('decodes the release Helm stores in a Secret', async () => {
    const release = { name: 'web', version: 3, config: { accents: 'déployé ✓' } };

    expect(await decodeReleasePayload(encodeRelease(release))).toEqual(release);
  });

  it('decodes the uncompressed releases of old Helm versions', async () => {
    const release = { name: 'legacy', version: 1 };

    expect(await decodeReleasePayload(encodeRelease(release, false))).toEqual(release);
  });

  it.each([
    ['a Secret without payload', undefined, 'missing-payload'],
    ['an empty payload', '  ', 'missing-payload'],
    ['a payload that is not base64', '%%%', 'invalid-encoding'],
    [
      'a truncated archive',
      Buffer.from(Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0x01]).toString('base64')).toString(
        'base64'
      ),
      'invalid-encoding',
    ],
    [
      'a payload that is not JSON',
      Buffer.from(Buffer.from('not json').toString('base64')).toString('base64'),
      'invalid-json',
    ],
  ])('rejects %s', async (_case, payload, reason) => {
    const error = await decodeFailure(payload);

    expect(error).toBeInstanceOf(HelmDecodeError);
    expect((error as HelmDecodeError).reason).toBe(reason);
  });

  it('refuses a release larger than the limit once decompressed', async () => {
    const error = await decodeFailure(encodeRelease({ manifest: 'x'.repeat(4096) }), 1024);

    expect((error as HelmDecodeError).reason).toBe('too-large');
  });

  it('never repeats the payload in its error message', async () => {
    const secret = 'hunter2-not-json';
    const payload = Buffer.from(Buffer.from(secret).toString('base64')).toString('base64');

    expect(((await decodeFailure(payload)) as Error).message).not.toContain(secret);
  });
});

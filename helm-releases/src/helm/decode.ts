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
 * Helm stores a release in a Secret as base64(gzip(JSON)); Kubernetes then encodes the Secret
 * data in base64 once more. This module reverses both layers, in the browser.
 */

export type HelmDecodeReason =
  | 'missing-payload'
  | 'invalid-encoding'
  | 'unsupported-browser'
  | 'too-large'
  | 'invalid-json';

const DECODE_MESSAGES: Record<HelmDecodeReason, string> = {
  'missing-payload': 'The release record has no payload.',
  'invalid-encoding': 'The release record is not a valid Helm payload.',
  'unsupported-browser': 'This browser cannot decompress Helm release records.',
  'too-large': 'The release record is too large to be displayed.',
  'invalid-json': 'The release record does not contain a valid Helm release.',
};

/** Never carries any part of the payload: the message is safe to display. */
export class HelmDecodeError extends Error {
  readonly reason: HelmDecodeReason;

  constructor(reason: HelmDecodeReason) {
    super(DECODE_MESSAGES[reason]);
    this.name = 'HelmDecodeError';
    this.reason = reason;
  }
}

/** Upper bound of a decompressed release, to stay clear of decompression bombs. */
export const MAX_RELEASE_BYTES = 64 * 1024 * 1024;

const GZIP_MAGIC = [0x1f, 0x8b, 0x08];

function decodeBase64(value: string): string {
  try {
    return atob(value.replace(/\s+/g, ''));
  } catch {
    throw new HelmDecodeError('invalid-encoding');
  }
}

function binaryToBytes(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function isGzip(bytes: Uint8Array): boolean {
  return GZIP_MAGIC.every((value, index) => bytes[index] === value);
}

async function gunzip(bytes: Uint8Array, maxBytes: number): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new HelmDecodeError('unsupported-browser');
  }

  const stream = new DecompressionStream('gzip');
  const writer = stream.writable.getWriter();
  // The write only settles once the output is consumed: it must not be awaited before reading.
  // A corrupted input rejects both sides; the reader below reports it.
  writer
    .write(bytes)
    .then(() => writer.close())
    .catch(() => undefined);

  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new HelmDecodeError('too-large');
      }
      chunks.push(value);
    }
  } catch (error) {
    throw error instanceof HelmDecodeError ? error : new HelmDecodeError('invalid-encoding');
  }

  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

/**
 * Decodes the `data.release` field of a Helm storage Secret into the raw release object.
 *
 * @param secretData - The value of `data.release`, as returned by the Kubernetes API.
 * @param maxBytes - Maximum size of the decompressed release.
 * @throws HelmDecodeError when the payload cannot be decoded.
 */
export async function decodeReleasePayload(
  secretData: unknown,
  maxBytes: number = MAX_RELEASE_BYTES
): Promise<unknown> {
  if (typeof secretData !== 'string' || secretData.trim() === '') {
    throw new HelmDecodeError('missing-payload');
  }

  // First layer: Kubernetes Secret data. Second layer: Helm's own base64.
  const helmEncoded = decodeBase64(secretData);
  let bytes = binaryToBytes(decodeBase64(helmEncoded));

  // Releases written by very old Helm versions are not compressed.
  if (isGzip(bytes)) {
    bytes = await gunzip(bytes, maxBytes);
  } else if (bytes.byteLength > maxBytes) {
    throw new HelmDecodeError('too-large');
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HelmDecodeError('invalid-json');
  }
}

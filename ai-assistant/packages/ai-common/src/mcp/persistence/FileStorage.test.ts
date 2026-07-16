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

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileStorage } from './FileStorage';

describe('FileStorage', () => {
  let dir: string;
  let file: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'filestorage-'));
    file = path.join(dir, 'state.json');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns null when the file does not exist', async () => {
    expect(await new FileStorage(file).read()).toBeNull();
  });

  it('round-trips data written asynchronously', async () => {
    const storage = new FileStorage(file);
    await storage.write('{"a":1}');
    expect(await storage.read()).toBe('{"a":1}');
  });

  it('round-trips data written synchronously', async () => {
    const storage = new FileStorage(file);
    storage.writeSync('{"b":2}');
    expect(await storage.read()).toBe('{"b":2}');
  });

  it('overwrites atomically without leaving temporary files behind', async () => {
    const storage = new FileStorage(file);
    await storage.write('{"v":1}');
    await storage.write('{"v":2}');
    storage.writeSync('{"v":3}');

    expect(await storage.read()).toBe('{"v":3}');
    const leftovers = fs.readdirSync(dir).filter(name => name.includes('.tmp'));
    expect(leftovers).toEqual([]);
  });

  it('supports concurrent writes without temporary-path collisions', async () => {
    const storage = new FileStorage(file);
    await Promise.all([storage.write('{"v":1}'), storage.write('{"v":2}')]);

    expect(['{"v":1}', '{"v":2}']).toContain(await storage.read());
    expect(fs.readdirSync(dir).filter(name => name.includes('.tmp'))).toEqual([]);
  });
});

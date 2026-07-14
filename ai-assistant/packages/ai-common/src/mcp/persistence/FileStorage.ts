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
 * Node.js file-system-backed StorageAdapter for MCPToolStateStore.
 *
 * This module imports `fs` and must only be included in Node / Electron main
 * process builds. Browser-targeted bundles should provide a different
 * StorageAdapter implementation (e.g. localStorage or IPC-backed).
 */

import * as fs from 'fs';
import type { Storage } from './Storage';

export class FileStorage implements Storage {
  constructor(private readonly path: string) {}

  async read(): Promise<string | null> {
    try {
      await fs.promises.access(this.path, fs.constants.F_OK);
      return await fs.promises.readFile(this.path, 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  write(data: string): Promise<void> {
    return fs.promises.writeFile(this.path, data, 'utf-8');
  }

  writeSync(data: string): void {
    fs.writeFileSync(this.path, data, 'utf-8');
  }
}

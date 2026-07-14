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
 * Pluggable persistence layer for MCPToolStateStore.
 *
 * Implementations are environment-specific:
 * - Node / Electron main process → FileStorageAdapter (uses `fs`)
 * - Browser / Electron renderer → a localStorage or IPC-backed adapter
 *
 * Keeping this interface in a module that does not import `fs` means bundlers
 * can tree-shake the Node-only implementation out of browser bundles.
 */
export interface Storage {
  /**
   * Read the stored JSON string.
   * @returns The raw JSON string, or `null` if no data has been persisted yet.
   */
  read(): Promise<string | null>;

  /**
   * Persist `data` asynchronously.
   * @returns A promise when completion can be observed, or void for synchronous adapters.
   */
  write(data: string): Promise<void> | void;

  /**
   * Persist `data` synchronously.
   * Used for shutdown paths and tests where the write must complete immediately.
   */
  writeSync(data: string): void;
}

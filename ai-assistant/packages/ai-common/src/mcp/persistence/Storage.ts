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
 * Pluggable persistence contract for `ToolStateStore`.
 *
 * Implementations are environment-specific:
 * - Node environments can use `FileStorage`, which uses `fs`.
 * - Browser environments can provide local-storage or host-bridge implementations.
 *
 * This contract does not import `fs`, so browser consumers can depend on it
 * without loading the Node-only implementation.
 */
export interface Storage {
  /**
   * Read the stored JSON string.
   * @returns The raw JSON string, or `null` if no data has been persisted yet.
   */
  read(): Promise<string | null>;

  /**
   * Persist `data` asynchronously.
   *
   * @param data - Serialized JSON data to persist.
   * @returns A promise when completion can be observed, or void for synchronous adapters.
   */
  write(data: string): Promise<void> | void;

  /**
   * Persist `data` synchronously.
   * Used for shutdown paths and tests where the write must complete immediately.
   *
   * @param data - Serialized JSON data to persist.
   * @returns No value.
   */
  writeSync(data: string): void;
}

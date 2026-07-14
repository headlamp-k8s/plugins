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
 * Minimal browser-safe EventEmitter compatible with Node's EventEmitter API.
 * Uses no platform-specific modules so it works in browser, Electron renderer,
 * and Node/CLI contexts without polyfills.
 */
export class EventEmitter {
  private _listeners: Map<string, Array<(...args: unknown[]) => void>> = new Map();
  /** Maps original once-listeners → their auto-removing wrappers so off() can find them. */
  private _onceWrappers: Map<(...args: unknown[]) => void, (...args: unknown[]) => void> =
    new Map();

  on(event: string, listener: (...args: unknown[]) => void): this {
    if (!this._listeners.has(event)) this._listeners.set(event, []);
    this._listeners.get(event)!.push(listener);
    return this;
  }

  off(event: string, listener: (...args: unknown[]) => void): this {
    // If the caller passes an original once-listener, resolve to its wrapper.
    const target = this._onceWrappers.get(listener) ?? listener;
    if (target !== listener) this._onceWrappers.delete(listener);
    const list = this._listeners.get(event);
    if (list)
      this._listeners.set(
        event,
        list.filter(l => l !== target)
      );
    return this;
  }

  removeListener(event: string, listener: (...args: unknown[]) => void): this {
    return this.off(event, listener);
  }

  once(event: string, listener: (...args: unknown[]) => void): this {
    const wrapper = (...args: unknown[]) => {
      this.off(event, wrapper);
      this._onceWrappers.delete(listener);
      listener(...args);
    };
    this._onceWrappers.set(listener, wrapper);
    return this.on(event, wrapper);
  }

  emit(event: string, ...args: unknown[]): boolean {
    const list = this._listeners.get(event);
    if (!list || list.length === 0) return false;
    list.slice().forEach(l => l(...args));
    return true;
  }
}

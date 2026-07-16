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

  /**
   * Registers a listener for an event, allowing duplicate registrations.
   *
   * @param event - Event name to observe.
   * @param listener - Callback invoked with emitted arguments.
   * @returns This emitter for chaining.
   */
  on(event: string, listener: (...args: unknown[]) => void): this {
    if (!this._listeners.has(event)) this._listeners.set(event, []);
    this._listeners.get(event)!.push(listener);
    return this;
  }

  /**
   * Removes all registrations matching a listener for an event.
   *
   * Original callbacks registered with {@link once} resolve to their wrappers.
   *
   * @param event - Event name whose listener should be removed.
   * @param listener - Original or directly registered callback to remove.
   * @returns This emitter for chaining.
   */
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

  /**
   * Removes a listener as an alias for {@link off}.
   *
   * @param event - Event name whose listener should be removed.
   * @param listener - Original or directly registered callback to remove.
   * @returns This emitter for chaining.
   */
  removeListener(event: string, listener: (...args: unknown[]) => void): this {
    return this.off(event, listener);
  }

  /**
   * Registers a listener that removes itself before its first invocation.
   *
   * @param event - Event name to observe once.
   * @param listener - Callback invoked with the first emitted arguments.
   * @returns This emitter for chaining.
   */
  once(event: string, listener: (...args: unknown[]) => void): this {
    /**
     * Removes once-listener state and invokes the original callback.
     *
     * @param args - Arguments emitted for the event.
     * @returns No value.
     */
    const wrapper = (...args: unknown[]) => {
      this.off(event, wrapper);
      this._onceWrappers.delete(listener);
      listener(...args);
    };
    this._onceWrappers.set(listener, wrapper);
    return this.on(event, wrapper);
  }

  /**
   * Emits an event to a snapshot of its current listeners.
   *
   * @param event - Event name to emit.
   * @param args - Arguments forwarded to each listener.
   * @returns Whether at least one listener was registered.
   */
  emit(event: string, ...args: unknown[]): boolean {
    const list = this._listeners.get(event);
    if (!list || list.length === 0) return false;
    list.slice().forEach(l => l(...args));
    return true;
  }
}

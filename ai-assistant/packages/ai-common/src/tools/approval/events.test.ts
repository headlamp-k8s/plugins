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

import { describe, expect, it, vi } from 'vitest';
import { EventEmitter } from './events';

// ── on / emit ─────────────────────────────────────────────────────────────────

describe('EventEmitter — on / emit', () => {
  it('calls a registered listener when the event is emitted', () => {
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.on('data', fn);
    ee.emit('data', 42);
    expect(fn).toHaveBeenCalledWith(42);
  });

  it('passes multiple arguments to the listener', () => {
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.on('evt', fn);
    ee.emit('evt', 'a', 'b', 'c');
    expect(fn).toHaveBeenCalledWith('a', 'b', 'c');
  });

  it('calls all listeners registered for the event', () => {
    const ee = new EventEmitter();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    ee.on('evt', fn1).on('evt', fn2);
    ee.emit('evt');
    expect(fn1).toHaveBeenCalled();
    expect(fn2).toHaveBeenCalled();
  });

  it('returns true when listeners exist', () => {
    const ee = new EventEmitter();
    ee.on('x', vi.fn());
    expect(ee.emit('x')).toBe(true);
  });

  it('returns false when no listeners are registered', () => {
    expect(new EventEmitter().emit('unknown')).toBe(false);
  });

  it('returns false when the listener list was emptied', () => {
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.on('x', fn);
    ee.off('x', fn);
    expect(ee.emit('x')).toBe(false);
  });

  it('does not call listeners for a different event', () => {
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.on('a', fn);
    ee.emit('b');
    expect(fn).not.toHaveBeenCalled();
  });

  it('on() is chainable', () => {
    const ee = new EventEmitter();
    expect(ee.on('x', vi.fn())).toBe(ee);
  });

  it('allows the same listener to be registered multiple times', () => {
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.on('evt', fn).on('evt', fn);
    ee.emit('evt');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('snapshot isolation: modifying listeners during emit does not affect current iteration', () => {
    const ee = new EventEmitter();
    const calls: number[] = [];
    ee.on('x', () => {
      calls.push(1);
      ee.on('x', () => calls.push(99)); // added mid-emit — should NOT fire this cycle
    });
    ee.on('x', () => calls.push(2));
    ee.emit('x');
    expect(calls).toEqual([1, 2]); // 99 must not appear
  });
});

// ── off ───────────────────────────────────────────────────────────────────────

describe('EventEmitter — off', () => {
  it('removes the listener so it is no longer called', () => {
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.on('x', fn);
    ee.off('x', fn);
    ee.emit('x');
    expect(fn).not.toHaveBeenCalled();
  });

  it('off() is chainable', () => {
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.on('x', fn);
    expect(ee.off('x', fn)).toBe(ee);
  });

  it('is a no-op for an event that was never registered', () => {
    const ee = new EventEmitter();
    expect(() => ee.off('never', vi.fn())).not.toThrow();
  });

  it('only removes the specified listener, not others for the same event', () => {
    const ee = new EventEmitter();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    ee.on('x', fn1).on('x', fn2);
    ee.off('x', fn1);
    ee.emit('x');
    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).toHaveBeenCalled();
  });

  it('removes ALL duplicate registrations of the same listener', () => {
    // Adding the same listener twice and calling off once removes both.
    // This is the documented behaviour for this implementation.
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.on('x', fn).on('x', fn);
    ee.off('x', fn);
    ee.emit('x');
    expect(fn).not.toHaveBeenCalled();
  });
});

// ── removeListener ────────────────────────────────────────────────────────────

describe('EventEmitter — removeListener', () => {
  it('is an alias for off', () => {
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.on('x', fn);
    ee.removeListener('x', fn);
    ee.emit('x');
    expect(fn).not.toHaveBeenCalled();
  });

  it('removeListener() is chainable', () => {
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.on('x', fn);
    expect(ee.removeListener('x', fn)).toBe(ee);
  });
});

// ── once ─────────────────────────────────────────────────────────────────────

describe('EventEmitter — once', () => {
  it('fires the listener exactly once then auto-removes it', () => {
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.once('x', fn);
    ee.emit('x');
    ee.emit('x');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('once() is chainable', () => {
    const ee = new EventEmitter();
    expect(ee.once('x', vi.fn())).toBe(ee);
  });

  it('passes arguments to the once listener', () => {
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.once('x', fn);
    ee.emit('x', 'hello', 42);
    expect(fn).toHaveBeenCalledWith('hello', 42);
  });

  it('BUG FIX: off(event, originalListener) removes a once listener before it fires', () => {
    // Before fix: once registers a wrapper, so off(event, original) was a no-op
    // and the listener still fired. Now the wrapper is tracked so off finds it.
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.once('x', fn);
    ee.off('x', fn); // should prevent fn from ever firing
    ee.emit('x');
    expect(fn).not.toHaveBeenCalled();
  });

  it('BUG FIX: removeListener(event, originalListener) removes a once listener', () => {
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.once('x', fn);
    ee.removeListener('x', fn);
    ee.emit('x');
    expect(fn).not.toHaveBeenCalled();
  });

  it('multiple once listeners for the same event each fire once', () => {
    const ee = new EventEmitter();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    ee.once('x', fn1).once('x', fn2);
    ee.emit('x');
    ee.emit('x');
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('once listener does not interfere with on listeners for the same event', () => {
    const ee = new EventEmitter();
    const onceFn = vi.fn();
    const onFn = vi.fn();
    ee.once('x', onceFn);
    ee.on('x', onFn);
    ee.emit('x');
    ee.emit('x');
    expect(onceFn).toHaveBeenCalledTimes(1);
    expect(onFn).toHaveBeenCalledTimes(2);
  });

  it('cleans up wrapper from _onceWrappers after firing', () => {
    // After the once listener fires, its wrapper entry should be removed
    // so there are no memory leaks.
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.once('x', fn);
    ee.emit('x');
    const wrappers = Reflect.get(ee, '_onceWrappers') as Map<unknown, unknown>;
    expect(wrappers.get(fn)).toBeUndefined();
  });
});

// ── edge cases ────────────────────────────────────────────────────────────────

describe('EventEmitter — edge cases', () => {
  it('supports emitting the same event from within a listener (re-entrant)', () => {
    const ee = new EventEmitter();
    const calls: string[] = [];
    ee.on('ping', () => {
      calls.push('ping');
      if (calls.length < 3) ee.emit('ping');
    });
    ee.emit('ping');
    expect(calls).toHaveLength(3);
  });

  it('handles events with no data (emit with no extra args)', () => {
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.on('tick', fn);
    ee.emit('tick');
    expect(fn).toHaveBeenCalledWith();
  });
});

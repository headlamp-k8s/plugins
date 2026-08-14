import { afterEach, describe, expect, it } from 'vitest';
import { getNativeGraphView } from './nativeGraphView';

function setPluginLib(value: unknown) {
  (window as any).pluginLib = value;
}

afterEach(() => {
  delete (window as any).pluginLib;
});

describe('getNativeGraphView', () => {
  it('returns null when the host has no pluginLib at all', () => {
    expect(getNativeGraphView()).toBeNull();
  });

  it('returns null on released Headlamp without the ResourceMap export', () => {
    setPluginLib({ K8s: {}, CommonComponents: {} });
    expect(getNativeGraphView()).toBeNull();
  });

  it('returns null when GraphView is missing or not renderable', () => {
    setPluginLib({ ResourceMap: {} });
    expect(getNativeGraphView()).toBeNull();
    setPluginLib({ ResourceMap: { GraphView: 'not-a-component' } });
    expect(getNativeGraphView()).toBeNull();
    setPluginLib({ ResourceMap: { GraphView: null } });
    expect(getNativeGraphView()).toBeNull();
  });

  it('returns a plain function component', () => {
    const GraphView = () => null;
    setPluginLib({ ResourceMap: { GraphView } });
    expect(getNativeGraphView()).toBe(GraphView);
  });

  it('returns a React.lazy-style exotic component (an object)', () => {
    // React.lazy/memo components are objects with a $$typeof tag, not
    // functions — the real upstream export is a lazy wrapper.
    const LazyGraphView = { $$typeof: Symbol.for('react.lazy') };
    setPluginLib({ ResourceMap: { GraphView: LazyGraphView } });
    expect(getNativeGraphView()).toBe(LazyGraphView);
  });
});

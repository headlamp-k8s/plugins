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

  it('fails closed on objects that are not renderable components', () => {
    // A bare object would reach React and throw "Element type is invalid";
    // detection must reject it so the fallback renderer is used instead.
    setPluginLib({ ResourceMap: { GraphView: {} } });
    expect(getNativeGraphView()).toBeNull();
    setPluginLib({ ResourceMap: { GraphView: { some: 'module-value' } } });
    expect(getNativeGraphView()).toBeNull();
    setPluginLib({ ResourceMap: { GraphView: { $$typeof: Symbol.for('react.element') } } });
    expect(getNativeGraphView()).toBeNull();
  });

  it('returns a plain function component (the actual upstream shape)', () => {
    const GraphView = () => null;
    setPluginLib({ ResourceMap: { GraphView } });
    expect(getNativeGraphView()).toBe(GraphView);
  });

  it('returns recognized exotic components (lazy, memo, forwardRef)', () => {
    for (const tag of ['react.lazy', 'react.memo', 'react.forward_ref']) {
      const Exotic = { $$typeof: Symbol.for(tag) };
      setPluginLib({ ResourceMap: { GraphView: Exotic } });
      expect(getNativeGraphView()).toBe(Exotic);
    }
  });
});

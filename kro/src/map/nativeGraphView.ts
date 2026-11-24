// Runtime feature detection for Headlamp's embeddable GraphView.
//
// kubernetes-sigs/headlamp#6992 exposes the Map renderer to plugins as
// window.pluginLib.ResourceMap, shipped in Headlamp v0.45.0. Hosts on
// 0.44.0 or older (and the released plugin SDK, 0.14.0) predate it. A
// build-time import of '@kinvolk/headlamp-plugin/lib/ResourceMap'
// would fail to typecheck against the released SDK and, worse, throw
// at plugin load on hosts where the runtime global is absent, killing
// the whole plugin. So the component is looked up on window.pluginLib
// at render time instead, and callers fall back to the local renderer
// when it is missing.
import type { GraphSource } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import type { ComponentType } from 'react';

/**
 * Props of Headlamp's GraphView the plugin relies on. Declared locally
 * because upstream does not export its props type through the barrel.
 */
export interface NativeGraphViewProps {
  /** Height of the map container, e.g. "500px". */
  height?: string;
  /**
   * Id of the initially selected node. The native view renders only the
   * selected node's connected component, so this doubles as the scoping
   * mechanism for embedded graphs.
   */
  defaultNodeSelection?: string;
  /** Sources rendered in addition to the globally registered ones. */
  defaultSources?: GraphSource[];
}

export type NativeGraphViewComponent = ComponentType<NativeGraphViewProps>;

// React's renderable exotic component tags. Function components (which is
// what upstream actually exports — a plain function wrapping the internal
// lazy component) are accepted directly; objects are accepted only when
// they carry one of these $$typeof markers. Anything else — {}, an
// unrelated module value, a string — must fail closed to the fallback
// renderer rather than reach React and throw "Element type is invalid".
const RENDERABLE_EXOTIC_TAGS = new Set<symbol>([
  Symbol.for('react.lazy'),
  Symbol.for('react.memo'),
  Symbol.for('react.forward_ref'),
]);

/**
 * The host's embeddable GraphView, or null when this Headlamp does not
 * expose one (or exposes something unrenderable — detection fails closed).
 */
export function getNativeGraphView(): NativeGraphViewComponent | null {
  const view: unknown = window.pluginLib?.ResourceMap?.GraphView;
  if (typeof view === 'function') {
    return view as NativeGraphViewComponent;
  }
  if (typeof view === 'object' && view !== null) {
    const tag = (view as { $$typeof?: symbol }).$$typeof;
    if (tag !== undefined && RENDERABLE_EXOTIC_TAGS.has(tag)) {
      return view as NativeGraphViewComponent;
    }
  }
  return null;
}

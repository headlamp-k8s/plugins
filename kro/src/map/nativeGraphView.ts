// Runtime feature detection for Headlamp's embeddable GraphView.
//
// kubernetes-sigs/headlamp#6992 (merged 2026-08-14) exposes the Map
// renderer to plugins as window.pluginLib.ResourceMap, but no released
// Headlamp (<= 0.44.0) or plugin SDK (<= 0.14.0) contains it yet. A
// build-time import of '@kinvolk/headlamp-plugin/lib/ResourceMap'
// would fail to typecheck against the released SDK and, worse, throw
// at plugin load on released hosts where the runtime global is absent,
// killing the whole plugin. So the component is looked up on
// window.pluginLib at render time instead, and callers fall back to
// the local renderer when it is missing.
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

/**
 * The host's embeddable GraphView, or null when this Headlamp does not
 * expose one. The upstream export is a React.lazy wrapper — an object,
 * not a function — so both renderable shapes are accepted; anything
 * else fails closed to the fallback renderer.
 */
export function getNativeGraphView(): NativeGraphViewComponent | null {
  const view: unknown = window.pluginLib?.ResourceMap?.GraphView;
  if (typeof view === 'function' || (typeof view === 'object' && view !== null)) {
    return view as NativeGraphViewComponent;
  }
  return null;
}

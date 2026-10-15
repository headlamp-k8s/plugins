// Tells the plugin's own global Map source whether it is being mounted
// by an embedded detail-page graph rather than by the Map page.
//
// Headlamp's GraphView always appends every plugin-registered map source
// to the sources it is given, and selected sources run their data hooks
// no matter where the view is mounted. Those hooks render inside the
// GraphView, which the embedded sections render, so a context set by
// EmbeddedGraphView reaches them and lets the kro source skip its
// cluster-wide watches there.
import { createContext, useContext } from 'react';

export const EmbeddedGraphContext = createContext(false);

/** True while rendering inside one of the plugin's embedded graphs. */
export function useIsEmbeddedGraph(): boolean {
  return useContext(EmbeddedGraphContext);
}

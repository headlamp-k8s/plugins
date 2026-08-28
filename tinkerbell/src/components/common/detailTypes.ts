/** Props shared by Tinkerbell detail pages and map node detail panels. */
export interface TinkerbellDetailProps {
  /** Resource name to render when the detail view is opened outside a route. */
  name?: string;
  /** Resource namespace to render when the detail view is opened outside a route. */
  namespace?: string;
  /** Cluster name used by Headlamp when rendering a map node detail panel. */
  cluster?: string;
}

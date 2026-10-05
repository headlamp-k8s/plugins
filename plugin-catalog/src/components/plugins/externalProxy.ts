/** Host globals injected by Headlamp, Electron, or Docker Desktop. */
interface HeadlampHostWindow {
  process?: {
    type?: string;
  };
  headlampBackendPort?: number;
  ddClient?: unknown;
  headlampBaseUrl?: string;
}

function getHostWindow(): Window & HeadlampHostWindow {
  return window as unknown as Window & HeadlampHostWindow;
}

/**
 * Resolves the Headlamp backend origin.
 *
 * Headlamp's internal `getAppUrl()` (at `@kinvolk/headlamp-plugin/lib/helpers/getAppUrl`)
 * is not part of the plugin runtime API — the plugin bundler only externalizes a
 * whitelist of `@kinvolk/headlamp-plugin/lib/*` paths, so importing `getAppUrl`
 * directly resolves to undefined at runtime and crashes the plugin.
 *
 * This mirrors the same pattern used in
 * `ai-assistant/packages/ai-common/src/agents/holmes/client.ts` (see
 * `getHeadlampBackendOrigin` / `getHolmesProxyBaseUrl`), which already inlines
 * the equivalent logic for the same reason.
 */
function getHeadlampBackendOrigin(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:4466';
  }

  const hostWindow = getHostWindow();
  if (
    (typeof hostWindow.process === 'object' && hostWindow.process.type === 'renderer') ||
    (typeof navigator === 'object' && navigator.userAgent.indexOf('Electron') >= 0)
  ) {
    const port = hostWindow.headlampBackendPort || 4466;
    return `http://localhost:${port}`;
  }

  if (hostWindow.ddClient !== undefined) {
    return 'http://localhost:64446';
  }

  return window.location.origin;
}

export function getExternalProxyEndpoint(): string {
  const origin = getHeadlampBackendOrigin();
  const hostWindow = typeof window !== 'undefined' ? getHostWindow() : undefined;

  let baseUrlPrefix = '';
  if (hostWindow?.headlampBaseUrl) {
    const raw = hostWindow.headlampBaseUrl.replace(/\/+$/, '');
    if (raw !== '' && raw !== '.' && raw !== './') {
      baseUrlPrefix = raw.startsWith('/') ? raw : `/${raw}`;
    }
  }

  return `${origin}${baseUrlPrefix}/externalproxy`;
}

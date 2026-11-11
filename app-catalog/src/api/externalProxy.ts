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
 * Headlamp's internal `getAppUrl()` is not part of the plugin runtime API, so it
 * cannot be imported here. This mirrors `getExternalProxyEndpoint` in
 * `plugin-catalog/src/components/plugins/externalProxy.ts`, which inlines the
 * equivalent logic for the same reason.
 *
 * In Electron the backend does not always listen on 4466: it moves to the next
 * free port when 4466 is taken, or uses the port given with `--port`. Electron
 * passes the port it picked to the frontend as `window.headlampBackendPort`.
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

/**
 * Returns the URL of the Headlamp backend's `/externalproxy` endpoint.
 *
 * @returns The absolute external proxy URL for the current environment.
 */
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

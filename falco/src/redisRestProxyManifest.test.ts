import * as yaml from 'js-yaml';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const manifestPath = path.resolve(__dirname, '../redis/redis-rest-proxy.yaml');

function loadDocs(): any[] {
  return yaml.loadAll(fs.readFileSync(manifestPath, 'utf8'));
}

function getProxyScript(): string {
  const deployment = loadDocs().find(doc => doc?.kind === 'Deployment');
  return deployment?.spec?.template?.spec?.containers?.[0]?.args?.[0] || '';
}

function getEmbeddedPython(script: string): string {
  return script.split("python3 - << 'EOF'\n")[1]?.split('\nEOF')[0] || '';
}

describe('redis-rest-proxy manifest', () => {
  it('should expose the proxy with a ClusterIP service', () => {
    const service = loadDocs().find(doc => doc?.kind === 'Service');

    expect(service?.spec?.type).toBe('ClusterIP');
    expect(service?.spec?.ports?.[0]?.port).toBe(8080);
  });

  it('should include a NetworkPolicy restricting ingress to namespace pods', () => {
    const networkPolicy = loadDocs().find(doc => doc?.kind === 'NetworkPolicy');

    expect(networkPolicy?.apiVersion).toBe('networking.k8s.io/v1');
    expect(networkPolicy?.spec?.podSelector?.matchLabels).toEqual({ app: 'redis-rest-proxy' });
    expect(networkPolicy?.spec?.policyTypes).toContain('Ingress');
    expect(networkPolicy?.spec?.ingress?.[0]?.from?.[0]).toEqual({ podSelector: {} });
    expect(networkPolicy?.spec?.ingress?.[0]?.ports?.[0]).toMatchObject({
      protocol: 'TCP',
      port: 8080,
    });
  });

  it('should run the Deployment with restricted security settings and resources', () => {
    const deployment = loadDocs().find(doc => doc?.kind === 'Deployment');
    const container = deployment?.spec?.template?.spec?.containers?.[0];

    expect(container?.image).toBe('python:3.13.3-alpine3.21');
    expect(deployment?.spec?.template?.spec?.securityContext).toMatchObject({
      runAsNonRoot: true,
      runAsUser: 1000,
      runAsGroup: 1000,
      seccompProfile: { type: 'RuntimeDefault' },
    });
    expect(container?.securityContext).toMatchObject({
      allowPrivilegeEscalation: false,
      capabilities: { drop: ['ALL'] },
    });
    expect(container?.resources?.requests).toEqual({ cpu: '25m', memory: '64Mi' });
    expect(container?.resources?.limits).toEqual({ cpu: '100m', memory: '128Mi' });
  });

  it('should pin Python dependencies and cap the GET events limit', () => {
    const script = getProxyScript();

    expect(script).toContain('flask==3.1.3');
    expect(script).toContain('redis==7.4.0');
    expect(script).toContain('flask-cors==6.0.2');
    expect(script).toContain('limit = max(1, min(limit, 1000))');
  });

  it('should contain valid embedded Python', () => {
    const embeddedPython = getEmbeddedPython(getProxyScript());
    const result = spawnSync('python3', ['-c', 'import ast, sys; ast.parse(sys.stdin.read())'], {
      input: embeddedPython,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });
});

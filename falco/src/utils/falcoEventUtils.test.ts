import { vi } from 'vitest';
import { FalcoEvent } from '../types/FalcoEvent';
import {
  formatFalcoTime,
  getEventUser,
  getK8sSource,
  getNamespace,
  getSeverityColor,
  getTagColor,
  isValidK8sName,
  singularizeKind,
  truncate,
} from './falcoEventUtils';

describe('formatFalcoTime', () => {
  it('should format RFC3339 time', () => {
    const ev: FalcoEvent = { time: '2024-01-15T10:30:00Z' };
    const result = formatFalcoTime(ev);
    expect(result).toBeTruthy();
    expect(result).not.toBe('');
  });

  it('should handle nanosecond epoch in output_fields', () => {
    const ms = 1700000000000;
    const ns = ms * 1e6;
    const ev: FalcoEvent = { output_fields: { 'evt.time': ns } };
    const result = formatFalcoTime(ev);
    expect(result).toBeTruthy();
    expect(result).not.toBe('');
  });

  it('should return empty string for missing time', () => {
    const ev: FalcoEvent = {};
    const result = formatFalcoTime(ev);
    expect(result).toBe('');
  });

  it('should fall back to raw time string if parsing fails', () => {
    const ev: FalcoEvent = { time: 'not-a-date' };
    const result = formatFalcoTime(ev);
    expect(result).toBe('not-a-date');
  });
});

describe('isValidK8sName', () => {
  it('should accept valid names', () => {
    expect(isValidK8sName('my-pod')).toBe(true);
    expect(isValidK8sName('my-pod-123')).toBe(true);
    expect(isValidK8sName('a')).toBe(true);
    expect(isValidK8sName('my.pod.name')).toBe(true);
  });

  it('should reject invalid names', () => {
    expect(isValidK8sName('')).toBe(false);
    expect(isValidK8sName('My-Pod')).toBe(false);
    expect(isValidK8sName('-starts-with-dash')).toBe(false);
    expect(isValidK8sName('ends-with-dash-')).toBe(false);
    expect(isValidK8sName(123)).toBe(false);
    expect(isValidK8sName(null)).toBe(false);
    expect(isValidK8sName(undefined)).toBe(false);
  });

  it('should reject names longer than 253 characters', () => {
    const longName = 'a'.repeat(254);
    expect(isValidK8sName(longName)).toBe(false);
  });

  it('should accept names exactly 253 characters', () => {
    const name = 'a'.repeat(253);
    expect(isValidK8sName(name)).toBe(true);
  });
});

describe('getNamespace', () => {
  it('should return k8s_ns_name if present', () => {
    const ev: FalcoEvent = { k8s_ns_name: 'kube-system' };
    expect(getNamespace(ev)).toBe('kube-system');
  });

  it('should return namespace from output_fields', () => {
    const ev: FalcoEvent = { output_fields: { 'k8s.ns.name': 'my-ns' } };
    expect(getNamespace(ev)).toBe('my-ns');
  });

  it('should extract namespace from container name', () => {
    const ev: FalcoEvent = {
      output_fields: { 'container.name': 'k8s_nginx_my-pod_my-namespace_uid123_0' },
    };
    expect(getNamespace(ev)).toBe('my-namespace');
  });

  it('should extract namespace from output message', () => {
    const ev: FalcoEvent = { output: 'some event in namespace: kube-system happened' };
    expect(getNamespace(ev)).toBe('kube-system');
  });

  it('should return default namespace when matched', () => {
    const ev: FalcoEvent = { output: 'some event in namespace: default happened' };
    expect(getNamespace(ev)).toBe('default');
  });

  it('should return N/A when no namespace found', () => {
    const ev: FalcoEvent = {};
    expect(getNamespace(ev)).toBe('N/A');
  });

  it('should use ka.target.namespace for k8s_audit events', () => {
    const ev: FalcoEvent = { output_fields: { 'ka.target.namespace': 'audit-ns' } };
    expect(getNamespace(ev)).toBe('audit-ns');
  });
});

describe('getK8sSource', () => {
  it('should return pod source for syscall events', () => {
    const ev: FalcoEvent = {
      source: 'syscall',
      output_fields: { 'k8s.pod.name': 'nginx-pod', 'k8s.ns.name': 'default' },
    };
    const result = getK8sSource(ev);
    expect(result).toEqual({ kind: 'pod', name: 'nginx-pod', namespace: 'default' });
  });

  it('should return audit resource for k8s_audit events', () => {
    const ev: FalcoEvent = {
      source: 'k8s_audit',
      output_fields: {
        'ka.target.resource': 'deployments',
        'ka.target.name': 'my-deploy',
        'ka.target.namespace': 'prod',
      },
    };
    const result = getK8sSource(ev);
    expect(result).toEqual({ kind: 'deployments', name: 'my-deploy', namespace: 'prod' });
  });

  it('should parse pod info from container name', () => {
    const ev: FalcoEvent = {
      source: 'syscall',
      output_fields: { 'container.name': 'k8s_nginx_my-pod_my-ns_uid_0' },
    };
    const result = getK8sSource(ev);
    expect(result).toEqual({ kind: 'pod', name: 'my-pod', namespace: 'my-ns' });
  });

  it('should use legacy pod fields as fallback', () => {
    const ev: FalcoEvent = { k8s_pod_name: 'legacy-pod', k8s_ns_name: 'legacy-ns' };
    const result = getK8sSource(ev);
    expect(result).toEqual({ kind: 'pod', name: 'legacy-pod', namespace: 'legacy-ns' });
  });

  it('should return empty for no source info', () => {
    const ev: FalcoEvent = {};
    const result = getK8sSource(ev);
    expect(result).toEqual({ kind: '', name: '', namespace: '' });
  });
});

describe('getEventUser', () => {
  it('should return user for k8s_audit events', () => {
    const ev: FalcoEvent = {
      source: 'k8s_audit',
      output_fields: { 'ka.user.name': 'admin' },
    };
    expect(getEventUser(ev)).toBe('admin');
  });

  it('should return user for syscall events', () => {
    const ev: FalcoEvent = {
      source: 'syscall',
      output_fields: { 'user.name': 'root' },
    };
    expect(getEventUser(ev)).toBe('root');
  });

  it('should fall back to user field for syscall events', () => {
    const ev: FalcoEvent = {
      source: 'syscall',
      output_fields: { user: 'www-data' },
    };
    expect(getEventUser(ev)).toBe('www-data');
  });

  it('should return N/A for missing user', () => {
    const ev: FalcoEvent = { source: 'k8s_audit' };
    expect(getEventUser(ev)).toBe('N/A');
  });

  it('should return N/A for unknown source', () => {
    const ev: FalcoEvent = {};
    expect(getEventUser(ev)).toBe('N/A');
  });
});

describe('truncate', () => {
  it('should return empty string for falsy input', () => {
    expect(truncate('')).toBe('');
  });

  it('should not truncate short strings', () => {
    expect(truncate('hello', 60)).toBe('hello');
  });

  it('should truncate long strings with ellipsis', () => {
    const long = 'a'.repeat(100);
    const result = truncate(long, 60);
    expect(result.length).toBe(60);
    expect(result.endsWith('...')).toBe(true);
  });

  it('should use default max of 60', () => {
    const str = 'a'.repeat(61);
    const result = truncate(str);
    expect(result.length).toBe(60);
  });
});

describe('singularizeKind', () => {
  it('should singularize plural kinds', () => {
    expect(singularizeKind('pods')).toBe('pod');
    expect(singularizeKind('deployments')).toBe('deployment');
    expect(singularizeKind('namespaces')).toBe('namespace');
  });

  it('should lowercase singular kinds', () => {
    expect(singularizeKind('Pod')).toBe('pod');
  });

  it('should handle already singular lowercase', () => {
    expect(singularizeKind('pod')).toBe('pod');
  });
});

describe('getSeverityColor', () => {
  it('should return correct color for each severity', () => {
    expect(getSeverityColor('emergency')).toBe('#C62828');
    expect(getSeverityColor('alert')).toBe('#D32F2F');
    expect(getSeverityColor('critical')).toBe('#E53935');
    expect(getSeverityColor('error')).toBe('#FF5252');
    expect(getSeverityColor('warning')).toBe('#FB8C00');
    expect(getSeverityColor('notice')).toBe('#1976D2');
    expect(getSeverityColor('informational')).toBe('#03A9F4');
    expect(getSeverityColor('info')).toBe('#03A9F4');
    expect(getSeverityColor('debug')).toBe('#29B6F6');
  });

  it('should be case insensitive', () => {
    expect(getSeverityColor('WARNING')).toBe('#FB8C00');
    expect(getSeverityColor('Notice')).toBe('#1976D2');
  });

  it('should return default color for unknown severity', () => {
    expect(getSeverityColor('unknown')).toBe('#555');
    expect(getSeverityColor('')).toBe('#555');
  });
});

describe('getTagColor', () => {
  it('should return known colors for common tags', () => {
    expect(getTagColor('k8s')).toBe('#1976D2');
    expect(getTagColor('container')).toBe('#43A047');
    expect(getTagColor('network')).toBe('#039BE5');
  });

  it('should be case insensitive for known tags', () => {
    expect(getTagColor('K8s')).toBe('#1976D2');
    expect(getTagColor('CONTAINER')).toBe('#43A047');
  });

  it('should generate consistent colors for unknown tags', () => {
    const color1 = getTagColor('custom-tag');
    const color2 = getTagColor('custom-tag');
    expect(color1).toBe(color2);
  });

  it('should generate different colors for different tags', () => {
    const color1 = getTagColor('tag-alpha');
    const color2 = getTagColor('tag-beta');
    expect(color1).not.toBe(color2);
  });
});

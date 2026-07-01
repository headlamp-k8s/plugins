import { describe, expect, it, vi } from 'vitest';
import { extractYamlContent, parseKubernetesYAML } from './yamlParser';

describe('parseKubernetesYAML', () => {
  const validPodYaml = `apiVersion: v1
kind: Pod
metadata:
  name: test
  namespace: default
`;

  it('parses valid Kubernetes YAML', () => {
    expect(parseKubernetesYAML(validPodYaml)).toEqual({
      isValid: true,
      resourceType: 'Pod',
      name: 'test',
      namespace: 'default',
    });
  });

  it('returns invalid when apiVersion is missing', () => {
    expect(
      parseKubernetesYAML(`kind: Pod
metadata:
  name: test
  namespace: default
`)
    ).toEqual({ isValid: false });
  });

  it('returns invalid when kind is missing', () => {
    expect(
      parseKubernetesYAML(`apiVersion: v1
metadata:
  name: test
  namespace: default
`)
    ).toEqual({ isValid: false });
  });

  it('returns invalid for malformed YAML', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(parseKubernetesYAML('apiVersion: v1\nkind: Pod\nmetadata: [')).toEqual({
      isValid: false,
    });

    warnSpy.mockRestore();
  });

  it('parses the first document in multi-document YAML', () => {
    const multiDocYaml = `apiVersion: v1
kind: Pod
metadata:
  name: test
  namespace: default
---
apiVersion: v1
kind: Service
metadata:
  name: other
  namespace: kube-system
`;

    expect(parseKubernetesYAML(multiDocYaml)).toEqual({
      isValid: true,
      resourceType: 'Pod',
      name: 'test',
      namespace: 'default',
    });
  });

  it('returns valid YAML without metadata name', () => {
    expect(
      parseKubernetesYAML(`apiVersion: v1
kind: Pod
spec:
  containers: []
`)
    ).toEqual({
      isValid: true,
      resourceType: 'Pod',
      name: undefined,
      namespace: 'default',
    });
  });
});

describe('extractYamlContent', () => {
  const podYaml = `apiVersion: v1
kind: Pod
metadata:
  name: test
  namespace: default
`;

  it('extracts YAML from a markdown yaml code block', () => {
    const content = ['Here is a manifest:', '', '```yaml', podYaml.trim(), '```'].join('\n');

    expect(extractYamlContent(content)).toEqual([
      {
        yaml: podYaml.trim(),
        resourceType: 'Pod',
      },
    ]);
  });

  it('returns null for an empty string', () => {
    expect(extractYamlContent('')).toBeNull();
  });

  it('returns null when no YAML content is present', () => {
    expect(extractYamlContent('Just some plain text without manifests.')).toBeNull();
  });

  it('extracts multiple YAML code blocks', () => {
    const serviceYaml = `apiVersion: v1
kind: Service
metadata:
  name: svc
  namespace: default
`;
    const content = [
      'First:',
      '',
      '```yaml',
      podYaml.trim(),
      '```',
      '',
      'Second:',
      '',
      '```',
      serviceYaml.trim(),
      '```',
    ].join('\n');

    expect(extractYamlContent(content)).toEqual([
      {
        yaml: podYaml.trim(),
        resourceType: 'Pod',
      },
      {
        yaml: serviceYaml.trim(),
        resourceType: 'Service',
      },
    ]);
  });

  it('extracts bare YAML without code blocks', () => {
    expect(extractYamlContent(`${podYaml}\nsome trailing explanation`)).toEqual([
      {
        yaml: ['apiVersion: v1', 'kind: Pod', 'metadata:', 'name: test', 'namespace: default'].join(
          '\n'
        ),
        resourceType: 'Pod',
      },
    ]);
  });
});

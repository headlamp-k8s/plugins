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

  it('rejects scalar, array, and non-string Kubernetes identity fields', () => {
    expect(parseKubernetesYAML('plain text')).toEqual({ isValid: false });
    expect(parseKubernetesYAML('- apiVersion: v1\n  kind: Pod')).toEqual({ isValid: false });
    expect(parseKubernetesYAML('apiVersion: 1\nkind: Pod')).toEqual({ isValid: false });
  });

  it('ignores invalid metadata fields and defaults the namespace', () => {
    expect(
      parseKubernetesYAML(`apiVersion: v1
kind: Pod
metadata:
  name: 42
  namespace: ""
`)
    ).toEqual({
      isValid: true,
      resourceType: 'Pod',
      name: undefined,
      namespace: 'default',
    });
  });

  it('inspects only the first YAML document', () => {
    expect(
      parseKubernetesYAML(`plain text
---
apiVersion: v1
kind: Pod
`)
    ).toEqual({ isValid: false });
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

  it('supports a longer outer fence containing triple backticks', () => {
    const yamlWithBackticks = `apiVersion: v1
kind: ConfigMap
data:
  example: |
    \`\`\`
    nested code
    \`\`\``;
    const content = ['````yaml', yamlWithBackticks, '````'].join('\n');

    expect(extractYamlContent(content)).toEqual([
      { yaml: yamlWithBackticks, resourceType: 'ConfigMap' },
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

  it('extracts tilde and yml fences once each', () => {
    const content = ['~~~yml', podYaml.trim(), '~~~'].join('\n');

    expect(extractYamlContent(content)).toEqual([
      {
        yaml: podYaml.trim(),
        resourceType: 'Pod',
      },
    ]);
  });

  it('extracts dashed blocks with only human-authored titles', () => {
    const titled = ['Recommended Pod', '---', podYaml.trim(), '---'].join('\n');
    const untitled = ['---', podYaml.trim(), '---'].join('\n');

    expect(extractYamlContent(titled)?.[0].title).toBe('Recommended Pod');
    expect(extractYamlContent(untitled)?.[0]).toEqual({
      yaml: podYaml.trim(),
      resourceType: 'Pod',
    });
  });

  it('does not treat inline dashes as a dashed-block delimiter', () => {
    const manifest = `${podYaml.trim()}
  annotations:
    example: value---with---dashes`;
    const content = ['Dashed value', '---', manifest, '---'].join('\n');

    expect(extractYamlContent(content)).toEqual([
      { yaml: manifest, resourceType: 'Pod', title: 'Dashed value' },
    ]);
  });
  it('ignores empty, malformed, and non-Kubernetes fenced candidates', () => {
    expect(extractYamlContent('```yaml\n\n```')).toBeNull();
    expect(extractYamlContent('```yaml\nmetadata: [\n```')).toBeNull();
    expect(extractYamlContent('```yaml\nname: value\n```')).toBeNull();
  });

  it('extracts adjacent bare manifests in source order', () => {
    const adjacent = `apiVersion: v1
kind: Pod
apiVersion: v1
kind: Service`;

    expect(extractYamlContent(adjacent)).toEqual([
      { yaml: 'apiVersion: v1\nkind: Pod', resourceType: 'Pod' },
      { yaml: 'apiVersion: v1\nkind: Service', resourceType: 'Service' },
    ]);
  });

  it('preserves internal blank lines in bare YAML while excluding trailing prose', () => {
    const manifest = `apiVersion: v1
kind: Pod

spec:
  containers: []`;

    expect(extractYamlContent(`${manifest}\n\nFurther explanation`)).toEqual([
      { yaml: manifest, resourceType: 'Pod' },
    ]);
  });
  it('extracts bare YAML without code blocks', () => {
    const extracted = extractYamlContent(`${podYaml}\nsome trailing explanation`);

    expect(extracted).toEqual([
      {
        yaml: podYaml.trim(),
        resourceType: 'Pod',
      },
    ]);
    expect(parseKubernetesYAML(extracted?.[0].yaml ?? '')).toEqual({
      isValid: true,
      resourceType: 'Pod',
      name: 'test',
      namespace: 'default',
    });
  });
});

import {
  cleanYamlText,
  extractRulesFromYaml,
  getRulesFilesFromConfig,
  splitSource,
} from './falcoRulesUtils';

describe('getRulesFilesFromConfig', () => {
  it('should extract rules_file array', () => {
    const yaml = `
rules_file:
  - /etc/falco/falco_rules.yaml
  - /etc/falco/custom_rules.yaml
`;
    const result = getRulesFilesFromConfig(yaml);
    expect(result).toEqual(['/etc/falco/falco_rules.yaml', '/etc/falco/custom_rules.yaml']);
  });

  it('should handle single string rules_file', () => {
    const yaml = 'rules_file: /etc/falco/falco_rules.yaml';
    const result = getRulesFilesFromConfig(yaml);
    expect(result).toEqual(['/etc/falco/falco_rules.yaml']);
  });

  it('should support rules_files key', () => {
    const yaml = `
rules_files:
  - /etc/falco/rules.yaml
`;
    const result = getRulesFilesFromConfig(yaml);
    expect(result).toEqual(['/etc/falco/rules.yaml']);
  });

  it('should return empty array for missing key', () => {
    const yaml = 'some_other_config: true';
    const result = getRulesFilesFromConfig(yaml);
    expect(result).toEqual([]);
  });

  it('should return empty array for invalid YAML', () => {
    const result = getRulesFilesFromConfig(': : invalid yaml [[[');
    expect(result).toEqual([]);
  });
});

describe('extractRulesFromYaml', () => {
  it('should extract rules from YAML', () => {
    const yaml = `
- rule: Write below binary dir
  desc: Detect writes below binary directories
  condition: write and bin_dir
  output: "File write below binary dir (file=%fd.name)"
  priority: error
  tags: [filesystem]

- rule: Read sensitive file
  desc: An attempt to read a sensitive file
  condition: open_read and sensitive_files
  output: "Sensitive file opened (file=%fd.name)"
  priority: warning
`;
    const rules = extractRulesFromYaml(yaml, 'pod1:/etc/falco/rules.yaml');
    expect(rules).toHaveLength(2);
    expect(rules[0]).toEqual({
      name: 'Write below binary dir',
      desc: 'Detect writes below binary directories',
      source: 'pod1:/etc/falco/rules.yaml',
    });
    expect(rules[1]).toEqual({
      name: 'Read sensitive file',
      desc: 'An attempt to read a sensitive file',
      source: 'pod1:/etc/falco/rules.yaml',
    });
  });

  it('should return empty array for YAML with no rules', () => {
    const yaml = `
- macro: some_macro
  condition: something
- list: some_list
  items: [a, b, c]
`;
    const rules = extractRulesFromYaml(yaml, 'pod1:/etc/falco/rules.yaml');
    expect(rules).toHaveLength(0);
  });

  it('should handle invalid YAML gracefully', () => {
    const rules = extractRulesFromYaml('not: valid: yaml: [[', 'source');
    expect(rules).toEqual([]);
  });

  it('should handle empty input', () => {
    const rules = extractRulesFromYaml('', 'source');
    expect(rules).toEqual([]);
  });
});

describe('cleanYamlText', () => {
  it('should remove control characters', () => {
    const input = 'hello\x00world\x01test';
    const result = cleanYamlText(input);
    expect(result).toBe('helloworldtest');
  });

  it('should preserve tabs, newlines, and carriage returns', () => {
    const input = 'line1\n\tindented\r\nline3';
    const result = cleanYamlText(input);
    expect(result).toBe('line1\n\tindented\r\nline3');
  });

  it('should preserve Unicode characters', () => {
    const input = 'rule: Détection de problèmes';
    const result = cleanYamlText(input);
    expect(result).toBe('rule: Détection de problèmes');
  });

  it('should remove trailing JSON objects', () => {
    const input = 'some_yaml: value\n{"metadata":{},"status":"Success"}';
    const result = cleanYamlText(input);
    expect(result).not.toContain('metadata');
  });

  it('should handle empty string', () => {
    expect(cleanYamlText('')).toBe('');
  });
});

describe('splitSource', () => {
  it('should split pod:file format', () => {
    expect(splitSource('my-pod:/etc/falco/rules.yaml')).toEqual({
      pod: 'my-pod',
      file: '/etc/falco/rules.yaml',
    });
  });

  it('should handle source with no colon', () => {
    expect(splitSource('just-a-file')).toEqual({
      pod: '',
      file: 'just-a-file',
    });
  });

  it('should handle empty string', () => {
    expect(splitSource('')).toEqual({
      pod: '',
      file: '',
    });
  });

  it('should handle multiple colons (only split on first)', () => {
    expect(splitSource('pod:/path/to/file:with:colons')).toEqual({
      pod: 'pod',
      file: '/path/to/file:with:colons',
    });
  });
});

import { describe, expect, it } from 'vitest';
import { jsonToYAML, yamlToJSON } from './index';

describe('YAML/JSON Helpers', () => {
  describe('yamlToJSON', () => {
    it('should convert simple YAML to JSON', () => {
      const yaml = `
name: test
version: 1.0.0
      `;
      
      const result = yamlToJSON<{ name: string; version: string }>(yaml);
      
      expect(result).toEqual({
        name: 'test',
        version: '1.0.0',
      });
    });

    it('should handle nested YAML objects', () => {
      const yaml = `
metadata:
  name: nginx
  labels:
    app: web
      `;
      
      const result = yamlToJSON(yaml);
      
      expect(result).toEqual({
        metadata: {
          name: 'nginx',
          labels: {
            app: 'web',
          },
        },
      });
    });

    it('should handle multiple YAML documents', () => {
      const yaml = `
name: doc1
---
name: doc2
      `;
      
      const result = yamlToJSON(yaml);
      
      // Multiple documents get merged
      expect(result).toHaveProperty('name');
    });

    it('should handle arrays in YAML', () => {
      const yaml = `
items:
  - name: item1
  - name: item2
      `;
      
      const result = yamlToJSON<{ items: Array<{ name: string }> }>(yaml);
      
      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe('item1');
    });

    it('should handle empty YAML', () => {
      const yaml = '';
      
      const result = yamlToJSON(yaml);
      
      expect(result).toEqual({});
    });

    it('should handle YAML with comments', () => {
      const yaml = `
# This is a comment
name: test
# Another comment
version: 1.0.0
      `;
      
      const result = yamlToJSON<{ name: string; version: string }>(yaml);
      
      expect(result).toEqual({
        name: 'test',
        version: '1.0.0',
      });
    });
  });

  describe('jsonToYAML', () => {
    it('should convert simple JSON to YAML', () => {
      const json = {
        name: 'test',
        version: '1.0.0',
      };
      
      const result = jsonToYAML(json);
      
      expect(result).toContain('name: test');
      expect(result).toContain('version: 1.0.0');
    });

    it('should handle nested JSON objects', () => {
      const json = {
        metadata: {
          name: 'nginx',
          labels: {
            app: 'web',
          },
        },
      };
      
      const result = jsonToYAML(json);
      
      expect(result).toContain('metadata:');
      expect(result).toContain('name: nginx');
      expect(result).toContain('labels:');
      expect(result).toContain('app: web');
    });

    it('should handle arrays in JSON', () => {
      const json = {
        items: [
          { name: 'item1' },
          { name: 'item2' },
        ],
      };
      
      const result = jsonToYAML(json);
      
      expect(result).toContain('items:');
      expect(result).toContain('- name: item1');
      expect(result).toContain('- name: item2');
    });

    it('should handle empty object', () => {
      const json = {};
      
      const result = jsonToYAML(json);
      
      expect(result).toBe('{}\n');
    });

    it('should handle null and undefined values', () => {
      const json = {
        nullValue: null,
        undefinedValue: undefined,
        stringValue: 'test',
      };
      
      const result = jsonToYAML(json);
      
      expect(result).toContain('nullValue: null');
      expect(result).toContain('stringValue: test');
    });

    it('should round-trip YAML -> JSON -> YAML', () => {
      const originalYaml = `name: test
version: 1.0.0
metadata:
  created: true
`;
      
      const json = yamlToJSON(originalYaml);
      const newYaml = jsonToYAML(json);
      const finalJson = yamlToJSON(newYaml);
      
      expect(finalJson).toEqual(json);
    });
  });
});

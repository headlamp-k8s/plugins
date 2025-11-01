import YAML from 'yaml';

export interface YamlExample {
  title: string;
  filename: string;
  yaml: string;
  resourceType: string;
}

// Function to validate and parse YAML to extract resource type and metadata
export function parseKubernetesYAML(yamlStr: string): {
  isValid: boolean;
  resourceType?: string;
  name?: string;
  namespace?: string;
} {
  try {
    const parsed = YAML.parse(yamlStr);

    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false };
    }

    // Check if it has the basic Kubernetes resource structure - just need apiVersion and kind
    if (!parsed.apiVersion || !parsed.kind) {
      return { isValid: false };
    }

    // Extract resource name and namespace if available
    const name = parsed.metadata?.name;
    const namespace = parsed.metadata?.namespace || 'default';

    return {
      isValid: true,
      resourceType: parsed.kind,
      name,
      namespace,
    };
  } catch (error) {
    console.warn('Failed to parse YAML:', error);
    return { isValid: false };
  }
}

// Extract YAML content from text that may contain markdown-style code blocks or separator patterns
export function extractYamlContent(
  content: string
): { yaml: string; resourceType: string; title?: string }[] | null {
  if (!content) return null;

  const results: { yaml: string; resourceType: string; title?: string }[] = [];

  // Simple YAML extraction:
  // 1. Split content by triple backticks
  const codeBlockRegex = /```yaml\n([\s\S]*?)```/g;
  const codeBlockRegex2 = /```([\s\S]*?)```/g;
  const codeBlockRegex3 = /~~~yaml\n([\s\S]*?)~~~(?!\n)/g;
  const codeBlockRegex4 = /~~~([\s\S]*?)~~~(?!\n)/g;

  const extractFromCodeBlock = (match: string) => {
    const yamlContent = match.trim();
    try {
      const parsed = YAML.parse(yamlContent);
      if (parsed && typeof parsed === 'object' && parsed.apiVersion && parsed.kind) {
        results.push({
          yaml: yamlContent,
          resourceType: parsed.kind,
        });
      }
    } catch (e) {}
  };

  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    extractFromCodeBlock(match[1]);
  }
  while ((match = codeBlockRegex2.exec(content)) !== null) {
    extractFromCodeBlock(match[1]);
  }
  while ((match = codeBlockRegex3.exec(content)) !== null) {
    extractFromCodeBlock(match[1]);
  }
  while ((match = codeBlockRegex4.exec(content)) !== null) {
    extractFromCodeBlock(match[1]);
  }

  // If no results found with code blocks, fall back to other patterns
  if (results.length === 0) {
    // Look for YAML surrounded by dashed lines
    const dashedPattern = /[-]{3,}[\r\n]+([\s\S]*?)[-]{3,}/g;
    let dashMatch;

    while ((dashMatch = dashedPattern.exec(content)) !== null) {
      if (dashMatch[1] && dashMatch[1].trim()) {
        const yamlContent = dashMatch[1].trim();

        try {
          const parsed = YAML.parse(yamlContent);
          if (parsed && typeof parsed === 'object' && parsed.apiVersion && parsed.kind) {
            // Try to find a title from the preceding content
            const precedingContent = content.substring(0, dashMatch.index).trim();
            const lastLineBreak = precedingContent.lastIndexOf('\n');
            const possibleTitle = precedingContent.substring(lastLineBreak + 1).trim();

            results.push({
              yaml: yamlContent,
              resourceType: parsed.kind,
              title: possibleTitle.length > 0 ? possibleTitle : `Sample ${parsed.kind}`,
            });
          }
        } catch (e) {}
      }
    }

    // If still no results, fall back to other extraction methods
    if (results.length === 0) {
      // Check for YAML code blocks using markdown style
      const yamlRegex = /```(?:ya?ml)?\s*([\s\S]*?)```/g;
      let match;

      while ((match = yamlRegex.exec(content)) !== null) {
        if (match[1] && match[1].trim()) {
          const yamlContent = match[1].trim();
          try {
            const parsed = YAML.parse(yamlContent);
            if (parsed && typeof parsed === 'object' && parsed.apiVersion && parsed.kind) {
              results.push({
                yaml: yamlContent,
                resourceType: parsed.kind,
              });
            }
          } catch (e) {
            console.log('Error parsing YAML code block:', e);
          }
        }
      }

      // If still no results, look for sections with clear apiVersion and kind
      if (results.length === 0) {
        const contentByLines = content.split('\n');
        let currentYaml = '';
        let inYamlBlock = false;

        for (let i = 0; i < contentByLines.length; i++) {
          const line = contentByLines[i].trim();

          if (line.startsWith('apiVersion:')) {
            // Start collecting a new YAML block
            inYamlBlock = true;
            currentYaml = line + '\n';
          } else if (inYamlBlock) {
            // If we hit a blank line after collecting some YAML, try to finalize it
            if (line === '' && currentYaml.length > 0) {
              try {
                const parsed = YAML.parse(currentYaml);
                if (parsed && typeof parsed === 'object' && parsed.apiVersion && parsed.kind) {
                  results.push({
                    yaml: currentYaml.trim(),
                    resourceType: parsed.kind,
                  });
                }
              } catch (e) {
                // Not valid YAML yet, continue collecting
              }

              // Reset for next block
              currentYaml = '';
              inYamlBlock = false;
            } else {
              // Keep collecting lines
              currentYaml += line + '\n';
            }
          }
        }

        // Check the last collected block
        if (inYamlBlock && currentYaml.length > 0) {
          try {
            const parsed = YAML.parse(currentYaml);
            if (parsed && typeof parsed === 'object' && parsed.apiVersion && parsed.kind) {
              results.push({
                yaml: currentYaml.trim(),
                resourceType: parsed.kind,
              });
            }
          } catch (e) {
            // Not valid YAML, ignore
          }
        }
      }
    }
  }

  return results.length > 0 ? results : null;
}

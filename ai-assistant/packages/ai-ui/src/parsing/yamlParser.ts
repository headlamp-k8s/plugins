import jsYaml from 'js-yaml';

/** Result of parsing YAML, typed for Kubernetes resource access. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParsedYaml = Record<string, any>;

/** Loads YAML text and returns a typed record, or null for non-object results. */
function loadYaml(text: string): ParsedYaml | null {
  const result = jsYaml.load(text);
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    return result as ParsedYaml;
  }
  return null;
}

/** Describes a named YAML example used in the UI. */
export interface YamlExample {
  /** Display title for the example. */
  title: string;
  /** Suggested filename for the YAML example. */
  filename: string;
  /** Raw YAML manifest content. */
  yaml: string;
  /** Kubernetes resource kind represented by the YAML. */
  resourceType: string;
}

/** Parses Kubernetes YAML and extracts basic resource metadata when the manifest is valid. */
export function parseKubernetesYAML(yamlStr: string): {
  isValid: boolean;
  resourceType?: string;
  name?: string;
  namespace?: string;
} {
  try {
    const parsed = loadYaml(yamlStr);

    if (!parsed) {
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
  } catch (error: any) {
    // Handle multi-document YAML (contains --- separators)
    // Parse only the first document and validate it
    if (
      error?.message?.includes('multiple documents') ||
      yamlStr.includes('\n---\n') ||
      yamlStr.includes('\n---')
    ) {
      try {
        const docs = jsYaml.loadAll(yamlStr);
        if (docs.length > 0) {
          const firstDoc = docs[0] as ParsedYaml | null | undefined;
          if (firstDoc && typeof firstDoc === 'object' && firstDoc.apiVersion && firstDoc.kind) {
            const name = firstDoc.metadata?.name;
            const namespace = firstDoc.metadata?.namespace || 'default';
            return {
              isValid: true,
              resourceType: firstDoc.kind,
              name,
              namespace,
            };
          }
        }
      } catch (multiDocError) {
        console.warn('Failed to parse multi-document YAML:', multiDocError);
      }
    }
    console.warn('Failed to parse YAML:', error);
    return { isValid: false };
  }
}

/** Extracts Kubernetes YAML snippets from markdown, separator blocks, or plain text responses. */
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
      const parsed = loadYaml(yamlContent);
      if (parsed && parsed.apiVersion && parsed.kind) {
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
          const parsed = loadYaml(yamlContent);
          if (parsed && parsed.apiVersion && parsed.kind) {
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
            const parsed = loadYaml(yamlContent);
            if (parsed && parsed.apiVersion && parsed.kind) {
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
                const parsed = loadYaml(currentYaml);
                if (parsed && parsed.apiVersion && parsed.kind) {
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
            const parsed = loadYaml(currentYaml);
            if (parsed && parsed.apiVersion && parsed.kind) {
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

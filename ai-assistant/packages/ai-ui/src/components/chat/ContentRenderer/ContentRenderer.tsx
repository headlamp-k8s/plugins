/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Renders AI assistant message content (markdown, YAML, JSON, logs).
 *
 * Handles Kubernetes YAML/JSON detection & display, MCP formatted output,
 * log button parsing, and standard markdown rendering. Link rendering is
 * customisable via the `LinkRendererSlot` prop — the host application can
 * inject framework-specific link behaviour (e.g. headlamp-plugin `Link`).
 *
 * Framework-agnostic: depends only on MUI, react-markdown, and other
 * ai-ui modules — no headlamp-plugin imports.
 */

import { Alert, Box, Button, Link as MuiLink, Typography } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import jsYaml from 'js-yaml';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseKubernetesYAML } from '../../../parsing/yamlParser';
import MCPFormattedMessage, {
  isFormattedMCPMessage,
} from '../../chat/MCPFormattedMessage/MCPFormattedMessage';
import LogsButton from '../../common/LogsButton/LogsButton';
import YamlDisplay from '../../common/YamlDisplay/YamlDisplay';

/** Result of a parse attempt, indicating success or failure with optional data. */
type ParseResult<T> = { success: true; data: T } | { success: false; error: string };

interface LogsButtonData {
  data: {
    logs: string;
    resourceName?: string;
    resourceType?: string;
    namespace?: string;
    containerName?: string;
  };
  endIndex: number;
}

/** @returns Whether an untrusted value is a non-null object mapping. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLogsButtonData(value: unknown): value is LogsButtonData {
  return (
    isRecord(value) &&
    isRecord(value.data) &&
    typeof value.data.logs === 'string' &&
    (value.data.resourceName === undefined || typeof value.data.resourceName === 'string') &&
    (value.data.resourceType === undefined || typeof value.data.resourceType === 'string') &&
    (value.data.namespace === undefined || typeof value.data.namespace === 'string') &&
    (value.data.containerName === undefined || typeof value.data.containerName === 'string')
  );
}

/** Props passed to a link renderer slot component. */
export interface LinkRendererProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** The URL target of the link. */
  href?: string;
  /** Link content (text or elements). */
  children?: React.ReactNode;
}

/** Default link renderer — opens external links in a new tab. */
const DefaultLinkRenderer = React.memo(({ href, children, ...props }: LinkRendererProps) => {
  const safeHref = href?.startsWith('//')
    ? `https:${href}`
    : href && /^(https?:|mailto:|#|\/(?!\/))/i.test(href)
    ? href
    : '#';
  const isExternal = /^https?:\/\//i.test(safeHref);
  return (
    <MuiLink
      href={safeHref}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children}
    </MuiLink>
  );
});
DefaultLinkRenderer.displayName = 'DefaultLinkRenderer';

/**
 * Parses arbitrary JSON content without throwing.
 *
 * @param content - JSON text to parse.
 * @returns A discriminated result containing the parsed unknown value or an error message.
 */
export const parseJsonContent = (content: string): ParseResult<unknown> => {
  try {
    const parsed: unknown = JSON.parse(content);
    return { success: true, data: parsed };
  } catch (error) {
    return {
      success: false,
      error: `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Extracts and validates the balanced JSON object following a `LOGS_BUTTON:` marker.
 * Braces inside quoted JSON strings are ignored while locating the object boundary.
 *
 * @param content - Complete assistant message containing the marker.
 * @param logsButtonIndex - Character index where `LOGS_BUTTON:` begins.
 * @returns Validated logs payload or a descriptive parse failure.
 */
export const parseLogsButtonData = (
  content: string,
  logsButtonIndex: number
): ParseResult<LogsButtonData> => {
  try {
    // Find the start of the JSON object
    const jsonStart = logsButtonIndex + 'LOGS_BUTTON:'.length;
    let jsonString = '';
    let braceCount = 0;
    let foundFirstBrace = false;
    let objectStart = -1;
    let inString = false;
    let escaped = false;

    // Parse character by character to find the complete JSON object
    for (let i = jsonStart; i < content.length; i++) {
      const char = content[i];
      if (escaped) {
        escaped = false;
      } else if (char === '\\' && inString) {
        escaped = true;
      } else if (char === '"') {
        inString = !inString;
      } else if (!inString && char === '{') {
        if (!foundFirstBrace) objectStart = i;
        foundFirstBrace = true;
        braceCount++;
      } else if (!inString && char === '}') {
        braceCount--;
      }

      if (foundFirstBrace) {
        jsonString += char;
        if (braceCount === 0) {
          break;
        }
      }
    }

    if (!jsonString) {
      return { success: false, error: 'No JSON object found after LOGS_BUTTON:' };
    }

    const logsData: unknown = JSON.parse(jsonString);

    // Validate required fields
    if (!isLogsButtonData(logsData)) {
      return { success: false, error: 'Invalid logs data structure: missing required fields' };
    }

    return { success: true, data: { ...logsData, endIndex: objectStart + jsonString.length } };
  } catch (error) {
    return {
      success: false,
      error: `Invalid logs JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/** Props for the ContentRenderer component that renders AI assistant message content. */
export interface ContentRendererProps {
  /** The raw text content (markdown, YAML, JSON, etc.) to render. */
  content: string;
  /** Opens detected Kubernetes YAML for editing when the user requests it. */
  onYamlDetected?: (yaml: string, resourceType: string) => void;
  /** CSS width value for the prompt container. */
  promptWidth?: string;
  /** Callback to retry a failed tool invocation with the given name and arguments. */
  onRetryTool?: (toolName: string, args: Record<string, unknown>) => void;
  /**
   * Component used to render markdown links. Falls back to MUI Link
   * that opens external URLs in a new tab.
   *
   * Inject a custom renderer to handle framework-specific links
   * (e.g. headlamp-plugin `Link` for Kubernetes resource navigation).
   */
  LinkRendererSlot?: React.ComponentType<LinkRendererProps>;
}

// Table wrapper component with show more functionality - moved outside to preserve state
const TableWrapper: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const maxRows = 5;

  // Extract table rows from children
  const tableElement =
    React.Children.count(children) === 1 ? React.Children.toArray(children)[0] : null;
  if (!React.isValidElement<{ children?: React.ReactNode }>(tableElement)) {
    return <Box sx={{ overflowX: 'auto', width: '100%', mb: 2 }}>{children}</Box>;
  }
  const tableChildren = tableElement.props.children;

  if (!tableChildren) {
    // No children found, return table as is
    return <Box sx={{ overflowX: 'auto', width: '100%', mb: 2 }}>{children}</Box>;
  }

  const tbody = React.Children.toArray(tableChildren).find(child => {
    if (!React.isValidElement<{ component?: React.ElementType }>(child)) return false;
    return child.type === 'tbody' || child.props.component === 'tbody';
  });

  if (!tbody) {
    // No tbody found, return table as is
    return <Box sx={{ overflowX: 'auto', width: '100%', mb: 2 }}>{children}</Box>;
  }

  if (!React.isValidElement<{ children?: React.ReactNode }>(tbody)) {
    return <Box sx={{ overflowX: 'auto', width: '100%', mb: 2 }}>{children}</Box>;
  }
  const tbodyElement = tbody;
  const tbodyChildren = tbodyElement.props.children;
  const rows = tbodyChildren ? React.Children.toArray(tbodyChildren) : [];
  const hasMoreRows = rows.length > maxRows;
  const visibleRows = showAll ? rows : rows.slice(0, maxRows);

  // Clone the tbody with limited rows
  const limitedTbody = React.cloneElement(tbodyElement, {
    children: visibleRows,
  });

  // Clone the table with the limited tbody
  const limitedTable = React.cloneElement(tableElement, {
    children: React.Children.map(tableChildren, child => {
      if (
        React.isValidElement<{ component?: React.ElementType }>(child) &&
        (child.type === 'tbody' || child.props.component === 'tbody')
      ) {
        return limitedTbody;
      }
      return child;
    }),
  });

  return (
    <Box sx={{ overflowX: 'auto', width: '100%', mb: 2 }}>
      {limitedTable}
      {hasMoreRows && (
        <Box sx={{ mt: 1, textAlign: 'center' }}>
          <Button variant="outlined" size="small" onClick={() => setShowAll(!showAll)}>
            {showAll
              ? t('Show Less ({{count}} rows)', { count: maxRows })
              : t('Show More ({{count}} total rows)', { count: rows.length })}
          </Button>
        </Box>
      )}
    </Box>
  );
});

TableWrapper.displayName = 'TableWrapper';

/** Converts a JSON Kubernetes resource to YAML, preserving non-resource input. */
const convertJsonToYaml = (content: string): string => {
  try {
    // First, try to parse as JSON
    const parsed: unknown = JSON.parse(content.trim());

    // Check if it's a Kubernetes resource (has apiVersion and kind)
    if (
      isRecord(parsed) &&
      typeof parsed.apiVersion === 'string' &&
      typeof parsed.kind === 'string'
    ) {
      // Convert to YAML format
      return jsYaml.dump(parsed, {
        sortKeys: false,
        lineWidth: -1,
      });
    }
  } catch {}
  return content;
};

/** @returns Whether content is a JSON object with string `apiVersion` and `kind` fields. */
const isJsonKubernetesResource = (content: string): boolean => {
  try {
    const trimmed = content.trim();
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
      return false;
    }

    const parsed: unknown = JSON.parse(trimmed);
    return (
      isRecord(parsed) && typeof parsed.apiVersion === 'string' && typeof parsed.kind === 'string'
    );
  } catch {
    return false;
  }
};

// Memoized markdown components to prevent remounting
const markdownComponents = {
  // Override h1 rendering
  h1: React.memo(({ node: _node, ref: _ref, ...props }) => (
    <Typography
      component="h1"
      variant="h4"
      gutterBottom
      sx={{ overflowWrap: 'break-word' }}
      {...props}
    />
  )),
  // Override h2 rendering
  h2: React.memo(({ node: _node, ref: _ref, ...props }) => (
    <Typography
      component="h2"
      variant="h5"
      gutterBottom
      sx={{ overflowWrap: 'break-word' }}
      {...props}
    />
  )),
  // Override h3 rendering
  h3: React.memo(({ node: _node, ref: _ref, ...props }) => (
    <Typography
      component="h3"
      variant="h6"
      gutterBottom
      sx={{ overflowWrap: 'break-word' }}
      {...props}
    />
  )),
  // Override paragraph rendering
  p: React.memo(({ node: _node, ref: _ref, ...props }) => (
    <Typography variant="body1" paragraph sx={{ overflowWrap: 'break-word' }} {...props} />
  )),
  // Style for tables
  table: React.memo(({ node: _node, ref: _ref, ...props }) => (
    <TableWrapper>
      <Box component="table" sx={{ minWidth: '400px', borderCollapse: 'collapse' }} {...props} />
    </TableWrapper>
  )),
  // Style for table headers
  th: React.memo(({ node: _node, ref: _ref, ...props }) => (
    <Box
      component="th"
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        padding: '8px 16px',
        textAlign: 'left',
        fontWeight: 'bold',
      }}
      {...props}
    />
  )),
  // Style for table cells
  td: React.memo(({ node: _node, ref: _ref, ...props }) => (
    <Box
      component="td"
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        padding: '8px 16px',
        textAlign: 'left',
      }}
      {...props}
    />
  )),
  // Style for lists
  ul: React.memo(({ node: _node, ref: _ref, ...props }) => (
    <Box component="ul" sx={{ pl: 2, mb: 2, overflowWrap: 'break-word' }} {...props} />
  )),
  ol: React.memo(({ node: _node, ref: _ref, ...props }) => (
    <Box component="ol" sx={{ pl: 2, mb: 2, overflowWrap: 'break-word' }} {...props} />
  )),
  li: React.memo(({ node: _node, ref: _ref, ...props }) => (
    <Box component="li" sx={{ mb: 1, overflowWrap: 'break-word' }} {...props} />
  )),
  // Style for blockquotes
  blockquote: React.memo(({ node: _node, ref: _ref, ...props }) => (
    <Box
      component="blockquote"
      sx={{
        borderLeft: '4px solid',
        borderColor: 'divider',
        pl: 2,
        my: 2,
        color: 'text.secondary',
        overflowWrap: 'break-word',
      }}
      {...props}
    />
  )),
} satisfies Components;

// Add display names for better debugging
markdownComponents.h1.displayName = 'MarkdownH1';
markdownComponents.h2.displayName = 'MarkdownH2';
markdownComponents.h3.displayName = 'MarkdownH3';
markdownComponents.p.displayName = 'MarkdownP';
markdownComponents.table.displayName = 'MarkdownTable';
markdownComponents.th.displayName = 'MarkdownTh';
markdownComponents.td.displayName = 'MarkdownTd';
markdownComponents.ul.displayName = 'MarkdownUl';
markdownComponents.ol.displayName = 'MarkdownOl';
markdownComponents.li.displayName = 'MarkdownLi';
markdownComponents.blockquote.displayName = 'MarkdownBlockquote';

/**
 * Renders AI assistant message content with rich formatting.
 *
 * Supports markdown, Kubernetes YAML/JSON detection and display,
 * MCP formatted output, log buttons, and custom link rendering.
 */
const ContentRenderer: React.FC<ContentRendererProps> = React.memo(
  ({
    content,
    onYamlDetected,
    onRetryTool,
    promptWidth,
    LinkRendererSlot = DefaultLinkRenderer,
  }) => {
    // Create code component that has access to onYamlDetected
    const CodeComponent = React.useMemo(() => {
      /** Extract a plain string from React children (may be string, array, or nested elements). */
      const extractText = (node: React.ReactNode): string => {
        if (typeof node === 'string') return node;
        if (typeof node === 'number') return String(node);
        if (Array.isArray(node)) return node.map(extractText).join('');
        if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
          return extractText(node.props.children);
        }
        return '';
      };

      const component: NonNullable<Components['code']> = ({
        node: _node,
        ref: _ref,
        className,
        children,
        ...props
      }) => {
        // Robustly get the text content from children (string or array)
        const textContent = extractText(children);
        const isBlock = Boolean(className) || textContent.includes('\n');

        // Check if this is a YAML code block
        const isYamlBlock =
          isBlock &&
          (className === 'language-yaml' ||
            className === 'language-yml' ||
            (textContent.includes('apiVersion:') && textContent.includes('kind:')));

        // Check if this is a JSON code block with Kubernetes resource
        const isJsonKubernetesBlock =
          isBlock && (className === 'language-json' || isJsonKubernetesResource(textContent));

        if (isYamlBlock && textContent) {
          const parsed = parseKubernetesYAML(textContent);
          if (parsed.isValid) {
            return (
              <YamlDisplay
                yaml={textContent}
                title={parsed.resourceType}
                onOpenInEditor={onYamlDetected}
              />
            );
          }
        }

        if (isJsonKubernetesBlock && textContent) {
          // Convert JSON to YAML and display
          const yamlContent = convertJsonToYaml(textContent);
          const parsed = parseKubernetesYAML(yamlContent);
          if (parsed.isValid) {
            return (
              <YamlDisplay
                yaml={yamlContent}
                title={`${parsed.resourceType}${parsed.name ? ` - ${parsed.name}` : ''}`}
                onOpenInEditor={onYamlDetected}
              />
            );
          }
        }

        // Regular code block styling
        return isBlock ? (
          <Box
            component="pre"
            sx={{
              backgroundColor: (theme: Theme) =>
                theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
              color: (theme: Theme) =>
                theme.palette.mode === 'dark' ? theme.palette.grey[100] : theme.palette.grey[900],
              padding: 2,
              borderRadius: 1,
              overflowX: 'auto',
              '& code': {
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
              },
            }}
          >
            <Box component="code" className={className} {...props}>
              {children}
            </Box>
          </Box>
        ) : (
          <Box
            component="code"
            sx={{
              backgroundColor: (theme: Theme) =>
                theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
              color: (theme: Theme) =>
                theme.palette.mode === 'dark' ? theme.palette.grey[100] : theme.palette.grey[900],
              padding: '0.1em 0.3em',
              borderRadius: '0.3em',
              fontSize: '85%',
              wordWrap: 'break-word',
            }}
            className={className}
            {...props}
          >
            {children}
          </Box>
        );
      };
      return component;
    }, [onYamlDetected]);

    // Combine all components
    const allMarkdownComponents = React.useMemo(
      () => ({
        ...markdownComponents,
        code: CodeComponent,
        a: LinkRendererSlot,
      }),
      [CodeComponent, LinkRendererSlot]
    );

    // Helper function to process content with unformatted YAML
    const processUnformattedYaml = React.useCallback(
      (content: string) => {
        const sections: React.ReactNode[] = [];
        let sectionIndex = 0;

        // Split content by YAML document separators or detect YAML blocks
        const yamlSeparatorRegex = /^---+$/gm;
        const parts = content.split(yamlSeparatorRegex);

        parts.forEach((part, index) => {
          const trimmedPart = part.trim();
          if (!trimmedPart) return;

          // Check if this part is a JSON Kubernetes resource
          if (isJsonKubernetesResource(trimmedPart)) {
            const yamlContent = convertJsonToYaml(trimmedPart);
            const parsed = parseKubernetesYAML(yamlContent);
            if (parsed.isValid) {
              sections.push(
                <YamlDisplay
                  key={`json-yaml-${index}-${sectionIndex++}`}
                  yaml={yamlContent}
                  title={`${parsed.resourceType}${parsed.name ? ` - ${parsed.name}` : ''}`}
                  onOpenInEditor={onYamlDetected}
                />
              );
              return;
            }
          }

          // Check if this part looks like YAML
          const isYamlPart =
            trimmedPart.includes('apiVersion:') &&
            trimmedPart.includes('kind:') &&
            trimmedPart.includes('metadata:');

          if (isYamlPart) {
            // Try to parse as Kubernetes YAML
            const parsed = parseKubernetesYAML(trimmedPart);
            if (parsed.isValid) {
              sections.push(
                <YamlDisplay
                  key={`yaml-${index}-${sectionIndex++}`}
                  yaml={trimmedPart}
                  title={`${parsed.resourceType}${parsed.name ? ` - ${parsed.name}` : ''}`}
                  onOpenInEditor={onYamlDetected}
                />
              );
            } else {
              // Not valid YAML, display as code
              sections.push(
                <Box
                  component="pre"
                  key={`code-${index}-${sectionIndex++}`}
                  sx={{
                    backgroundColor: (theme: Theme) =>
                      theme.palette.mode === 'dark'
                        ? theme.palette.grey[800]
                        : theme.palette.grey[100],
                    color: (theme: Theme) =>
                      theme.palette.mode === 'dark'
                        ? theme.palette.grey[100]
                        : theme.palette.grey[900],
                    padding: 2,
                    borderRadius: 1,
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.85rem',
                  }}
                >
                  {trimmedPart}
                </Box>
              );
            }
          } else {
            // Regular text content - use ReactMarkdown with simplified components
            sections.push(
              <ReactMarkdown
                key={`text-${index}-${sectionIndex++}`}
                remarkPlugins={[remarkGfm]}
                components={{
                  ...markdownComponents,
                  a: LinkRendererSlot,
                  code: CodeComponent,
                }}
              >
                {trimmedPart}
              </ReactMarkdown>
            );
          }
        });

        return <Box>{sections}</Box>;
      },
      [onYamlDetected, LinkRendererSlot, CodeComponent]
    );

    // Process content and detect standalone YAML blocks and logs buttons
    const processedContent = useMemo(() => {
      if (!content) return null;

      // First, check if content is a formatted MCP output (pure JSON)
      try {
        const parsed: unknown = JSON.parse(content.trim());
        if (isRecord(parsed) && isFormattedMCPMessage(content)) {
          // This is a formatted MCP output, use our specialized component
          return <MCPFormattedMessage content={content} isAssistant onRetryTool={onRetryTool} />;
        }
      } catch (error) {
        // Not JSON or not formatted MCP output, continue with normal processing
      }
      // Second, check if content is a JSON response with error or success keys
      const jsonParseResult = parseJsonContent(content.trim());
      if (jsonParseResult.success) {
        const parsedContent = jsonParseResult.data;

        // Check if it's an error response
        if (
          isRecord(parsedContent) &&
          parsedContent.error === true &&
          typeof parsedContent.content === 'string'
        ) {
          return (
            <Alert severity="error" sx={{ mb: 1, overflowWrap: 'anywhere' }}>
              <Typography variant="body2">{parsedContent.content}</Typography>
            </Alert>
          );
        }

        // Check if it's a success response
        if (
          isRecord(parsedContent) &&
          parsedContent.success === true &&
          typeof parsedContent.content === 'string'
        ) {
          return (
            <Alert severity="success" sx={{ mb: 1, overflowWrap: 'anywhere' }}>
              <Typography variant="body2">{parsedContent.content}</Typography>
            </Alert>
          );
        }

        // If it's a JSON response but not error/success, continue with normal processing
        // unless it's a Kubernetes resource, then fall through to regular content processing
        if (!isJsonKubernetesResource(content)) {
          // For other JSON responses that aren't Kubernetes resources,
          // render as formatted JSON
          return (
            <Box
              component="pre"
              sx={{
                backgroundColor: (theme: Theme) => theme.palette.grey[100],
                color: (theme: Theme) => theme.palette.grey[900],
                padding: 2,
                borderRadius: 1,
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                fontSize: '0.85rem',
              }}
            >
              {JSON.stringify(parsedContent, null, 2)}
            </Box>
          );
        }
      }
      // Check if the entire content is a JSON Kubernetes resource
      if (isJsonKubernetesResource(content)) {
        const yamlContent = convertJsonToYaml(content);
        const parsed = parseKubernetesYAML(yamlContent);
        if (parsed.isValid) {
          return (
            <YamlDisplay
              yaml={yamlContent}
              title={`${parsed.resourceType}${parsed.name ? ` - ${parsed.name}` : ''}`}
              onOpenInEditor={onYamlDetected}
            />
          );
        }
      }

      // Check for logs button format
      if (content.includes('LOGS_BUTTON:')) {
        const logsButtonIndex = content.indexOf('LOGS_BUTTON:');
        if (logsButtonIndex !== -1) {
          const logsResult = parseLogsButtonData(content, logsButtonIndex);
          if (logsResult.success) {
            const logsData = logsResult.data;
            const prefix = content.slice(0, logsButtonIndex).trim();
            const suffix = content.slice(logsData.endIndex).trim();
            return (
              <Box>
                {prefix && (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={allMarkdownComponents}>
                    {prefix}
                  </ReactMarkdown>
                )}
                <LogsButton
                  logs={logsData.data.logs}
                  resourceName={logsData.data.resourceName}
                  resourceType={logsData.data.resourceType}
                  namespace={logsData.data.namespace}
                  containerName={logsData.data.containerName}
                />
                {suffix && (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={allMarkdownComponents}>
                    {suffix}
                  </ReactMarkdown>
                )}
              </Box>
            );
          }
        }
      }

      // First, let's detect if this content has unformatted YAML (not in code blocks)
      // or JSON Kubernetes resources that need special handling
      const hasUnformattedYaml =
        content.includes('apiVersion:') &&
        content.includes('kind:') &&
        content.includes('metadata:') &&
        !content.includes('```yaml') &&
        !content.includes('```yml');

      const hasJsonKubernetesResource = content
        .split(/^---+$/gm)
        .some(part => isJsonKubernetesResource(part.trim()));

      if (hasUnformattedYaml || hasJsonKubernetesResource) {
        // Handle content with unformatted YAML or JSON resources
        return processUnformattedYaml(content);
      }

      // For regular markdown content, use ReactMarkdown
      return (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={allMarkdownComponents}>
          {content}
        </ReactMarkdown>
      );
    }, [allMarkdownComponents, content, onRetryTool, processUnformattedYaml]);

    return (
      <Box
        sx={{ width: promptWidth ?? '100%', overflowWrap: 'break-word', wordWrap: 'break-word' }}
      >
        {processedContent}
      </Box>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if content or onYamlDetected actually changed
    return (
      prevProps.content === nextProps.content &&
      prevProps.onYamlDetected === nextProps.onYamlDetected &&
      prevProps.onRetryTool === nextProps.onRetryTool &&
      prevProps.promptWidth === nextProps.promptWidth &&
      prevProps.LinkRendererSlot === nextProps.LinkRendererSlot
    );
  }
);

ContentRenderer.displayName = 'ContentRenderer';

export default ContentRenderer;

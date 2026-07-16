/**
 * Renders normalized MCP tool output as tables, metrics, lists, graphs, text,
 * errors, or raw JSON. Formatter-specific extension data is treated as
 * untrusted and narrowed before it reaches the individual renderers.
 */

import type {
  FormattedMCPData,
  FormattedMCPOutput,
} from '@headlamp-k8s/ai-common/mcp/tools/formattedOutput';
import { Icon } from '@iconify/react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Collapse,
  Divider,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import dockerfile from 'react-syntax-highlighter/dist/esm/languages/prism/docker';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('sh', bash);
SyntaxHighlighter.registerLanguage('shell', bash);
SyntaxHighlighter.registerLanguage('dockerfile', dockerfile);
SyntaxHighlighter.registerLanguage('go', go);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('py', python);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('yml', yaml);
import remarkGfm from 'remark-gfm';

/** Props for {@link MCPOutputDisplay}. */
export interface MCPOutputDisplayProps {
  /** Structured MCP output to render. */
  output: FormattedMCPOutput;
  /** Retries the underlying tool invocation when supported. */
  onRetry?: () => void;
  /** Exports the rendered data in the selected format. */
  onExport?: (format: 'json' | 'csv' | 'txt') => void;
  /** Starts in a collapsed layout when true. */
  compact?: boolean;
}

type SyntaxTheme = NonNullable<React.ComponentProps<typeof SyntaxHighlighter>['style']>;

/** Normalized metric accepted by the metrics renderer. */
interface MetricItem {
  /** Human-readable metric name. */
  label: string;
  /** Display value supplied by the formatter. */
  value: string | number;
  /** Optional severity used to select a semantic color. */
  status?: string;
}

/** Normalized entry accepted by the list renderer. */
interface ListItem {
  /** Primary text displayed for the entry. */
  text: string;
  /** Optional severity used for the leading border. */
  status?: string;
  /** Optional secondary text displayed below the entry. */
  metadata?: string;
}

/** @returns Whether an untrusted value is a non-null object mapping. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Keeps only string values from an untrusted array.
 *
 * @param value - Formatter extension value to normalize.
 * @returns Valid string entries, or an empty array for other values.
 */
function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

/**
 * Normalizes formatter extension data into renderable metrics.
 *
 * @param value - Untrusted primary, secondary, or trend metric data.
 * @returns Metrics with valid labels, values, and optional statuses.
 */
function metricArray(value: unknown): MetricItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is MetricItem =>
      isRecord(item) &&
      typeof item.label === 'string' &&
      (typeof item.value === 'string' || typeof item.value === 'number') &&
      (item.status === undefined || typeof item.status === 'string')
  );
}

/**
 * Normalizes formatter extension data into renderable list entries.
 *
 * @param value - Untrusted list item data.
 * @returns Entries with valid text and optional metadata.
 */
function listItems(value: unknown): ListItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is ListItem =>
      isRecord(item) &&
      typeof item.text === 'string' &&
      (item.status === undefined || typeof item.status === 'string') &&
      (item.metadata === undefined || typeof item.metadata === 'string')
  );
}

/**
 * Serializes arbitrary formatter data without throwing on circular references.
 *
 * @param value - Value to serialize.
 * @param indentation - Optional JSON indentation level.
 * @returns JSON text with repeated references replaced by `[Circular]`.
 */
export function safeStringify(value: unknown, indentation?: number): string {
  const seen = new WeakSet<object>();
  try {
    return JSON.stringify(
      value,
      (_key, item: unknown) => {
        if (typeof item !== 'object' || item === null) return item;
        if (seen.has(item)) return '[Circular]';
        seen.add(item);
        return item;
      },
      indentation
    );
  } catch {
    return String(value);
  }
}

/**
 * Converts a CSS width into the constrained pixel width used by output cards.
 *
 * @param width - Width in viewport units, pixels, or a numeric pixel string.
 * @returns Pixel width with layout padding removed and a 300px minimum.
 */
function calculateWidth(width: string): string {
  if (!width) return '800px'; // fallback

  // Handle viewport width (vw) units
  if (width.includes('vw')) {
    const vwValue = parseFloat(width.replace('vw', ''));
    const pixelWidth = Math.floor(window.innerWidth * (vwValue / 100));
    const adjustedWidth = Math.max(300, pixelWidth - 30); // Subtract 30px, minimum 300px
    return `${adjustedWidth}px`;
  }

  // Handle pixel (px) units
  if (width.includes('px')) {
    const pixelValue = parseInt(width.replace('px', ''), 10);
    const adjustedWidth = Math.max(300, pixelValue - 30); // Subtract 30px, minimum 300px
    return `${adjustedWidth}px`;
  }

  // Handle numeric values (assume pixels)
  const numericValue = parseInt(width, 10);
  if (!isNaN(numericValue)) {
    const adjustedWidth = Math.max(300, numericValue - 30); // Subtract 30px, minimum 300px
    return `${adjustedWidth}px`;
  }

  // Fallback for any other format
  return '780px'; // 800px - 40px
}

/**
 * Detects whether text output should be rendered as Markdown.
 *
 * Explicit Markdown language identifiers always win. Otherwise at least two
 * common Markdown patterns are required to avoid treating ordinary prose as markup.
 *
 * @param data - Text-oriented MCP output data.
 * @returns Whether the content should use the Markdown renderer.
 */
export function isMarkdownContent(data: FormattedMCPData): boolean {
  // Check if language is explicitly markdown
  if (data.language === 'markdown' || data.language === 'md') {
    return true;
  }

  // Check for markdown patterns in content
  if (typeof data.content === 'string') {
    const content = data.content;

    // Common markdown patterns
    const markdownPatterns = [
      /^#{1,6}\s+/m, // Headers (# ## ### etc.)
      /^\s*[-*+]\s+/m, // Lists (- * +)
      /^\s*\d+\.\s+/m, // Numbered lists (1. 2. etc.)
      /\*\*[^*]+\*\*/, // Bold text
      /\*[^*]+\*/, // Italic text
      /`[^`]+`/, // Inline code
      /```[\s\S]*?```/, // Code blocks
      /\[.*?\]\(.*?\)/, // Links [text](url)
      /^\s*>\s+/m, // Blockquotes
      /^\s*\|.*\|/m, // Tables
    ];

    // Count how many patterns match
    const matchCount = markdownPatterns.filter(pattern => pattern.test(content)).length;

    // If we find 2 or more markdown patterns, consider it markdown
    return matchCount >= 2;
  }

  return false;
}

/** Renders Markdown text, highlights, fenced code, and optional full content. */
const MarkdownRenderer: React.FC<{
  data: FormattedMCPData;
  width: string;
  syntaxTheme: SyntaxTheme;
}> = ({ data, width, syntaxTheme }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [showFullContent, setShowFullContent] = useState(false);
  const content = typeof data.content === 'string' ? data.content : '';
  const fullContent = typeof data.fullContent === 'string' ? data.fullContent : content;
  const highlights = stringArray(data.highlights);

  // Check if content appears to be truncated
  const isTruncated =
    content.includes('[Content truncated for display') ||
    content.includes('[Output truncated...]') ||
    (content.endsWith('...') && fullContent !== content);

  const displayContent = showFullContent ? fullContent : content;

  return (
    <Box
      sx={{
        width: `${width}`,
        maxWidth: 'none',
        minWidth: 0,
        overflowWrap: 'break-word',
        wordWrap: 'break-word',
      }}
    >
      {highlights.length > 0 && (
        <Box
          sx={{
            mb: 2,
            width: `${width}`,
            maxWidth: 'none',
            minWidth: 0,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          {highlights.map(highlight => (
            <Chip
              key={highlight}
              label={highlight}
              size="small"
              sx={{
                maxWidth: '100%',
                '& .MuiChip-label': {
                  overflowWrap: 'break-word',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                },
              }}
            />
          ))}
        </Box>
      )}

      {/* Truncation notification */}
      {isTruncated && !showFullContent && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button
              size="small"
              onClick={() => setShowFullContent(true)}
              startIcon={<Icon aria-hidden icon="mdi:unfold-more-horizontal" />}
            >
              {t('Show Full Content')}
            </Button>
          }
        >
          <Typography variant="body2">
            {t(
              'Content has been truncated for display. Click "Show Full Content" to view the complete documentation.'
            )}
          </Typography>
        </Alert>
      )}

      <Box
        sx={{
          width: `${width}`,
          maxWidth: 'none',
          minWidth: 0,
          bgcolor: theme.palette.background.default,
          borderRadius: 1,
          p: 2,
          border: 1,
          borderColor: theme.palette.divider,
          maxHeight: showFullContent ? 'none' : '600px',
          overflow: showFullContent ? 'visible' : 'auto',
          '& h1, & h2, & h3, & h4, & h5, & h6': {
            color: theme.palette.text.primary,
            marginTop: 2,
            marginBottom: 1,
            fontWeight: 600,
          },
          '& h1': {
            fontSize: '1.75rem',
            borderBottom: 1,
            borderColor: theme.palette.divider,
            pb: 1,
          },
          '& h2': {
            fontSize: '1.5rem',
            borderBottom: 1,
            borderColor: theme.palette.divider,
            pb: 0.5,
          },
          '& h3': { fontSize: '1.25rem' },
          '& h4': { fontSize: '1.1rem' },
          '& h5, & h6': { fontSize: '1rem' },
          '& p': {
            marginBottom: 1.5,
            lineHeight: 1.6,
            color: theme.palette.text.primary,
          },
          '& ul, & ol': {
            marginBottom: 1.5,
            paddingLeft: 2,
            '& li': {
              marginBottom: 0.5,
              color: theme.palette.text.primary,
            },
          },
          '& blockquote': {
            borderLeft: 4,
            borderColor: theme.palette.primary.main,
            marginLeft: 0,
            marginRight: 0,
            paddingLeft: 2,
            paddingY: 1,
            bgcolor: theme.palette.action.hover,
            borderRadius: '0 4px 4px 0',
            '& p': {
              margin: 0,
              fontStyle: 'italic',
            },
          },
          '& code': {
            bgcolor: theme.palette.action.selected,
            color: theme.palette.primary.main,
            padding: '2px 4px',
            borderRadius: 1,
            fontSize: '0.875rem',
            fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
          },
          '& pre': {
            margin: 0,
            marginBottom: 1.5,
            overflow: 'auto',
            borderRadius: 1,
            '& code': {
              display: 'block',
              padding: 1.5,
              background: 'none',
              color: 'inherit',
            },
          },
          '& table': {
            width: 'max-content',
            minWidth: '100%',
            borderCollapse: 'collapse',
            marginBottom: 1.5,
            '& th, & td': {
              border: 1,
              borderColor: theme.palette.divider,
              padding: 1,
              textAlign: 'left',
              minWidth: '120px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
            '& th': {
              bgcolor: theme.palette.action.hover,
              fontWeight: 600,
              color: theme.palette.text.primary,
            },
            '& td': {
              color: theme.palette.text.primary,
            },
          },
          '& a': {
            color: theme.palette.primary.main,
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
          '& hr': {
            border: 'none',
            borderTop: 1,
            borderColor: theme.palette.divider,
            marginY: 2,
          },
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              const isInline = !language && !String(children).includes('\n');

              if (!isInline && language) {
                return (
                  <SyntaxHighlighter
                    language={language}
                    style={syntaxTheme}
                    customStyle={{
                      fontSize: '14px',
                      margin: 0,
                      borderRadius: '4px',
                    }}
                    wrapLongLines
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                );
              }

              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            a({ href, children, node: _node, ref: _ref, ...props }) {
              const safeHref = href && /^(https?:|mailto:|#)/i.test(href) ? href : '#';
              const isExternal = /^https?:\/\//i.test(safeHref);
              return (
                <a
                  href={safeHref}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  {...props}
                >
                  {children}
                </a>
              );
            },
          }}
        >
          {displayContent}
        </ReactMarkdown>
      </Box>

      {/* Collapse button for expanded content */}
      {showFullContent && isTruncated && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            size="small"
            onClick={() => setShowFullContent(false)}
            startIcon={<Icon aria-hidden icon="mdi:unfold-less-horizontal" />}
            variant="outlined"
          >
            {t('Collapse to Summary')}
          </Button>
        </Box>
      )}
    </Box>
  );
};

/**
 * Tracks the host prompt width and updates it when the viewport changes.
 *
 * The host may expose `#prompt-container`; otherwise the viewport width is used.
 *
 * @returns Current CSS width used to size the MCP output card.
 */
function usePromptWidth(): { promptWidth: string | null } {
  const [promptWidth, setPromptWidth] = useState<string | null>(null);

  useEffect(() => {
    const updateWidth = () => {
      const promptElement = document.getElementById('prompt-container');
      if (promptElement) {
        const computedStyle = getComputedStyle(promptElement);
        const width = computedStyle.width;
        setPromptWidth(width);
      } else {
        setPromptWidth(`${window.innerWidth}px`);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return { promptWidth };
}

/**
 * Displays formatted MCP output with summaries, typed variant renderers,
 * metadata, export controls, retry actions, and optional raw data.
 *
 * @param props - Structured output and optional interaction callbacks.
 * @returns A responsive output card for the selected MCP presentation type.
 */
const MCPOutputDisplay: React.FC<MCPOutputDisplayProps> = ({
  output,
  onRetry,
  onExport,
  compact = false,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { promptWidth } = usePromptWidth();
  const [expanded, setExpanded] = useState(!compact);
  const [showRawData, setShowRawData] = useState(false);
  const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);
  const [width, setWidth] = useState(calculateWidth(promptWidth?.toString() || '800px')); // Default width if not provided
  const isDarkMode = theme.palette.mode === 'dark';
  const syntaxTheme = isDarkMode ? oneDark : oneLight;

  useEffect(() => {
    const calculatedWidth = calculateWidth(promptWidth?.toString() || '800px');
    setWidth(calculatedWidth);
  }, [promptWidth]);
  // Get status color based on type or warnings
  const getStatusColor = () => {
    if (output.type === 'error') return 'error';
    if (output.warnings && output.warnings.length > 0) return 'warning';
    return 'primary';
  };

  // Get icon based on output type
  const getTypeIcon = () => {
    switch (output.type) {
      case 'table':
        return 'mdi:table';
      case 'metrics':
        return 'mdi:chart-line';
      case 'list':
        return 'mdi:format-list-bulleted';
      case 'graph':
        return 'mdi:chart-bar';
      case 'text':
        return 'mdi:text';
      case 'error':
        return 'mdi:alert-circle';
      default:
        return 'mdi:file-document';
    }
  };

  const renderContent = () => {
    switch (output.type) {
      case 'table':
        return <TableDisplay data={output.data} width={width} />;
      case 'metrics':
        return <MetricsDisplay data={output.data} width={width} />;
      case 'list':
        return <ListDisplay data={output.data} width={width} />;
      case 'graph':
        return <GraphDisplay data={output.data} width={width} />;
      case 'text':
        return <TextDisplay data={output.data} theme={syntaxTheme} width={width} />;
      case 'error':
        return <ErrorDisplay data={output.data} onRetry={onRetry} width={width} />;
      default:
        return <RawDisplay data={output.data} theme={syntaxTheme} width={width} />;
    }
  };

  return (
    <Box
      sx={{
        // Force the component to use full available width regardless of parent constraints
        width: `${width}`, // Use measured width in pixels
        maxWidth: 'none', // Override any inherited maxWidth
        minWidth: 0,
        overflow: 'visible',
        display: 'block',
        pr: 2, // Add right padding for better readability
      }}
    >
      <Card
        variant="outlined"
        sx={{
          mb: 2,
          backgroundColor: theme.palette.background.paper,
          borderColor: output.type === 'error' ? theme.palette.error.main : theme.palette.divider,
          borderWidth: output.type === 'error' ? 2 : 1,
          width: '100%', // Use 100% of parent container (which has padding)
          maxWidth: 'none', // Override any inherited maxWidth
          minWidth: 0, // Allow shrinking
          overflowWrap: 'break-word',
          wordWrap: 'break-word',
          wordBreak: 'break-word',
        }}
      >
        {/* Hide header for errors - show only content */}
        {output.type !== 'error' && (
          <CardHeader
            avatar={
              <Icon
                aria-hidden
                icon={getTypeIcon()}
                style={{
                  fontSize: 24,
                  color: theme.palette[getStatusColor()].main,
                }}
              />
            }
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" component="div">
                  {output.title}
                </Typography>
                <Chip
                  label={output.type.toUpperCase()}
                  size="small"
                  color={getStatusColor()}
                  variant="outlined"
                />
                {output.metadata && (
                  <Tooltip
                    title={t('{{total}} data points • {{time}}ms', {
                      total: output.metadata.dataPoints,
                      time: output.metadata.processingTime,
                    })}
                  >
                    <Chip
                      label={t('{{total}} items', { total: output.metadata.dataPoints })}
                      size="small"
                      variant="outlined"
                    />
                  </Tooltip>
                )}
              </Box>
            }
            subheader={output.summary}
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                {onExport && (
                  <Tooltip title={t('Export data')}>
                    <Box>
                      <IconButton
                        aria-label={t('Export data')}
                        size="small"
                        onClick={event => setExportAnchor(event.currentTarget)}
                        sx={{ mr: 2 }}
                      >
                        <Icon aria-hidden icon="mdi:download" />
                      </IconButton>
                      <Menu
                        anchorEl={exportAnchor}
                        open={exportAnchor !== null}
                        onClose={() => setExportAnchor(null)}
                      >
                        {(['json', 'csv', 'txt'] as const).map(format => (
                          <MenuItem
                            key={format}
                            onClick={() => {
                              onExport(format);
                              setExportAnchor(null);
                            }}
                          >
                            {format === 'txt' ? t('Text') : format.toUpperCase()}
                          </MenuItem>
                        ))}
                      </Menu>
                    </Box>
                  </Tooltip>
                )}
                <Tooltip title={t('Show raw data')}>
                  <IconButton
                    aria-label={t('Show raw data')}
                    size="small"
                    onClick={() => setShowRawData(!showRawData)}
                    color={showRawData ? 'primary' : 'default'}
                    sx={{ mr: 2 }}
                  >
                    <Icon aria-hidden icon="mdi:code-json" />
                  </IconButton>
                </Tooltip>
                {compact && (
                  <IconButton
                    aria-label={expanded ? t('Collapse output') : t('Expand output')}
                    size="small"
                    onClick={() => setExpanded(!expanded)}
                  >
                    <Icon aria-hidden icon={expanded ? 'mdi:chevron-up' : 'mdi:chevron-down'} />
                  </IconButton>
                )}
              </Box>
            }
            sx={{ pb: 1 }}
          />
        )}

        <Collapse in={output.type === 'error' ? true : expanded}>
          <CardContent
            sx={{
              pt: 0,
              width: width, // Use full available width
              minWidth: 0, // Allow shrinking
              overflowWrap: 'break-word',
              wordWrap: 'break-word',
              '& > *': {
                width: '100%',
                minWidth: 0,
                overflowWrap: 'break-word',
                wordWrap: 'break-word',
              },
            }}
          >
            {/* Skip warnings, insights, and actionable items for errors */}
            {output.type !== 'error' && (
              <>
                {/* Warnings */}
                {output.warnings && output.warnings.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {t('Warnings:')}
                    </Typography>
                    {output.warnings.map(warning => (
                      <Typography key={warning} variant="body2">
                        • {warning}
                      </Typography>
                    ))}
                  </Alert>
                )}
              </>
            )}

            {/* Main Content */}
            {renderContent()}

            {/* Skip insights and actionable items for errors */}
            {output.type !== 'error' && (
              <>
                {/* Insights */}
                {output.insights && output.insights.length > 0 && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      mt: 2,
                      bgcolor: theme.palette.action.hover,
                      borderColor: theme.palette.divider,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 'bold',
                        mb: 1,
                        color: theme.palette.text.primary,
                      }}
                    >
                      <Icon
                        aria-hidden
                        icon="mdi:lightbulb"
                        style={{
                          marginRight: 8,
                          color: theme.palette.primary.main,
                        }}
                      />
                      {t('Key Insights:')}
                    </Typography>
                    {output.insights.map(insight => (
                      <Typography
                        key={insight}
                        variant="body2"
                        sx={{
                          mb: 0.5,
                          color: theme.palette.text.primary,
                        }}
                      >
                        • {insight}
                      </Typography>
                    ))}
                  </Paper>
                )}

                {/* Actionable Items */}
                {output.actionable_items && output.actionable_items.length > 0 && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      mt: 2,
                      bgcolor: theme.palette.action.hover,
                      borderColor: theme.palette.divider,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 'bold',
                        mb: 1,
                        color: theme.palette.text.primary,
                      }}
                    >
                      <Icon
                        aria-hidden
                        icon="mdi:check-circle"
                        style={{
                          marginRight: 8,
                          color: theme.palette.success.main,
                        }}
                      />
                      {t('Recommended Actions:')}
                    </Typography>
                    {output.actionable_items.map(item => (
                      <Typography
                        key={item}
                        variant="body2"
                        sx={{
                          mb: 0.5,
                          color: theme.palette.text.primary,
                        }}
                      >
                        • {item}
                      </Typography>
                    ))}
                  </Paper>
                )}
              </>
            )}

            {/* Raw Data Collapse */}
            <Collapse in={showRawData}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('Raw Data:')}
              </Typography>
              <SyntaxHighlighter
                language="json"
                style={syntaxTheme}
                customStyle={{
                  fontSize: '12px',
                  maxHeight: '300px',
                  overflow: 'auto',
                  width: `${width}`, // Use fixed pixel width
                  maxWidth: 'none',
                  minWidth: 0,
                  margin: 0,
                  padding: '12px',
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                }}
                wrapLongLines
              >
                {safeStringify(output.data, 2)}
              </SyntaxHighlighter>
            </Collapse>

            {/* Metadata */}
            {output.metadata && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={t('Tool: {{toolName}}', { toolName: output.metadata.toolName })}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`${(output.metadata.responseSize / 1024).toFixed(1)}KB`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`${output.metadata.processingTime}ms`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            )}
          </CardContent>
        </Collapse>
      </Card>
    </Box>
  );
};

/** Renders sortable tabular output while preserving original highlighted row identity. */
const TableDisplay: React.FC<{ data: FormattedMCPData; width: string }> = ({ data, width }) => {
  const theme = useTheme();
  const headers = Array.isArray(data.headers) ? data.headers : [];
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const initialSortBy = typeof data.sortBy === 'string' ? data.sortBy : null;
  const highlightRows = Array.isArray(data.highlightRows)
    ? data.highlightRows.filter((item): item is number => typeof item === 'number')
    : [];
  const [sortBy, setSortBy] = useState<string | null>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const sortedRows = React.useMemo(() => {
    const indexedRows = rows.map((row, originalIndex) => ({ row, originalIndex }));
    if (!sortBy) return indexedRows;

    const columnIndex = headers.indexOf(sortBy);
    if (columnIndex === -1) return indexedRows;

    return indexedRows.sort((a, b) => {
      const aVal = a.row[columnIndex];
      const bVal = b.row[columnIndex];

      const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [headers, rows, sortBy, sortOrder]);

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        width: width, // Use fixed pixel width for container
        maxWidth: 'none',
        minWidth: 0,
        overflowX: 'auto', // Enable horizontal scrolling
        overflowY: 'visible',
        backgroundColor: theme.palette.background.paper,
        borderColor: theme.palette.divider,
        '& .MuiTable-root': {
          minWidth: 'max-content', // Allow table to be wider than container
          tableLayout: 'auto', // Let table size itself naturally
        },
      }}
    >
      <Table
        size="small"
        sx={{
          minWidth: 'max-content', // Allow table to grow beyond container width
          wordBreak: 'break-word',
          '& .MuiTableCell-root': {
            // Ensure all cells can wrap text properly while maintaining minimum width
            whiteSpace: 'nowrap', // Prevent wrapping for horizontal scroll to work
            minWidth: '120px', // Minimum column width
            paddingX: 1,
            '&:first-of-type': {
              paddingLeft: 2,
            },
            '&:last-of-type': {
              paddingRight: 2,
            },
          },
          '& .MuiTableCell-head': {
            fontWeight: 'bold',
            backgroundColor: theme.palette.action.hover,
            color: theme.palette.text.primary,
            position: 'sticky',
            top: 0,
            zIndex: 1,
          },
          '& .MuiTableCell-body': {
            color: theme.palette.text.primary,
          },
        }}
      >
        <TableHead>
          <TableRow>
            {headers.map(header => (
              <TableCell
                key={header}
                onClick={() => handleSort(header)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleSort(header);
                  }
                }}
                tabIndex={0}
                aria-sort={
                  sortBy === header ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'
                }
                sx={{
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  minWidth: '120px',
                  maxWidth: '300px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  paddingX: 1,
                  '&:first-of-type': {
                    paddingLeft: 2,
                  },
                  '&:last-of-type': {
                    paddingRight: 2,
                  },
                }}
                title={header} // Show full header on hover
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{header}</span>
                  {sortBy === header && (
                    <Icon
                      aria-hidden
                      icon={sortOrder === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'}
                      style={{ fontSize: 16, flexShrink: 0 }}
                    />
                  )}
                </Box>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedRows.map(({ row, originalIndex }) => (
            <TableRow
              key={originalIndex}
              sx={{
                backgroundColor: highlightRows.includes(originalIndex)
                  ? theme.palette.warning.light
                  : 'transparent',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              {row.map((cell, cellIndex) => (
                <TableCell
                  key={cellIndex}
                  sx={{
                    minWidth: '120px', // Minimum column width
                    maxWidth: '300px', // Maximum column width to prevent extremely wide columns
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    paddingX: 1,
                    '&:first-of-type': {
                      paddingLeft: 2,
                    },
                    '&:last-of-type': {
                      paddingRight: 2,
                    },
                  }}
                  title={typeof cell === 'object' ? safeStringify(cell) : String(cell)}
                >
                  {typeof cell === 'object' ? safeStringify(cell) : String(cell)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/** Renders normalized primary, secondary, and trend metrics. */
const MetricsDisplay: React.FC<{ data: FormattedMCPData; width: string }> = ({ data, width }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const primary = metricArray(data.primary);
  const secondary = metricArray(data.secondary);
  const trends = metricArray(data.trends);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'primary';
    }
  };

  return (
    <Box
      sx={{
        width: width, // Use fixed pixel width
        maxWidth: 'none',
        minWidth: 0,
        overflowWrap: 'break-word',
        wordWrap: 'break-word',
      }}
    >
      {/* Primary Metrics */}
      {primary.length > 0 && (
        <Grid
          container
          spacing={2}
          sx={{
            mb: 2,
            width: width, // Use fixed pixel width
            maxWidth: 'none',
            minWidth: 0,
          }}
        >
          {primary.map(metric => (
            <Grid item xs={12} sm={6} md={4} key={metric.label}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  textAlign: 'center',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  overflowWrap: 'break-word',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  backgroundColor: theme.palette.background.paper,
                  borderColor: theme.palette.divider,
                }}
              >
                <Typography
                  variant="h4"
                  color={getStatusColor(metric.status)}
                  sx={{
                    overflowWrap: 'break-word',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                >
                  {metric.value}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    overflowWrap: 'break-word',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                >
                  {metric.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Secondary Metrics */}
      {secondary.length > 0 && (
        <Grid
          container
          spacing={1}
          sx={{
            width: width, // Use fixed pixel width
            maxWidth: 'none',
            minWidth: 0,
          }}
        >
          {secondary.map(metric => (
            <Grid item xs={6} sm={4} md={3} key={metric.label}>
              <Box
                sx={{
                  p: 1,
                  textAlign: 'center',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  overflowWrap: 'break-word',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                }}
              >
                <Typography
                  variant="h6"
                  color={getStatusColor(metric.status)}
                  sx={{
                    overflowWrap: 'break-word',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                >
                  {metric.value}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    overflowWrap: 'break-word',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                >
                  {metric.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Trends */}
      {trends.length > 0 && (
        <Box
          sx={{
            mt: 2,
            width: width, // Use fixed pixel width
            maxWidth: 'none',
            minWidth: 0,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              mb: 1,
              overflowWrap: 'break-word',
              wordWrap: 'break-word',
              wordBreak: 'break-word',
            }}
          >
            {t('Trends:')}
          </Typography>
          <Grid
            container
            spacing={1}
            sx={{
              width: width, // Use fixed pixel width
              maxWidth: 'none',
              minWidth: 0,
            }}
          >
            {trends.map(trend => (
              <Grid item xs={12} sm={6} key={trend.label}>
                <Chip
                  label={`${trend.label}: ${trend.value}`}
                  color={getStatusColor(trend.status)}
                  variant="outlined"
                  sx={{
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    '& .MuiChip-label': {
                      overflowWrap: 'break-word',
                      wordWrap: 'break-word',
                      wordBreak: 'break-word',
                    },
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

/** Renders normalized list entries with optional severity and metadata. */
const ListDisplay: React.FC<{ data: FormattedMCPData; width: string }> = ({ data, width }) => {
  const theme = useTheme();
  const items = listItems(data.items);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'info':
        return theme.palette.info.main;
      default:
        return theme.palette.text.primary;
    }
  };

  return (
    <Box
      sx={{
        width: width, // Use fixed pixel width
        maxWidth: 'none',
        minWidth: 0,
        overflowWrap: 'break-word',
        wordWrap: 'break-word',
      }}
    >
      {items.map(item => (
        <Paper
          key={`${item.text}-${item.metadata ?? ''}`}
          variant="outlined"
          sx={{
            p: 2,
            mb: 1,
            borderLeft: '4px solid',
            borderLeftColor: getStatusColor(item.status),
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            overflowWrap: 'break-word',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.divider,
          }}
        >
          <Typography variant="body1" sx={{ wordWrap: 'break-word', wordBreak: 'break-word' }}>
            {item.text}
          </Typography>
          {item.metadata && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ wordWrap: 'break-word', wordBreak: 'break-word' }}
            >
              {item.metadata}
            </Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
};

/** Renders graph metadata while the graph visualization implementation is pending. */
const GraphDisplay: React.FC<{ data: FormattedMCPData; width: string }> = ({ data, width }) => {
  const { t } = useTranslation();
  const description =
    typeof data.description === 'string'
      ? data.description
      : t('Chart visualization would appear here');
  const chartType = typeof data.chartType === 'string' ? data.chartType : t('Unknown');
  const datasetCount = Array.isArray(data.datasets) ? data.datasets.length : 0;

  return (
    <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', width: width, maxWidth: 'none' }}>
      <Icon aria-hidden icon="mdi:chart-bar" style={{ fontSize: 48, opacity: 0.5 }} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        {t('Graph Visualization')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        {t('Chart Type: {{chartType}} • {{total}} datasets', {
          chartType,
          total: datasetCount,
        })}
      </Typography>
    </Paper>
  );
};

/** Selects Markdown or syntax-highlighted rendering for text output. */
const TextDisplay: React.FC<{ data: FormattedMCPData; theme: SyntaxTheme; width: string }> = ({
  data,
  theme,
  width,
}) => {
  const content = typeof data.content === 'string' ? data.content : '';
  const language = typeof data.language === 'string' ? data.language : 'text';
  const highlights = stringArray(data.highlights);
  // Check if the content should be rendered as markdown
  if (isMarkdownContent(data)) {
    return <MarkdownRenderer data={data} width={width} syntaxTheme={theme} />;
  }

  // Default to syntax highlighting for non-markdown content
  return (
    <Box
      sx={{
        width: `${width}`, // Use fixed pixel width
        maxWidth: 'none',
        minWidth: 0,
        overflowWrap: 'break-word',
        wordWrap: 'break-word',
      }}
    >
      {highlights.length > 0 && (
        <Box
          sx={{
            mb: 2,
            width: `${width}`,
            maxWidth: 'none',
            minWidth: 0,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          {highlights.map(highlight => (
            <Chip
              key={highlight}
              label={highlight}
              size="small"
              sx={{
                maxWidth: '100%',
                '& .MuiChip-label': {
                  overflowWrap: 'break-word',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                },
              }}
            />
          ))}
        </Box>
      )}
      <Box
        sx={{
          width: `${width}`, // Use fixed pixel width
          maxWidth: 'none',
          minWidth: 0,
        }}
      >
        <SyntaxHighlighter
          language={language}
          style={theme}
          customStyle={{
            fontSize: '14px',
            maxHeight: '400px',
            overflow: 'auto',
            width: `${width}`, // Use fixed pixel width
            maxWidth: 'none',
            minWidth: 0,
            margin: 0,
            padding: '12px',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            // Ensure no minimum width constraints
            minHeight: 'auto',
          }}
          wrapLongLines
        >
          {content}
        </SyntaxHighlighter>
      </Box>
    </Box>
  );
};

/** Renders a normalized tool error and an optional retry action. */
const ErrorDisplay: React.FC<{
  data: FormattedMCPData;
  onRetry?: () => void;
  width: string;
}> = ({ data, onRetry, width }) => {
  const { t } = useTranslation();
  const message =
    typeof data.message === 'string'
      ? data.message
      : typeof data.details === 'string'
      ? data.details
      : t('Tool Execution Error');

  return (
    <Box
      sx={{
        width: `${width}`, // Use fixed pixel width
        maxWidth: 'none',
        minWidth: 0,
        pr: 2, // Add right padding for better readability
        overflowWrap: 'break-word',
        wordWrap: 'break-word',
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          width: '100%',
          maxWidth: 'none',
          minWidth: 0,
          overflowWrap: 'break-word',
          wordWrap: 'break-word',
          wordBreak: 'break-word',
          bgcolor: 'error.50',
          borderColor: 'error.light',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontFamily: 'monospace',
            wordBreak: 'break-word',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            p: 1,
            borderRadius: 1,
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            whiteSpace: 'pre-wrap',
          }}
        >
          {message}
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mr: 2, mt: 2 }}>
        {onRetry && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={onRetry}
            startIcon={<Icon aria-hidden icon="mdi:refresh" />}
            sx={{ mr: 0.5 }}
          >
            {t('Retry Tool')}
          </Button>
        )}
      </Box>
    </Box>
  );
};

/** Renders arbitrary formatter data as circular-safe JSON. */
const RawDisplay: React.FC<{
  data: FormattedMCPData;
  theme: SyntaxTheme;
  width: string;
}> = ({ data, theme, width }) => {
  return (
    <Box
      sx={{
        width: width, // Use fixed pixel width
        maxWidth: 'none',
        minWidth: 0,
        pr: 2, // Add right padding for better readability
        overflowWrap: 'break-word',
        wordWrap: 'break-word',
      }}
    >
      <SyntaxHighlighter
        language="json"
        style={theme}
        customStyle={{
          fontSize: '12px',
          maxHeight: '400px',
          overflow: 'auto',
          width: '100%', // Use 100% of parent container (which has padding)
          maxWidth: 'none',
          minWidth: 0,
          margin: 0,
          padding: '12px',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          // Ensure no minimum width constraints
          minHeight: 'auto',
        }}
        wrapLongLines
      >
        {safeStringify(data, 2)}
      </SyntaxHighlighter>
    </Box>
  );
};

export default MCPOutputDisplay;

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
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { usePromptWidth } from '../../contexts/PromptWidthContext';
import { FormattedMCPOutput } from '../../langchain/formatters/MCPOutputFormatter';

interface MCPOutputDisplayProps {
  output: FormattedMCPOutput;
  onRetry?: () => void;
  onExport?: (format: 'json' | 'csv' | 'txt') => void;
  compact?: boolean;
}

function calculateWidth(width: string): string {
  if (!width) return '800px'; // fallback

  // Handle viewport width (vw) units
  if (width.includes('vw')) {
    const vwValue = parseFloat(width.replace('vw', ''));
    const pixelWidth = Math.floor(window.innerWidth * (vwValue / 100));
    const adjustedWidth = Math.max(300, pixelWidth - 30); // Subtract 40px, minimum 300px
    return `${adjustedWidth}px`;
  }

  // Handle pixel (px) units
  if (width.includes('px')) {
    const pixelValue = parseInt(width.replace('px', ''), 10);
    const adjustedWidth = Math.max(300, pixelValue - 30); // Subtract 40px, minimum 300px
    return `${adjustedWidth}px`;
  }

  // Handle numeric values (assume pixels)
  const numericValue = parseInt(width, 10);
  if (!isNaN(numericValue)) {
    const adjustedWidth = Math.max(300, numericValue - 30); // Subtract 40px, minimum 300px
    return `${adjustedWidth}px`;
  }

  // Fallback for any other format
  return '780px'; // 800px - 40px
}

// Function to detect if content is markdown
function isMarkdownContent(data: any): boolean {
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

// Markdown Renderer Component
const MarkdownRenderer: React.FC<{ data: any; width: string; syntaxTheme: any }> = ({
  data,
  width,
  syntaxTheme,
}) => {
  const theme = useTheme();
  const [showFullContent, setShowFullContent] = useState(false);

  // Check if content appears to be truncated
  const isTruncated =
    data.content &&
    (data.content.includes('[Content truncated for display') ||
      data.content.includes('[Output truncated...]') ||
      data.content.endsWith('...'));

  const displayContent = showFullContent ? data.fullContent || data.content : data.content;

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
      {data.highlights && data.highlights.length > 0 && (
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
          {data.highlights.map((highlight: string, index: number) => (
            <Chip
              key={index}
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
              startIcon={<Icon icon="mdi:unfold-more-horizontal" />}
            >
              Show Full Content
            </Button>
          }
        >
          <Typography variant="body2">
            Content has been truncated for display. Click "Show Full Content" to view the complete
            documentation.
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
            code({ inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';

              if (!inline && language) {
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
                    {...props}
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
            startIcon={<Icon icon="mdi:unfold-less-horizontal" />}
            variant="outlined"
          >
            Collapse to Summary
          </Button>
        </Box>
      )}
    </Box>
  );
};

const MCPOutputDisplay: React.FC<MCPOutputDisplayProps> = ({
  output,
  onRetry,
  onExport,
  compact = false,
}) => {
  const theme = useTheme();
  const { promptWidth } = usePromptWidth();
  const [expanded, setExpanded] = useState(!compact);
  const [showRawData, setShowRawData] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
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
        <CardHeader
          avatar={
            <Icon
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
                  title={`${output.metadata.dataPoints} data points • ${output.metadata.processingTime}ms`}
                >
                  <Chip
                    label={`${output.metadata.dataPoints} items`}
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
                <Tooltip title="Export data">
                  <IconButton
                    size="small"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    sx={{ mr: 2 }}
                  >
                    <Icon icon="mdi:download" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Show raw data">
                <IconButton
                  size="small"
                  onClick={() => setShowRawData(!showRawData)}
                  color={showRawData ? 'primary' : 'default'}
                  sx={{ mr: 2 }}
                >
                  <Icon icon="mdi:code-json" />
                </IconButton>
              </Tooltip>
              {compact && (
                <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                  <Icon icon={expanded ? 'mdi:chevron-up' : 'mdi:chevron-down'} />
                </IconButton>
              )}
            </Box>
          }
          sx={{ pb: 1 }}
        />

        <Collapse in={expanded}>
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
            {/* Warnings */}
            {output.warnings && output.warnings.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Warnings:
                </Typography>
                {output.warnings.map((warning, index) => (
                  <Typography key={index} variant="body2">
                    • {warning}
                  </Typography>
                ))}
              </Alert>
            )}

            {/* Main Content */}
            {renderContent()}

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
                    icon="mdi:lightbulb"
                    style={{
                      marginRight: 8,
                      color: theme.palette.primary.main,
                    }}
                  />
                  Key Insights:
                </Typography>
                {output.insights.map((insight, index) => (
                  <Typography
                    key={index}
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
                    icon="mdi:check-circle"
                    style={{
                      marginRight: 8,
                      color: theme.palette.success.main,
                    }}
                  />
                  Recommended Actions:
                </Typography>
                {output.actionable_items.map((item, index) => (
                  <Typography
                    key={index}
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

            {/* Raw Data Collapse */}
            <Collapse in={showRawData}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Raw Data:
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
                {JSON.stringify(output.data, null, 2)}
              </SyntaxHighlighter>
            </Collapse>

            {/* Metadata */}
            {output.metadata && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={`Tool: ${output.metadata.toolName}`} size="small" variant="outlined" />
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

// Table Display Component
const TableDisplay: React.FC<{ data: any; width: string }> = ({ data, width }) => {
  const theme = useTheme();
  const [sortBy, setSortBy] = useState(data.sortBy || null);
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
    if (!sortBy || !data.rows) return data.rows;

    const columnIndex = data.headers.indexOf(sortBy);
    if (columnIndex === -1) return data.rows;

    return [...data.rows].sort((a, b) => {
      const aVal = a[columnIndex];
      const bVal = b[columnIndex];

      const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data.rows, data.headers, sortBy, sortOrder]);

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
            {data.headers.map((header: string, index: number) => (
              <TableCell
                key={index}
                onClick={() => handleSort(header)}
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
          {sortedRows?.map((row: any[], rowIndex: number) => (
            <TableRow
              key={rowIndex}
              sx={{
                backgroundColor: data.highlightRows?.includes(rowIndex)
                  ? theme.palette.warning.light
                  : 'transparent',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              {row.map((cell: any, cellIndex: number) => (
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
                  title={typeof cell === 'object' ? JSON.stringify(cell) : String(cell)} // Show full content on hover
                >
                  {typeof cell === 'object' ? JSON.stringify(cell) : String(cell)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Metrics Display Component
const MetricsDisplay: React.FC<{ data: any; width: string }> = ({ data, width }) => {
  const theme = useTheme();

  const getStatusColor = (status: string) => {
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
      {data.primary && (
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
          {data.primary.map((metric: any, index: number) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
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
      {data.secondary && (
        <Grid
          container
          spacing={1}
          sx={{
            width: width, // Use fixed pixel width
            maxWidth: 'none',
            minWidth: 0,
          }}
        >
          {data.secondary.map((metric: any, index: number) => (
            <Grid item xs={6} sm={4} md={3} key={index}>
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
      {data.trends && (
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
            Trends:
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
            {data.trends.map((trend: any, index: number) => (
              <Grid item xs={12} sm={6} key={index}>
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

// List Display Component
const ListDisplay: React.FC<{ data: any; width: string }> = ({ data, width }) => {
  const theme = useTheme();

  const getStatusColor = (status: string) => {
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
      {data.items?.map((item: any, index: number) => (
        <Paper
          key={index}
          variant="outlined"
          sx={{
            p: 2,
            mb: 1,
            borderLeft: `4px solid`,
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

// Graph Display Component (placeholder for now)
const GraphDisplay: React.FC<{ data: any; width: string }> = ({ data, width }) => {
  return (
    <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', width: width, maxWidth: 'none' }}>
      <Icon icon="mdi:chart-bar" style={{ fontSize: 48, opacity: 0.5 }} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Graph Visualization
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {data.description || 'Chart visualization would appear here'}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Chart Type: {data.chartType} • {data.datasets?.length || 0} datasets
      </Typography>
    </Paper>
  );
};

// Text Display Component
const TextDisplay: React.FC<{ data: any; theme: any; width: string }> = ({
  data,
  theme,
  width,
}) => {
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
      {data.highlights && data.highlights.length > 0 && (
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
          {data.highlights.map((highlight: string, index: number) => (
            <Chip
              key={index}
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
          language={data.language || 'text'}
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
          {data.content}
        </SyntaxHighlighter>
      </Box>
    </Box>
  );
};

// Error Display Component
const ErrorDisplay: React.FC<{ data: any; onRetry?: () => void; width: string }> = ({
  data,
  onRetry,
  width,
}) => {
  // Extract concise error message for common error types
  const getDisplayMessage = (errorData: any) => {
    const message = errorData.message || 'Tool Execution Error';

    // Handle file not found errors specifically
    if (message.includes('ENOENT') || message.includes('no such file')) {
      return 'File Not Found Error';
    }

    // Handle schema mismatch errors
    if (message.includes('schema mismatch')) {
      return 'Tool Configuration Error';
    }

    return message;
  };

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
      <Alert
        severity="error"
        sx={{
          mb: 2,
          width: '100%', // Use 100% of parent container (which has padding)
          maxWidth: 'none',
          minWidth: 0,
          overflowWrap: 'break-word',
          wordWrap: 'break-word',
          wordBreak: 'break-word',
          '& .MuiAlert-icon': {
            fontSize: '2rem',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: 'error.main' }}>
              <Icon icon="mdi:alert-circle" style={{ marginRight: 8, fontSize: 24 }} />
              {getDisplayMessage(data)}
            </Typography>
            {data.details && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 2,
                  bgcolor: 'error.50',
                  borderColor: 'error.light',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Error Details:
                </Typography>
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
                  {data.details}
                </Typography>
              </Paper>
            )}
          </Box>
        </Box>
      </Alert>

      {data.suggestions && data.suggestions.length > 0 && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 2,
            borderColor: 'warning.light',
            bgcolor: 'warning.50',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'warning.dark' }}>
            <Icon icon="mdi:lightbulb" style={{ marginRight: 8 }} />
            Troubleshooting Suggestions:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {data.suggestions.map((suggestion: string, index: number) => (
              <Typography key={index} component="li" variant="body2" sx={{ mb: 0.5 }}>
                {suggestion}
              </Typography>
            ))}
          </Box>
        </Paper>
      )}

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mr: 2 }}>
        {onRetry && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={onRetry}
            startIcon={<Icon icon="mdi:refresh" />}
          >
            Retry Tool
          </Button>
        )}
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            // Copy error details to clipboard
            const errorText = `Tool Error: ${data.message}\nDetails: ${
              data.details || 'N/A'
            }\nSuggestions:\n${
              data.suggestions?.map((s: string) => `- ${s}`).join('\n') || 'None'
            }`;
            navigator.clipboard.writeText(errorText);
          }}
          startIcon={<Icon icon="mdi:content-copy" />}
          sx={{
            mr: 2,
          }}
        >
          Copy Error
        </Button>
      </Box>
    </Box>
  );
};

// Raw Display Component
const RawDisplay: React.FC<{ data: any; theme: any; width: string }> = ({ data, theme, width }) => {
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
        {JSON.stringify(data, null, 2)}
      </SyntaxHighlighter>
    </Box>
  );
};

export default MCPOutputDisplay;

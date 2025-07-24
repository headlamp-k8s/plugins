import { ResourceClasses } from '@kinvolk/headlamp-plugin/lib/k8s';
import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Button, Link as MuiLink, Typography } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link as RouterLink, useHistory } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import YamlDisplay from './components/YamlDisplay';
import { parseKubernetesYAML } from './utils/SampleYamlLibrary';
import { getHeadlampLink } from './utils/promptLinkHelper';

interface ContentRendererProps {
  content: string;
  onYamlDetected?: (yaml: string, resourceType: string) => void;
}

// Table wrapper component with show more functionality - moved outside to preserve state
const TableWrapper: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  const [showAll, setShowAll] = useState(false);
  const maxRows = 5;

  // Extract table rows from children
  const tableElement = React.Children.only(children) as React.ReactElement;
  const tbody = React.Children.toArray(tableElement.props.children).find(
    (child: any) => child?.type === 'tbody' || child?.props?.component === 'tbody'
  );

  if (!tbody) {
    // No tbody found, return table as is
    return <Box sx={{ overflowX: 'auto', width: '100%', mb: 2 }}>{children}</Box>;
  }

  const tbodyElement = tbody as React.ReactElement;
  const rows = React.Children.toArray(tbodyElement.props.children);
  const hasMoreRows = rows.length > maxRows;
  const visibleRows = showAll ? rows : rows.slice(0, maxRows);

  // Clone the tbody with limited rows
  const limitedTbody = React.cloneElement(tbodyElement, {
    children: visibleRows,
  });

  // Clone the table with the limited tbody
  const limitedTable = React.cloneElement(tableElement, {
    children: React.Children.map(tableElement.props.children, (child: any) => {
      if (child?.type === 'tbody' || child?.props?.component === 'tbody') {
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
            {showAll ? `Show Less (${maxRows} rows)` : `Show More (${rows.length} total rows)`}
          </Button>
        </Box>
      )}
    </Box>
  );
});

TableWrapper.displayName = 'TableWrapper';

// Memoized markdown components to prevent remounting
const markdownComponents = {
  // Override h1 rendering
  h1: React.memo(({ ...props }: any) => (
    <Typography variant="h4" gutterBottom sx={{ overflowWrap: 'break-word' }} {...props} />
  )),
  // Override h2 rendering
  h2: React.memo(({ ...props }: any) => (
    <Typography variant="h5" gutterBottom sx={{ overflowWrap: 'break-word' }} {...props} />
  )),
  // Override h3 rendering
  h3: React.memo(({ ...props }: any) => (
    <Typography variant="h6" gutterBottom sx={{ overflowWrap: 'break-word' }} {...props} />
  )),
  // Override paragraph rendering
  p: React.memo(({ ...props }: any) => (
    <Typography variant="body1" paragraph sx={{ overflowWrap: 'break-word' }} {...props} />
  )),
  // Style for tables
  table: React.memo(({ ...props }: any) => (
    <TableWrapper>
      <Box component="table" sx={{ minWidth: '400px', borderCollapse: 'collapse' }} {...props} />
    </TableWrapper>
  )),
  // Style for table headers
  th: React.memo(({ ...props }: any) => (
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
  td: React.memo(({ ...props }: any) => (
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
  ul: React.memo(({ ...props }: any) => (
    <Box component="ul" sx={{ pl: 2, mb: 2, overflowWrap: 'break-word' }} {...props} />
  )),
  ol: React.memo(({ ...props }: any) => (
    <Box component="ol" sx={{ pl: 2, mb: 2, overflowWrap: 'break-word' }} {...props} />
  )),
  li: React.memo(({ ...props }: any) => (
    <Box component="li" sx={{ mb: 1, overflowWrap: 'break-word' }} {...props} />
  )),
  // Style for blockquotes
  blockquote: React.memo(({ ...props }: any) => (
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
};

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

const ContentRenderer: React.FC<ContentRendererProps> = React.memo(
  ({ content, onYamlDetected }) => {
    const history = useHistory();
    useEffect(() => {
      console.log('ContentRenderer mounted with content:', content);

      return () => {
        console.log('ContentRenderer unmounted');
      };
    }, [content]);

    // Create code component that has access to onYamlDetected
    const CodeComponent = React.useMemo(() => {
      const component = React.memo(({ className, children, ...props }: any) => {
        // Check if this is a YAML code block
        const isYamlBlock =
          !props.inline &&
          (className === 'language-yaml' ||
            className === 'language-yml' ||
            (typeof children === 'string' &&
              children.includes('apiVersion:') &&
              children.includes('kind:')));

        if (isYamlBlock && onYamlDetected && typeof children === 'string') {
          // Try to parse as Kubernetes YAML
          const parsed = parseKubernetesYAML(children);
          if (parsed.isValid) {
            return (
              <YamlDisplay
                yaml={children}
                title={parsed.resourceType}
                onOpenInEditor={onYamlDetected}
              />
            );
          }
        }

        // Check if it's just one line of code
        if (typeof children === 'string' && !children.trim().includes('\n')) {
          // Display inline
          return (
            <em>{children}</em>
          );
        }

        // Regular code block styling
        return !props.inline ? (
          <Box
            component="pre"
            sx={{
              backgroundColor: theme => theme.palette.grey[100],
              color: theme => theme.palette.grey[900],
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
              backgroundColor: theme => theme.palette.grey[100],
              color: theme => theme.palette.grey[900],
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
      });
      component.displayName = 'MarkdownCode';
      return component;
    }, [onYamlDetected]);

    // Create link component that has access to history
    const LinkComponent = React.useMemo(() => {
      const component = React.memo(({ href, ...props }: any) => {
        // Check if it's a resource details link
        const headlampLinkDetails = getHeadlampLink(href);
        if (headlampLinkDetails.isHeadlampLink) {
          const { kubeObject } = headlampLinkDetails;
          if (kubeObject) {
            return (
              <Link kubeObject={kubeObject} />
            );
          }
          // In case it's a Headlamp processed link but no kube object
          if (headlampLinkDetails.url) {
            return (
              <MuiLink
                to={headlampLinkDetails.url}
                component={RouterLink}
                onClick={(e: any) => {
                  e.preventDefault();
                  history.push(headlampLinkDetails.url);
                }}
              >
                {props.children}
              </MuiLink>
            );
          }

          // The link is not supported in Headlamp so likely the LLM made it up
          return (
            <em>{props.children}</em>
          );
        }

        return (
          <MuiLink href={href} target="_blank" rel="noopener noreferrer" {...props}>
            {props.children}
          </MuiLink>
        );
      });
      component.displayName = 'MarkdownLink';
      return component;
    }, [history]);

    // Combine all components
    const allMarkdownComponents = React.useMemo(
      () => ({
        ...markdownComponents,
        code: CodeComponent,
        a: LinkComponent,
      }),
      [CodeComponent, LinkComponent]
    );
    // Process content and detect standalone YAML blocks
    const processedContent = useMemo(() => {
      if (!content) return null;

      // First, let's detect if this content has unformatted YAML (not in code blocks)
      // that needs special handling
      const hasUnformattedYaml =
        content.includes('apiVersion:') &&
        content.includes('kind:') &&
        content.includes('metadata:') &&
        !content.includes('```yaml') &&
        !content.includes('```yml');

      if (hasUnformattedYaml) {
        // Handle content with unformatted YAML
        return processUnformattedYaml(content);
      }

      // For regular markdown content, use ReactMarkdown
      return (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={allMarkdownComponents}>
          {content}
        </ReactMarkdown>
      );
    }, [content, onYamlDetected]);

    // Helper function to process content with unformatted YAML
    const processUnformattedYaml = (content: string) => {
      const sections: React.ReactNode[] = [];
      let sectionIndex = 0;

      // Split content by YAML document separators or detect YAML blocks
      const yamlSeparatorRegex = /^---+$/gm;
      const parts = content.split(yamlSeparatorRegex);

      parts.forEach((part, index) => {
        const trimmedPart = part.trim();
        if (!trimmedPart) return;

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
                title={parsed.resourceType}
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
                  backgroundColor: theme => theme.palette.grey[100],
                  color: theme => theme.palette.grey[900],
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
                p: markdownComponents.p,
                h1: markdownComponents.h1,
                h2: markdownComponents.h2,
                h3: markdownComponents.h3,
                ul: markdownComponents.ul,
                ol: markdownComponents.ol,
                li: markdownComponents.li,
                a: LinkComponent,
                code: CodeComponent,
              }}
            >
              {trimmedPart}
            </ReactMarkdown>
          );
        }
      });

      return <Box>{sections}</Box>;
    };

    return (
      <Box sx={{ width: '100%', overflowWrap: 'break-word', wordWrap: 'break-word' }}>
        {processedContent}
      </Box>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if content or onYamlDetected actually changed
    return (
      prevProps.content === nextProps.content &&
      prevProps.onYamlDetected === nextProps.onYamlDetected
    );
  }
);

ContentRenderer.displayName = 'ContentRenderer';

export default ContentRenderer;

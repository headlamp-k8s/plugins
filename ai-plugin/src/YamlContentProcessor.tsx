import { Box,Button } from '@mui/material';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { parseKubernetesYAML } from './utils/SampleYamlLibrary';

interface YamlContentProcessorProps {
  content: string;
  onYamlDetected: (yaml: string, resourceType: string, isDelete: boolean) => void;
  showDeleteOption?: boolean;
  replaceKubectlSuggestions?: boolean;
}

export default function YamlContentProcessor({
  content,
  onYamlDetected,
  showDeleteOption = true,
  replaceKubectlSuggestions = false,
}: YamlContentProcessorProps) {
  const [processedContent, setProcessedContent] = useState<string>(content);
  const [yamlBlocks, setYamlBlocks] = useState<
    Array<{
      yaml: string;
      index: number;
      resourceType: string;
      isValid: boolean;
      processed: boolean;
    }>
  >([]);

  useEffect(() => {
    // Process the content to find YAML blocks
    const extractedYamlBlocks = extractYamlBlocks(content);
    setYamlBlocks(extractedYamlBlocks);

    // Process the content to replace kubectl suggestions if enabled
    if (replaceKubectlSuggestions) {
      let updatedContent = content;

      // Look for kubectl commands and add a note about using the built-in editor
      const kubectlRegex =
        /(?:```(?:sh|bash|)\s*)?kubectl\s+(?:apply|create|delete)\s+-f\s+(?:<.*?>|\S+)(?:\s*```)?/g;
      updatedContent = updatedContent.replace(kubectlRegex, match => {
        const isDelete = match.includes('delete');
        return `${match}\n\n**Note:** Instead of using kubectl, you can use the Apply/View buttons below to manage resources directly through this interface.`;
      });

      setProcessedContent(updatedContent);
    } else {
      setProcessedContent(content);
    }
  }, [content, replaceKubectlSuggestions]);

  // Extract YAML blocks from the content
  const extractYamlBlocks = (content: string) => {
    const blocks = [];

    // Match YAML code blocks from markdown
    const yamlRegex = /```(?:yaml|yml)([\s\S]*?)```/g;
    let match;
    let index = 0;

    while ((match = yamlRegex.exec(content)) !== null) {
      const yamlContent = match[1].trim();

      try {
        const parsedResult = parseKubernetesYAML(yamlContent);

        if (parsedResult.isValid) {
          blocks.push({
            yaml: yamlContent,
            index: index++,
            resourceType: parsedResult.resourceType || 'Unknown',
            isValid: true,
            processed: false,
          });
        }
      } catch (error) {
        // Not valid YAML or not a Kubernetes resource
        console.debug('Invalid YAML block:', error);
      }
    }

    // If no YAML blocks found in code blocks, check for YAML with separators
    if (blocks.length === 0) {
      // Look for YAML content between separator lines (like ----)
      const separatorPattern = /[-]{3,}/g;
      const lines = content.split('\n');
      const separatorLines = [];

      // Find all separator line indexes
      lines.forEach((line, index) => {
        if (line.match(separatorPattern)) {
          separatorLines.push(index);
        }
      });

      // Process content between separator lines
      if (separatorLines.length >= 2) {
        for (let i = 0; i < separatorLines.length - 1; i++) {
          const startLine = separatorLines[i] + 1;
          const endLine = separatorLines[i + 1];

          const yamlContent = lines.slice(startLine, endLine).join('\n').trim();
          if (yamlContent) {
            try {
              const parsedResult = parseKubernetesYAML(yamlContent);

              if (parsedResult.isValid) {
                blocks.push({
                  yaml: yamlContent,
                  index: index++,
                  resourceType: parsedResult.resourceType || 'Unknown',
                  isValid: true,
                  processed: false,
                });
              }
            } catch (error) {
              // Not valid YAML
              console.debug('Invalid YAML between separators:', error);
            }
          }
        }
      }
    }

    return blocks;
  };

  // Renders components for all detected YAML blocks
  const renderYamlActions = () => {
    return yamlBlocks.map(block => (
      <Box
        key={`yaml-${block.index}`}
        sx={{
          mt: 1,
          mb: 2,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1,
          borderTop: '1px dashed',
          borderColor: 'divider',
          pt: 1,
        }}
      >
        <Button
          variant="outlined"
          size="small"
          color="primary"
          onClick={() => onYamlDetected(block.yaml, block.resourceType, false)}
        >
          {block.resourceType === 'Unknown' ? 'View YAML' : `Apply ${block.resourceType}`}
        </Button>

        {showDeleteOption && (
          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={() => onYamlDetected(block.yaml, block.resourceType, true)}
          >
            Delete {block.resourceType}
          </Button>
        )}
      </Box>
    ));
  };

  // Custom renderer for code blocks that highlights YAML and adds action buttons
  const customRenderers = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';

      const isYamlBlock = language === 'yaml' || language === 'yml';
      const codeContent = String(children).replace(/\n$/, '');

      // Check if this is a YAML block that we've identified
      if (isYamlBlock) {
        try {
          const parsedResult = parseKubernetesYAML(codeContent);

          if (parsedResult.isValid) {
            // This is an identifiable Kubernetes YAML block
            // Don't add buttons here - they'll be added after the block
            return (
              <Box sx={{ position: 'relative' }}>
                <SyntaxHighlighter
                  style={tomorrow}
                  language="yaml"
                  customStyle={{ fontSize: '0.8rem' }}
                >
                  {codeContent}
                </SyntaxHighlighter>
              </Box>
            );
          }
        } catch (error) {
          // Not a valid Kubernetes YAML - render as normal
        }
      }

      // Default code block rendering
      return !inline ? (
        <SyntaxHighlighter
          style={tomorrow}
          language={language || 'text'}
          customStyle={{ fontSize: '0.8rem' }}
          {...props}
        >
          {codeContent}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <>
      <ReactMarkdown components={customRenderers}>{processedContent}</ReactMarkdown>
      {renderYamlActions()}
    </>
  );
}

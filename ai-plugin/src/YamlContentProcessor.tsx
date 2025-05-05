import React, { useEffect, useState } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import YamlDisplay from './components/YamlDisplay';
import { parseKubernetesYAML } from './utils/SampleYamlLibrary';

interface YamlContentProcessorProps {
  content: string;
  onYamlDetected: (yaml: string, resourceType: string) => void;
}

const YamlContentProcessor: React.FC<YamlContentProcessorProps> = ({ content, onYamlDetected }) => {
  const [processedContent, setProcessedContent] = useState<React.ReactNode[]>([]);
  const theme = useTheme();

  // Helper function to convert text to paragraphs
  const textToParagraphs = (text: string): React.ReactNode[] => {
    return text.split('\n\n').map((paragraph, idx) => {
      if (paragraph.trim().length === 0) return null;
      
      // Handle bullet points
      if (paragraph.trim().match(/^[-*•]\s/m)) {
        const listItems = paragraph
          .split('\n')
          .filter(line => line.trim().length > 0)
          .map((line, i) => (
            <Box component="li" key={i} sx={{ mt: 0.5 }}>
              {line.replace(/^[-*•]\s/, '')}
            </Box>
          ));
        
        return (
          <Box component="ul" key={idx} sx={{ pl: 2, mb: 1 }}>
            {listItems}
          </Box>
        );
      }
      
      return (
        <Typography key={idx} variant="body2" paragraph>
          {paragraph.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < paragraph.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </Typography>
      );
    });
  };

  useEffect(() => {
    // Process content to separate YAML blocks from markdown
    const sections: React.ReactNode[] = [];
    let currentText = '';
    let inYamlBlock = false;
    let currentYaml = '';
    let yamlSectionTitle = '';
    
    // Split the content into lines
    const lines = content.split('\n');
    
    const yamlContentMarkers = [
      /apiVersion:/i,
      /kind:/i,
      /metadata:/i,
      /spec:/i
    ];
    
    const isYamlContentLine = (line: string) => {
      return yamlContentMarkers.some(marker => marker.test(line.trim()));
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for section titles that might indicate YAML examples
      if (!inYamlBlock && /^\d+\.\s+([A-Za-z]+)\s*$/.test(line.trim())) {
        const match = line.match(/^\d+\.\s+([A-Za-z]+)\s*$/);
        if (match) yamlSectionTitle = match[1];
        
        // Add accumulated text
        if (currentText.trim()) {
          sections.push(...textToParagraphs(currentText));
          currentText = '';
        }
        
        // Add the section title
        sections.push(
          <Typography key={`title-${sections.length}`} variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            {line}
          </Typography>
        );
        continue;
      }
      
      // Check for YAML block start
      if (!inYamlBlock) {
        // Check if this line starts a YAML block
        if (line.trim().startsWith('```yaml') || line.trim().startsWith('```yml')) {
          // Start collecting YAML
          inYamlBlock = true;
          currentYaml = '';
          
          // Add accumulated text before the YAML block
          if (currentText.trim()) {
            sections.push(...textToParagraphs(currentText));
            currentText = '';
          }
          continue;
        }
        
        // Check if this is a YAML separator line
        if (line.trim().match(/^-{3,}$/)) {
          // Look ahead to see if next few lines contain YAML content markers
          const nextLines = lines.slice(i + 1, i + 6).join('\n');
          if (yamlContentMarkers.some(marker => marker.test(nextLines))) {
            // This is likely a YAML separator - start collecting YAML
            inYamlBlock = true;
            currentYaml = '';
            
            // Add accumulated text before the YAML block
            if (currentText.trim()) {
              sections.push(...textToParagraphs(currentText));
              currentText = '';
            }
            continue;
          }
        }
        
        // Check if line directly starts with YAML content without markers
        if (isYamlContentLine(line)) {
          // Verify the next few lines also have YAML patterns
          const nextLines = lines.slice(i + 1, i + 5).join('\n');
          const yamlMarkers = yamlContentMarkers.filter(marker => marker.test(nextLines)).length;
          
          if (yamlMarkers >= 2) { // At least 2 more YAML markers in next few lines
            inYamlBlock = true;
            currentYaml = line + '\n'; // Include this line in the YAML
            
            // Add accumulated text before the YAML block
            if (currentText.trim()) {
              sections.push(...textToParagraphs(currentText));
              currentText = '';
            }
            continue;
          }
        }
        
        // Otherwise, add to current text
        currentText += line + '\n';
      } else {
        // Check if this line ends a YAML block
        if (line.trim() === '```') {
          inYamlBlock = false;
          
          // Process the collected YAML
          try {
            const parsedYaml = parseKubernetesYAML(currentYaml);
            if (parsedYaml.isValid) {
              sections.push(
                <YamlDisplay
                  key={`yaml-${sections.length}`}
                  yaml={currentYaml}
                  title={yamlSectionTitle || parsedYaml.resourceType}
                  onOpenInEditor={onYamlDetected}
                />
              );
            } else {
              // Not valid YAML, just display as code
              sections.push(
                <Box component="pre" key={`code-${sections.length}`} sx={{ 
                  bgcolor: 'background.paper',
                  p: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.85rem'
                }}>
                  {currentYaml}
                </Box>
              );
            }
          } catch (e) {
            // Error parsing YAML, display as code
            sections.push(
              <Box component="pre" key={`code-${sections.length}`} sx={{ 
                bgcolor: 'background.paper',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                fontSize: '0.85rem'
              }}>
                {currentYaml}
              </Box>
            );
          }
          currentYaml = '';
          yamlSectionTitle = '';
          continue;
        }
        
        // Check for YAML section end with separator
        if (line.trim().match(/^-{3,}$/)) {
          // Only end the block if we've accumulated some YAML content
          if (currentYaml.trim().length > 0) {
            inYamlBlock = false;
            
            // Process the collected YAML
            try {
              const parsedYaml = parseKubernetesYAML(currentYaml);
              if (parsedYaml.isValid) {
                sections.push(
                  <YamlDisplay
                    key={`yaml-${sections.length}`}
                    yaml={currentYaml}
                    title={yamlSectionTitle || parsedYaml.resourceType}
                    onOpenInEditor={onYamlDetected}
                  />
                );
              } else {
                // Not valid YAML, just display as pre-formatted text
                sections.push(
                  <Box component="pre" key={`code-${sections.length}`} sx={{ 
                    bgcolor: 'background.paper',
                    p: 2,
                    borderRadius: 1,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.85rem'
                  }}>
                    {currentYaml}
                  </Box>
                );
              }
            } catch (e) {
              // Error parsing YAML, display as pre-formatted text
              sections.push(
                <Box component="pre" key={`code-${sections.length}`} sx={{ 
                  bgcolor: 'background.paper',
                  p: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.85rem'
                }}>
                  {currentYaml}
                </Box>
              );
            }
            currentYaml = '';
            yamlSectionTitle = '';
            continue;
          } else {
            // This is probably a separator for the next YAML block
            // Continue accumulating YAML
            currentYaml += line + '\n';
          }
        } else {
          // Add to the current YAML block
          currentYaml += line + '\n';
        }
      }
    }
    
    // Handle any remaining content
    if (inYamlBlock && currentYaml.trim()) {
      try {
        const parsedYaml = parseKubernetesYAML(currentYaml);
        if (parsedYaml.isValid) {
          sections.push(
            <YamlDisplay
              key={`yaml-${sections.length}`}
              yaml={currentYaml}
              title={yamlSectionTitle || parsedYaml.resourceType}
              onOpenInEditor={onYamlDetected}
            />
          );
        } else {
          // Not valid YAML, just display as pre-formatted text
          sections.push(
            <Box component="pre" key={`code-${sections.length}`} sx={{ 
              bgcolor: 'background.paper',
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              fontSize: '0.85rem'
            }}>
              {currentYaml}
            </Box>
          );
        }
      } catch (e) {
        // Error parsing YAML, display as pre-formatted text
        sections.push(
          <Box component="pre" key={`code-${sections.length}`} sx={{ 
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            fontSize: '0.85rem'
          }}>
            {currentYaml}
          </Box>
        );
      }
    } else if (currentText.trim()) {
      sections.push(...textToParagraphs(currentText));
    }
    
    setProcessedContent(sections);
  }, [content, onYamlDetected]);

  return (
    <Box>
      {processedContent}
    </Box>
  );
};

export default YamlContentProcessor;

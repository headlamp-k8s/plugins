import { Icon } from '@iconify/react';
import { Box, Button, Typography } from '@mui/material';
import React from 'react';

interface YamlSummaryButtonsProps {
  yamls: {
    yaml: string;
    resourceType: string;
    title?: string;
  }[];
  onYamlSelect: (yaml: string, title: string, resourceType: string) => void;
}

const YamlSummaryButtons: React.FC<YamlSummaryButtonsProps> = ({ yamls, onYamlSelect }) => {
  if (!yamls || yamls.length === 0) return null;

  return (
    <Box mt={2} mb={2} p={2} border={1} borderRadius={1} borderColor="divider" bgcolor="#f9f9f9">
      <Typography variant="subtitle1" gutterBottom fontWeight="medium">
        <Icon icon="mdi:kubernetes" style={{ verticalAlign: 'middle', marginRight: '8px' }} />
        Kubernetes YAML Resources
      </Typography>

      <Typography variant="body2" color="text.secondary" gutterBottom mb={2}>
        The following resources are available for viewing/editing:
      </Typography>

      <Box display="flex" flexWrap="wrap" gap={1}>
        {yamls.map((yaml, index) => (
          <Button
            key={index}
            variant="outlined"
            size="small"
            startIcon={<Icon icon="mdi:file-code-outline" />}
            onClick={() =>
              onYamlSelect(
                yaml.yaml,
                yaml.title || `Sample ${yaml.resourceType}`,
                yaml.resourceType
              )
            }
            sx={{
              mb: 1,
              borderColor: 'primary.light',
              '&:hover': {
                bgcolor: 'primary.50',
              },
            }}
          >
            {yaml.title || yaml.resourceType}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default YamlSummaryButtons;

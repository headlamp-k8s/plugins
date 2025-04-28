import { Icon } from '@iconify/react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { YamlExample, yamlExamples } from '../utils/SampleYamlLibrary';
import YamlPreview from './YamlPreview';

interface YamlLibraryDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectYaml: (yaml: string, title: string, resourceType: string) => void;
}

export default function YamlLibraryDialog({ open, onClose, onSelectYaml }: YamlLibraryDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedExample, setSelectedExample] = useState<YamlExample | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const filteredExamples = yamlExamples.filter(
    example =>
      example.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      example.resourceType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectExample = (example: YamlExample) => {
    setSelectedExample(example);
  };

  const handleConfirm = () => {
    if (selectedExample) {
      onSelectYaml(selectedExample.yaml, selectedExample.title, selectedExample.resourceType);
    }
    onClose();
  };

  const getResourceTypeIcon = (resourceType: string) => {
    switch (resourceType.toLowerCase()) {
      case 'pod':
        return 'mdi:hexagon-multiple-outline';
      case 'deployment':
        return 'mdi:rocket-launch-outline';
      case 'service':
        return 'mdi:vector-link';
      case 'ingress':
        return 'mdi:arrow-decision-outline';
      case 'configmap':
        return 'mdi:file-cog-outline';
      case 'secret':
        return 'mdi:key-outline';
      case 'namespace':
        return 'mdi:folder-outline';
      case 'job':
        return 'mdi:clock-time-five-outline';
      case 'cronjob':
        return 'mdi:calendar-clock';
      case 'persistentvolumeclaim':
        return 'mdi:database-outline';
      default:
        return 'mdi:kubernetes';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="yaml-library-dialog-title"
    >
      <DialogTitle id="yaml-library-dialog-title">Kubernetes YAML Examples</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Search resources"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Icon icon="mdi:magnify" style={{ marginRight: 8 }} />,
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', height: '400px' }}>
          <Box sx={{ width: '40%', borderRight: 1, borderColor: 'divider', overflowY: 'auto' }}>
            <List dense>
              {filteredExamples.map((example, index) => (
                <ListItem
                  button
                  key={index}
                  selected={selectedExample?.filename === example.filename}
                  onClick={() => handleSelectExample(example)}
                >
                  <ListItemIcon>
                    <Icon icon={getResourceTypeIcon(example.resourceType)} fontSize={24} />
                  </ListItemIcon>
                  <ListItemText primary={example.title} secondary={example.resourceType} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box sx={{ width: '60%', p: 2, overflowY: 'auto' }}>
            {selectedExample ? (
              <>
                <Typography variant="h6" gutterBottom>
                  {selectedExample.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  File: {selectedExample.filename} | Type: {selectedExample.resourceType}
                </Typography>

                <YamlPreview content={selectedExample.yaml} height="300px" />
              </>
            ) : (
              <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                <Typography color="text.secondary">Select a YAML example from the list</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          disabled={!selectedExample}
          variant="contained"
          startIcon={<Icon icon="mdi:file-document-edit" />}
        >
          Edit/Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}

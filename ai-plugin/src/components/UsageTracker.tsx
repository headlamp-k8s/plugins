import { Icon } from '@iconify/react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface UsageData {
  provider: string;
  requestCount: number;
  tokensUsed: number;
  lastUsed: string;
}

interface UsageTrackerProps {
  pluginSettings: any;
}

const UsageTracker: React.FC<UsageTrackerProps> = ({ pluginSettings }) => {
  const [open, setOpen] = useState(false);
  const [usageData, setUsageData] = useState<UsageData[]>([]);

  // Load usage data from localStorage
  useEffect(() => {
    const loadUsageData = () => {
      try {
        const savedData = localStorage.getItem('headlamp-ai-usage-data');
        if (savedData) {
          setUsageData(JSON.parse(savedData));
        }
      } catch (error) {
        console.error('Error loading usage data:', error);
      }
    };

    loadUsageData();
    // Load data when dialog opens
    if (open) {
      loadUsageData();
    }
  }, [open]);

  // Helper function to get provider display name
  const getProviderDisplayName = (providerId: string): string => {
    const providerMap: { [key: string]: string } = {
      openai: 'OpenAI',
      azure: 'Azure OpenAI', // Consistency fix for Azure OpenAI
      anthropic: 'Anthropic',
      local: 'Local Model',
    };

    return providerMap[providerId] || providerId;
  };

  // Get current provider
  const currentProvider =
    pluginSettings?.provider || (pluginSettings?.API_TYPE === 'azure' ? 'azure' : 'openai');

  // Track a new request - exposed for other components to use
  const trackRequest = (tokens?: number) => {
    const now = new Date();
    const provider = currentProvider;
    const providerName = getProviderDisplayName(provider);

    const newUsageData = [...usageData];
    const existingProviderIndex = newUsageData.findIndex(item => item.provider === providerName);

    if (existingProviderIndex >= 0) {
      newUsageData[existingProviderIndex] = {
        ...newUsageData[existingProviderIndex],
        requestCount: newUsageData[existingProviderIndex].requestCount + 1,
        tokensUsed: (newUsageData[existingProviderIndex].tokensUsed || 0) + (tokens || 0),
        lastUsed: now.toISOString(),
      };
    } else {
      newUsageData.push({
        provider: providerName,
        requestCount: 1,
        tokensUsed: tokens || 0,
        lastUsed: now.toISOString(),
      });
    }

    localStorage.setItem('headlamp-ai-usage-data', JSON.stringify(newUsageData));
    setUsageData(newUsageData);
  };

  // Reset usage data
  const handleReset = () => {
    localStorage.removeItem('headlamp-ai-usage-data');
    setUsageData([]);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <>
      <Tooltip title="View AI Usage Statistics">
        <IconButton
          color="inherit"
          onClick={() => setOpen(true)}
          size="small"
          aria-label="View usage statistics"
        >
          <Icon icon="mdi:chart-bar" width="20px" />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>AI Assistant Usage Statistics</DialogTitle>
        <DialogContent>
          {usageData.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Provider</TableCell>
                    <TableCell align="right">Requests</TableCell>
                    <TableCell align="right">Tokens Used (Est.)</TableCell>
                    <TableCell>Last Used</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usageData.map(row => (
                    <TableRow key={row.provider}>
                      <TableCell component="th" scope="row">
                        {row.provider}
                      </TableCell>
                      <TableCell align="right">{row.requestCount}</TableCell>
                      <TableCell align="right">{row.tokensUsed || '0'}</TableCell>
                      <TableCell>{formatDate(row.lastUsed)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body1">No usage data available yet.</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Statistics will appear here after you use the AI Assistant.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReset} color="error">
            Reset Data
          </Button>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Export the component and the tracking function for use in other components
export default UsageTracker;

// Helper function to track usage from anywhere in the application
export const trackAIUsage = (provider: string, tokens: number = 0) => {
  try {
    const now = new Date();
    const savedData = localStorage.getItem('headlamp-ai-usage-data');
    const usageData: UsageData[] = savedData ? JSON.parse(savedData) : [];

    // Normalize Azure provider name
    if (provider.toLowerCase().includes('azure')) {
      provider = 'Azure OpenAI';
    }

    const existingProviderIndex = usageData.findIndex(item => item.provider === provider);

    if (existingProviderIndex >= 0) {
      usageData[existingProviderIndex] = {
        ...usageData[existingProviderIndex],
        requestCount: usageData[existingProviderIndex].requestCount + 1,
        tokensUsed: (usageData[existingProviderIndex].tokensUsed || 0) + tokens,
        lastUsed: now.toISOString(),
      };
    } else {
      usageData.push({
        provider: provider,
        requestCount: 1,
        tokensUsed: tokens,
        lastUsed: now.toISOString(),
      });
    }

    localStorage.setItem('headlamp-ai-usage-data', JSON.stringify(usageData));
    console.log(`Tracked usage for ${provider}: ${tokens} tokens`);
  } catch (error) {
    console.error('Error tracking AI usage:', error);
  }
};

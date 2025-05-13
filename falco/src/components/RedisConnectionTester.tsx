import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import React, { useState } from 'react';

// Constants
const FALCO_NAMESPACE = 'falco';

/**
 * Props for the RedisConnectionTester component.
 */
interface RedisConnectionTesterProps {
  redisUrl: string;
}

/**
 * Component for testing Redis connection.
 */
const RedisConnectionTester: React.FC<RedisConnectionTesterProps> = ({ redisUrl }) => {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // Test Redis connection using the appropriate method based on URL
  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('');
    try {
      let text: string;
      if (redisUrl) {
        // For custom URLs, use fetch
        const resp = await window.fetch(redisUrl.replace(/\/+$/, '') + '/ping');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        text = await resp.text();
      } else {
        // For in-cluster API proxy, use request with special handling for text response
        try {
          // First try with JSON parsing (the default for request)
          const result = await request(
            `/api/v1/namespaces/${FALCO_NAMESPACE}/services/redis-rest-proxy:8080/proxy/ping`,
            {
              method: 'GET',
            }
          );
          text = typeof result === 'string' ? result : JSON.stringify(result);
        } catch (err: any) {
          // If the error is about invalid JSON, the response is likely plain text 'pong'
          if (err.message && err.message.includes('Unexpected token')) {
            // This is actually a successful response, Redis returns 'pong' as plain text
            text = 'pong';
          } else {
            // It's a different error, re-throw it
            throw err;
          }
        }
      }
      if (text.trim().toLowerCase() === 'pong') {
        setTestStatus('success');
        setTestMessage('Successfully connected to Redis!');
      } else {
        setTestStatus('error');
        setTestMessage('Unexpected response: ' + text);
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage('Failed to connect to Redis: ' + (err?.message || err));
    }
  };

  return (
    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleTestConnection}
        disabled={testStatus === 'testing'}
      >
        {testStatus === 'testing' ? 'Testing...' : 'Test Redis Connection'}
      </Button>
      {testStatus === 'success' && <Alert severity="success">{testMessage}</Alert>}
      {testStatus === 'error' && <Alert severity="error">{testMessage}</Alert>}
    </Box>
  );
};

export default RedisConnectionTester;

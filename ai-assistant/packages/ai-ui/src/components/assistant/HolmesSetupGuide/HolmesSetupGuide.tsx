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

import { Icon } from '@iconify/react';
import { Box, Button, Chip, Link, Paper, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

/** Default HolmesGPT installation documentation URL. */
export const DEFAULT_HOLMES_DOCS_URL =
  'https://holmesgpt.dev/latest/installation/kubernetes-installation/#installation';

/** Props for {@link HolmesSetupGuide}. */
export interface HolmesSetupGuideProps {
  /** Opens the plugin settings page (where the Holmes connection is configured). */
  onOpenSettings: () => void;
  /** Optional: re-checks whether Holmes has become reachable. */
  onRetry?: () => void;
  /** Whether a retry health check is currently running. */
  isRetrying?: boolean;
  /** Optional: dismisses the guide (e.g. to go back to AI Chat mode). */
  onDismiss?: () => void;
  /** Documentation URL for installing HolmesGPT. */
  docsUrl?: string;
  /** Namespace the plugin currently looks for the Holmes service in. */
  namespace?: string;
  /** Kubernetes Service name the plugin currently looks for. */
  serviceName?: string;
  /** Service port the plugin currently uses. */
  port?: number;
}

/**
 * Shown when the HolmesGPT agent is not reachable in the current cluster.
 *
 * Explains that HolmesGPT is cluster-scoped and must be installed and running
 * inside the Kubernetes cluster, links to the installation docs, and points the
 * user at Settings to configure the connection details (namespace, service, port).
 *
 * @param props - Setup guide callbacks and the connection details to display.
 * @returns The Holmes setup guidance panel.
 */
export function HolmesSetupGuide({
  onOpenSettings,
  onRetry,
  isRetrying = false,
  onDismiss,
  docsUrl = DEFAULT_HOLMES_DOCS_URL,
  namespace,
  serviceName,
  port,
}: HolmesSetupGuideProps): React.ReactElement {
  const { t } = useTranslation();
  const headingId = React.useId();
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const hasTarget = Boolean(namespace || serviceName || port);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Paper
        component="section"
        role="region"
        aria-labelledby={headingId}
        variant="outlined"
        sx={{ p: 3, maxWidth: 560, width: '100%', textAlign: 'center' }}
      >
        <Icon
          icon="mdi:robot-outline"
          width={40}
          height={40}
          aria-hidden="true"
          style={{ opacity: 0.8 }}
        />
        <Typography
          ref={headingRef}
          id={headingId}
          tabIndex={-1}
          variant="h6"
          component="h2"
          sx={{ mt: 1, mb: 1 }}
        >
          {t('Set up HolmesGPT in your cluster')}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {t(
            'HolmesGPT is a cluster-scoped agent that must be installed and running inside your Kubernetes cluster. The AI Assistant connects to it through the in-cluster Service via the Kubernetes API proxy — it cannot run locally.'
          )}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t(
            'After Holmes is deployed, set its namespace, service name, and port under the Holmes Agent section in Settings.'
          )}
        </Typography>

        {hasTarget && (
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {serviceName && (
              <Chip
                size="small"
                variant="outlined"
                label={t('Service: {{service}}', { service: serviceName })}
              />
            )}
            {namespace && (
              <Chip
                size="small"
                variant="outlined"
                label={t('Namespace: {{namespace}}', { namespace })}
              />
            )}
            {port ? (
              <Chip size="small" variant="outlined" label={t('Port: {{port}}', { port })} />
            ) : null}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            component={Link}
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<Icon icon="mdi:book-open-variant" aria-hidden="true" />}
          >
            {t('HolmesGPT install guide')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Icon icon="mdi:cog" aria-hidden="true" />}
            onClick={onOpenSettings}
          >
            {t('Configure in Settings')}
          </Button>
          {onRetry && (
            <Button
              variant="text"
              startIcon={<Icon icon="mdi:refresh" aria-hidden="true" />}
              onClick={onRetry}
              disabled={isRetrying}
              aria-busy={isRetrying}
            >
              {isRetrying ? t('Retrying…') : t('Retry')}
            </Button>
          )}
        </Box>

        {onDismiss && (
          <Box sx={{ mt: 1.5 }}>
            <Button variant="text" size="small" color="inherit" onClick={onDismiss}>
              {t('Back to AI Chat')}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default HolmesSetupGuide;

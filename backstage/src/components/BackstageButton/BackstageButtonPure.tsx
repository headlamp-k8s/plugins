import { Icon } from '@iconify/react';
import { IconButton, Tooltip } from '@mui/material';
import React from 'react';

/**
 * Props for the BackstageButtonPure component.
 * @interface BackstageButtonPureProps
 * @property {string} kubernetesId - The Kubernetes ID of the resource.
 * @property {string} namespace - The namespace of the Kubernetes resource.
 * @property {string} backstageUrl - The base URL of the Backstage instance.
 * @property {boolean} isInIframe - Indicates whether the component is rendered inside an iframe.
 * @property {function} [onIframeMessage] - Callback function to handle iframe messages. It takes a message of any type as an argument.
 */
export interface BackstageButtonPureProps {
  kubernetesId: string;
  namespace: string;
  backstageUrl: string;
  isInIframe: boolean;
  onIframeMessage?: (message: { action: string; redirectPath: string }) => void;
}

/**
 * BackstageButtonPure component
 *
 * This component renders a button that links to a Backstage page for a specific Kubernetes resource.
 * It handles different behaviors based on whether it's rendered inside an iframe or not.
 *
 * @component
 */
export function BackstageButtonPure({
  kubernetesId,
  namespace,
  backstageUrl,
  isInIframe,
  onIframeMessage = () => {},
}: BackstageButtonPureProps) {
  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();

    const redirectPath = `/catalog/${namespace}/component/${kubernetesId}`;
    if (isInIframe) {
      onIframeMessage({
        action: 'open-with-backstage',
        redirectPath,
      });
    } else {
      const redirectUrl = new URL(backstageUrl);
      redirectUrl.pathname = redirectUrl.pathname.replace(/\/$/, '') + redirectPath;
      window.open(redirectUrl.toString(), '_blank');
    }
  };

  // If we are not running in Backstage + the Backstage URL is not set up, then we
  // do not display the button at all.
  if (!isInIframe && !backstageUrl) {
    return null;
  }

  return (
    <Tooltip title="Backstage">
      <IconButton onClick={handleClick} aria-label="Backstage" aria-haspopup="true" size="large">
        <Icon icon="mdi:alpha-b-circle" />
      </IconButton>
    </Tooltip>
  );
}

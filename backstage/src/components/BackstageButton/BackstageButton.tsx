import { useCluster } from '@kinvolk/headlamp-plugin/lib/k8s';
import { useEffect, useState } from 'react';
import { getConfigStore } from '../../utils';
import { BackstageButtonPure, BackstageButtonPureProps } from './BackstageButtonPure';

/**
 * BackstageButton component
 *
 * This component renders a button that links to a Backstage page for a specific Kubernetes resource.
 * It handles different behaviors based on whether it's rendered inside an iframe or not.
 *
 * @component
 */

interface BackstageButtonProps {
  kubernetesId: string;
  namespace: string;
}

export function BackstageButton({ kubernetesId, namespace }: BackstageButtonProps) {
  const cluster = useCluster();
  const [backstageUrl, setBackstageUrl] = useState('');

  const configStore = getConfigStore();
  const useConfig = configStore.useConfig();
  const conf = useConfig();

  useEffect(() => {
    setBackstageUrl(conf?.[cluster]?.backstageUrl || '');
  }, [conf, cluster]);

  const isInIframe = window.self !== window.top;

  const handleIframeMessage = (message: { action: string; redirectPath: string }) => {
    window.parent.postMessage(message, '*');
  };

  const pureProps: BackstageButtonPureProps = {
    kubernetesId,
    namespace,
    backstageUrl,
    isInIframe,
    onIframeMessage: handleIframeMessage,
  };

  return <BackstageButtonPure {...pureProps} />;
}

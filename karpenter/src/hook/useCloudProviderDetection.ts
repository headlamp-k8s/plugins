import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { useEffect, useState } from 'react';

export function useCloudProviderDetection() {
  const [cloudProvider, setCloudProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function detectCloudProvider() {
      try {
        setLoading(true);

        const response = await ApiProxy.request(
          '/apis/apiextensions.k8s.io/v1/customresourcedefinitions'
        );
        const crds = response.items || [];

        // Filter for Karpenter-related CRDs
        const karpenterCRDs = crds.filter(
          crd => crd.metadata.name.includes('karpenter') || crd.metadata.name.includes('nodeclass')
        );

        // Check for various possible NodeClass CRD names and determine the deployment type
        let awsCRD = null;
        let deploymentType = null;

        // Priority order: EKS Automode first, then self-installed Karpenter
        const eksAutomodeCRD = crds.find(
          crd => crd.metadata.name === 'nodeclasses.eks.amazonaws.com'
        );
        const selfInstalledCRD = crds.find(
          crd => crd.metadata.name === 'ec2nodeclasses.karpenter.k8s.aws'
        );
        const genericKarpenterCRD = crds.find(
          crd => crd.metadata.name === 'nodeclasses.karpenter.sh'
        );

        if (eksAutomodeCRD) {
          awsCRD = eksAutomodeCRD;
          deploymentType = 'EKS_AUTOMODE';
        } else if (selfInstalledCRD) {
          awsCRD = selfInstalledCRD;
          deploymentType = 'SELF_INSTALLED';
        } else if (genericKarpenterCRD) {
          awsCRD = genericKarpenterCRD;
          deploymentType = 'GENERIC_KARPENTER';
        }

        // Fallback: check for any CRD with NodeClass or EC2NodeClass kinds
        if (!awsCRD) {
          awsCRD = crds.find(crd => {
            const kind = crd.spec?.names?.kind;
            const group = crd.spec?.group;
            return (
              (kind === 'NodeClass' || kind === 'EC2NodeClass') &&
              group &&
              (group.includes('karpenter') || group.includes('aws'))
            );
          });
          if (awsCRD) {
            deploymentType = 'UNKNOWN';
          }
        }

        const azureCRD = crds.find(
          crd => crd.metadata.name === 'aksnodeclasses.karpenter.azure.com'
        );

        if (awsCRD) {
          // For backward compatibility: return 'AWS' string for default self-installed case
          // Return object only for EKS Auto Mode to maintain compatibility
          if (deploymentType === 'SELF_INSTALLED') {
            setCloudProvider('AWS');
          } else {
            const result = { provider: 'AWS', deploymentType, crdName: awsCRD.metadata.name };
            setCloudProvider(result);
          }
        } else if (azureCRD) {
          setCloudProvider({
            provider: 'AZURE',
            deploymentType: 'SELF_INSTALLED',
            crdName: azureCRD.metadata.name,
          });
        } else {
          const availableNames = karpenterCRDs.map(crd => crd.metadata.name).join(', ');
          setError(
            `No supported NodeClass CRDs found. Available Karpenter CRDs: ${
              availableNames || 'none'
            }`
          );
        }
      } catch (err) {
        setError(`Failed to detect cloud provider: ${err.message || err.toString()}`);
      } finally {
        setLoading(false);
      }
    }

    detectCloudProvider();
  }, []);

  return { cloudProvider, loading, error };
}

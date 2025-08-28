import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { useState, useEffect } from 'react';

export function useCloudProviderDetection() {
  const [cloudProvider, setCloudProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function detectCloudProvider() {
      try {
        setLoading(true);
        
        const response = await ApiProxy.request('/apis/apiextensions.k8s.io/v1/customresourcedefinitions');
        const crds = response.items || [];
   
        const awsCRD = crds.find(crd => 
          crd.metadata.name === 'ec2nodeclasses.karpenter.k8s.aws'
        );
        
        const azureCRD = crds.find(crd => 
          crd.metadata.name === 'aksnodeclasses.karpenter.azure.com'
        );

        if (awsCRD) {
          setCloudProvider('AWS');
        } else if (azureCRD) {
          setCloudProvider('AZURE');
        } else {
          setError('No supported NodeClass CRDs found (AWS EC2NodeClass or Azure AKSNodeClass)');
        }
      } catch (err) {
        console.error('Error detecting cloud provider:', err);
        setError('Failed to detect cloud provider');
      } finally {
        setLoading(false);
      }
    }

    detectCloudProvider();
  }, []);

  return { cloudProvider, loading, error };
}
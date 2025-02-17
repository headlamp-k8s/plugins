import { useEffect, useState } from 'react';
import { isCertManagerInstalled } from '../isCertManagerInstalled';

export function useCertManagerInstalled() {
  const [isManagerInstalled, setIsManagerInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkCertManagerInstalled() {
      const isInstalled = await isCertManagerInstalled();
      setIsManagerInstalled(!!isInstalled);
    }
    checkCertManagerInstalled();
  }, []);

  return {
    isManagerInstalled,
    isCertManagerCheckLoading: isManagerInstalled === null,
  };
}

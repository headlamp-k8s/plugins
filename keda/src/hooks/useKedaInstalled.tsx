import { useEffect, useState } from 'react';
import { isKedaInstalled as checkKedaInstallation } from '../isKedaInstalled';

export function useKedaInstalled() {
  const [isKedaInstalled, setIsKedaInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkKedaInstalled() {
      const isInstalled = await checkKedaInstallation();
      setIsKedaInstalled(!!isInstalled);
    }
    checkKedaInstalled();
  }, []);

  return {
    isKedaInstalled,
    isKedaCheckLoading: isKedaInstalled === null,
  };
}

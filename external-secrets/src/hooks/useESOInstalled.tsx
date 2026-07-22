import { useEffect, useState } from 'react';
import { isESOInstalled as checkESOInstallation } from '../isESOInstalled';

export function useESOInstalled() {
  const [isESOInstalled, setIsESOInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkESOInstalled() {
      const isInstalled = await checkESOInstallation();
      setIsESOInstalled(!!isInstalled);
    }
    checkESOInstalled();
  }, []);

  return {
    isESOInstalled,
    isESOCheckLoading: isESOInstalled === null,
  };
}

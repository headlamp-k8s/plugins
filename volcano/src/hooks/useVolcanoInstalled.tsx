import { useEffect, useState } from 'react';
import { isVolcanoInstalled as checkVolcanoInstallation } from '../isVolcanoInstalled';

export function useVolcanoInstalled() {
  const [isVolcanoInstalled, setIsVolcanoInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkVolcanoInstalled() {
      const isInstalled = await checkVolcanoInstallation();
      setIsVolcanoInstalled(!!isInstalled);
    }
    checkVolcanoInstalled();
  }, []);

  return {
    isVolcanoInstalled,
    isVolcanoCheckLoading: isVolcanoInstalled === null,
  };
}

import { useEffect, useState } from 'react';
import {
  isVolcanoCoreInstalled as checkVolcanoCoreInstallation,
  isVolcanoFlowInstalled as checkVolcanoFlowInstallation,
} from '../volcanoInstallChecks';

export function useVolcanoCoreInstalled() {
  const [isVolcanoCoreInstalled, setIsVolcanoCoreInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkVolcanoCoreInstalled() {
      const isInstalled = await checkVolcanoCoreInstallation();
      setIsVolcanoCoreInstalled(!!isInstalled);
    }
    checkVolcanoCoreInstalled();
  }, []);

  return {
    isVolcanoCoreInstalled,
    isVolcanoCoreCheckLoading: isVolcanoCoreInstalled === null,
  };
}

export function useVolcanoFlowInstalled() {
  const [isVolcanoFlowInstalled, setIsVolcanoFlowInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkVolcanoFlowInstalled() {
      const isInstalled = await checkVolcanoFlowInstallation();
      setIsVolcanoFlowInstalled(!!isInstalled);
    }
    checkVolcanoFlowInstalled();
  }, []);

  return {
    isVolcanoFlowInstalled,
    isVolcanoFlowCheckLoading: isVolcanoFlowInstalled === null,
  };
}

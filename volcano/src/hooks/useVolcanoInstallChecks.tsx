import { useEffect, useState } from 'react';
import {
  isVolcanoCoreInstalled as checkVolcanoCoreInstallation,
  isVolcanoFlowInstalled as checkVolcanoFlowInstallation,
  isVolcanoNamespaceQueueInstalled as checkVolcanoNamespaceQueueInstallation,
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

export function useVolcanoNamespaceQueueInstalled() {
  const [isVolcanoNamespaceQueueInstalled, setIsVolcanoNamespaceQueueInstalled] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    async function checkVolcanoNamespaceQueueInstalled() {
      const isInstalled = await checkVolcanoNamespaceQueueInstallation();
      setIsVolcanoNamespaceQueueInstalled(!!isInstalled);
    }
    checkVolcanoNamespaceQueueInstalled();
  }, []);

  return {
    isVolcanoNamespaceQueueInstalled,
    isVolcanoNamespaceQueueCheckLoading: isVolcanoNamespaceQueueInstalled === null,
  };
}

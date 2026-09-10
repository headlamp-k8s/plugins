import type { DotnetMonitorProcess } from '../api/dotnetMonitor';

export function isLikelyMonitorProcess(process: DotnetMonitorProcess): boolean {
  const haystack = [process.name, process.commandLine, process.managedEntryPointAssemblyName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes('dotnet-monitor') || haystack.includes('dotnet monitor collect');
}

export function pickBestProcess(processes: DotnetMonitorProcess[], containerName: string): DotnetMonitorProcess | null {
  const candidates = processes.filter((process) => !isLikelyMonitorProcess(process));
  if (candidates.length === 0) {
    return null;
  }
  if (candidates.length === 1) {
    return candidates[0];
  }
  const exactName = candidates.find((process) => process.name?.toLowerCase() === containerName.toLowerCase());
  if (exactName) {
    return exactName;
  }
  const partialName = candidates.find((process) => {
    const haystack = [process.name, process.commandLine, process.managedEntryPointAssemblyName]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(containerName.toLowerCase()) || haystack.includes('dotnet');
  });
  return partialName ?? candidates[0];
}

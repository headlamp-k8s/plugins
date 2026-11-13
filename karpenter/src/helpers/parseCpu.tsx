import { parseQuantity } from './parseRam';

export function parseCpu(cpuStr: string): number {
  return parseQuantity(cpuStr);
}

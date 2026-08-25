import { parseQuantity } from './parseQuantity';

/**
 * Parses a memory quantity, such as `1.5Gi` or `512M`, into bytes.
 *
 * @param memory - The memory quantity. A resource list can also hold it as a plain integer.
 * @returns The number of bytes, or 0 when the quantity is not valid.
 */
export function parseRam(memory: string | number): number {
  return parseQuantity(memory);
}

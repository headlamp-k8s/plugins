export function isNullable(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export interface MutationExpressionSource {
  applyConfiguration?: { expression: string };
  jsonPatch?: { expression: string };
}

export function getMutationExpression(mutation: MutationExpressionSource): string {
  return mutation.applyConfiguration?.expression ?? mutation.jsonPatch?.expression ?? '-';
}

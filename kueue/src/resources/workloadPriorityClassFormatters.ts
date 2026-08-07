export function renderWorkloadPriorityClassValue(value?: number): string {
  if (value === 0) {
    return '0';
  }
  return value?.toString() || '-';
}

export function renderWorkloadPriorityClassDescription(description?: string): string {
  return description || '-';
}

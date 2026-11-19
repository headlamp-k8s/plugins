/**
 * Render the numeric value of a WorkloadPriorityClass.
 * Preserves 0 and negative integers as valid numeric priority values.
 */
export function renderPriorityValue(value?: number): string | number {
  if (value === undefined || value === null) {
    return '-';
  }

  return value;
}

/**
 * Render the human-readable description of a WorkloadPriorityClass.
 */
export function renderDescription(description?: string): string {
  if (!description || description.trim() === '') {
    return '-';
  }

  return description;
}

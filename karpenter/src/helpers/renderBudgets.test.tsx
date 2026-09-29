import { render } from '@testing-library/react';
import { renderDisruptionBudgets } from './renderBudgets';

/** The disruption budgets from the default NodePool in the Karpenter docs. */
const docsBudgets = [{ nodes: '10%' }, { schedule: '0 9 * * mon-fri', duration: '8h', nodes: '0' }];

function renderBudgets(budgets: any[]) {
  const duplicateKeyWarnings: string[] = [];
  const spy = vitest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    const message = args.map(String).join(' ');
    if (message.includes('same key')) {
      duplicateKeyWarnings.push(message);
    }
  });

  const { container } = render(<div>{renderDisruptionBudgets(budgets)}</div>);
  spy.mockRestore();

  return { container, duplicateKeyWarnings };
}

function chipLabels(container: HTMLElement) {
  return Array.from(container.querySelectorAll('.MuiChip-label')).map(chip => chip.textContent);
}

describe('renderDisruptionBudgets', () => {
  it('reports when no budgets are set', () => {
    expect(renderDisruptionBudgets([])).toBe('No budgets set');
    expect(renderDisruptionBudgets(undefined as unknown as any[])).toBe('No budgets set');
  });

  it('renders every field of every budget', () => {
    const { container } = renderBudgets(docsBudgets);

    expect(chipLabels(container)).toEqual([
      'nodes: 10%',
      'schedule: 0 9 * * mon-fri',
      'duration: 8h',
      'nodes: 0',
    ]);
  });

  it('does not emit duplicate React keys for multi-field budgets', () => {
    const { duplicateKeyWarnings } = renderBudgets(docsBudgets);

    expect(duplicateKeyWarnings).toEqual([]);
  });

  it('groups each budget separately so fields are not flattened together', () => {
    const { container } = renderBudgets(docsBudgets);

    // <div>(test wrapper) > <Box>(all budgets) > <Box>(one per budget) > <Chip>(one per field)
    const budgetRows = Array.from(container.firstElementChild!.firstElementChild!.children);

    expect(budgetRows).toHaveLength(docsBudgets.length);
    expect(budgetRows.map(row => chipLabels(row as HTMLElement))).toEqual([
      ['nodes: 10%'],
      ['schedule: 0 9 * * mon-fri', 'duration: 8h', 'nodes: 0'],
    ]);
  });
});

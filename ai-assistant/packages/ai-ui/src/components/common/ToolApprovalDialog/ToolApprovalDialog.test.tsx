import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import ToolApprovalDialog from './ToolApprovalDialog';
import {
  mcpToolCall,
  mixedToolApprovalArgs,
  regularToolCall,
  singleToolApprovalArgs,
} from './ToolApprovalDialog.stories';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options
        ? key.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options[name] ?? ''))
        : key,
  }),
}));

vi.mock('@iconify/react', () => ({
  Icon: ({ icon, ...props }: { icon: string; 'aria-hidden'?: boolean | 'true' | 'false' }) => (
    <span data-icon={icon} {...props} />
  ),
}));

afterEach(cleanup);

it('renders named tool controls, mixed sections, singular copy, and passes axe', async () => {
  const { rerender } = render(<ToolApprovalDialog {...mixedToolApprovalArgs} />);
  expect(screen.getByRole('dialog', { name: 'Tool Execution Approval Required' })).toBeTruthy();
  expect(
    screen.getByRole('checkbox', { name: 'Approve tool kubernetes_api_request' })
  ).toHaveProperty('checked', true);
  expect(
    screen.getByRole('checkbox', { name: 'Approve tool flux_get_helmreleases' })
  ).toHaveProperty('checked', true);
  expect(screen.getByRole('heading', { name: /Kubernetes Tools/ })).toBeTruthy();
  expect(screen.getAllByText('MCP Tools (Inspektor Gadget)').length).toBeGreaterThan(0);
  await expect(runAxe()).resolves.toEqual([]);

  rerender(<ToolApprovalDialog {...singleToolApprovalArgs} />);
  expect(screen.getByText(/wants to execute 1 tool/)).toBeTruthy();
});

it('selects, deselects, and approves exact ids with remember choice', () => {
  const onApprove = vi.fn();
  render(<ToolApprovalDialog {...mixedToolApprovalArgs} onApprove={onApprove} />);
  fireEvent.click(screen.getByRole('button', { name: 'Deselect All' }));
  expect(screen.getByRole('button', { name: 'Approve selected tools (0)' })).toHaveProperty(
    'disabled',
    true
  );
  fireEvent.click(screen.getByRole('button', { name: 'Select All' }));
  fireEvent.click(screen.getByRole('checkbox', { name: /Remember my choice/ }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Approve tool flux_get_helmreleases' }));
  fireEvent.click(screen.getByRole('button', { name: 'Approve selected tools (1)' }));
  expect(onApprove).toHaveBeenCalledWith(['call_1'], true);
});

it('expands tool arguments while filtering empty values and safely formatting objects', () => {
  render(<ToolApprovalDialog {...mixedToolApprovalArgs} />);
  fireEvent.click(screen.getByRole('button', { name: /kubernetes_api_request/ }));
  expect(screen.getByText('/api/v1/pods')).toBeTruthy();
  expect(screen.queryByText('empty')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /flux_get_helmreleases/ }));
  expect(screen.getByText(/"output": "json"/)).toBeTruthy();
});

it('supports generic regular-tool icons and cyclic argument objects', () => {
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  render(
    <ToolApprovalDialog
      {...singleToolApprovalArgs}
      toolCalls={[{ ...regularToolCall, name: 'custom_tool', arguments: { cyclic } }]}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /custom_tool/ }));
  expect(screen.getByText('[object Object]')).toBeTruthy();
});

it('resets selection and remember choice for a newly opened request', () => {
  const { rerender } = render(<ToolApprovalDialog {...mixedToolApprovalArgs} />);
  fireEvent.click(screen.getByRole('button', { name: 'Deselect All' }));
  fireEvent.click(screen.getByRole('checkbox', { name: /Remember my choice/ }));
  rerender(<ToolApprovalDialog {...mixedToolApprovalArgs} open={false} />);
  rerender(<ToolApprovalDialog {...mixedToolApprovalArgs} toolCalls={[mcpToolCall]} />);
  expect(
    screen.getByRole('checkbox', { name: 'Approve tool flux_get_helmreleases' })
  ).toHaveProperty('checked', true);
  expect(screen.getByRole('checkbox', { name: /Remember my choice/ })).toHaveProperty(
    'checked',
    false
  );
});

it('denies and closes while idle', () => {
  const onDeny = vi.fn();
  const onClose = vi.fn();
  render(<ToolApprovalDialog {...singleToolApprovalArgs} onDeny={onDeny} onClose={onClose} />);
  fireEvent.click(screen.getByRole('button', { name: 'Deny All' }));
  fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
  expect(onDeny).toHaveBeenCalledOnce();
  expect(onClose).toHaveBeenCalledOnce();
});

it('locks all dismissal and approval actions while loading', () => {
  const onClose = vi.fn();
  render(<ToolApprovalDialog {...singleToolApprovalArgs} loading onClose={onClose} />);
  expect(screen.queryByRole('button', { name: 'Close dialog' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Deny All' })).toHaveProperty('disabled', true);
  expect(screen.getByRole('button', { name: 'Executing...' })).toHaveProperty('disabled', true);
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(onClose).not.toHaveBeenCalled();
});

it('handles an empty request', () => {
  render(<ToolApprovalDialog {...mixedToolApprovalArgs} toolCalls={[]} />);
  expect(screen.getByText('0 of 0 tools selected')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Approve selected tools (0)' })).toHaveProperty(
    'disabled',
    true
  );
});

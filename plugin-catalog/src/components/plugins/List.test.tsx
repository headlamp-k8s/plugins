import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

// The full Headlamp CommonComponents barrel pulls in monaco, which cannot load in jsdom,
// so mock the heavy modules and keep the real ConfirmDialog to exercise its close behavior.
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ConfigStore: class {
    get() {
      return {};
    }
    update() {}
    useConfig() {
      return () => ({});
    }
  },
  PluginManager: { list: vi.fn() },
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', async () => {
  const { ConfirmDialog } = await vi.importActual<
    typeof import('@kinvolk/headlamp-plugin/lib/components/common/ConfirmDialog')
  >('@kinvolk/headlamp-plugin/lib/components/common/ConfirmDialog');
  return {
    ConfirmDialog,
    SectionHeader: ({
      title,
      titleSideActions = [],
      actions = [],
    }: {
      title: string;
      titleSideActions?: React.ReactNode[];
      actions?: React.ReactNode[];
    }) => (
      <div>
        <h1>{title}</h1>
        {titleSideActions}
        {actions}
      </div>
    ),
  };
});

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  Loader: () => <div>Loading</div>,
}));

vi.mock('./PluginCard', () => ({
  PluginCard: () => null,
}));

import { PurePluginList, PurePluginListProps } from './List';

function renderList(overrides: Partial<PurePluginListProps> = {}) {
  const props: PurePluginListProps = {
    plugins: [],
    totalPages: 0,
    page: 1,
    search: '',
    onSearchChange: vi.fn(),
    onPageChange: vi.fn(),
    isOfficialSwitchChecked: true,
    onOfficialSwitchChange: vi.fn(),
    isVerifiedSwitchChecked: true,
    onVerifiedSwitchChange: vi.fn(),
    ...overrides,
  };
  const utils = render(<PurePluginList {...props} />);
  return { ...utils, props };
}

function getVerifiedSwitch() {
  return screen.getByRole('checkbox', { name: 'Only Verified' }) as HTMLInputElement;
}

const confirmTitle = 'Do you want to show plugins from unverified publishers?';

describe('Only Verified switch', () => {
  it('reflects the checked state from props', () => {
    const { rerender, props } = renderList({ isVerifiedSwitchChecked: true });
    expect(getVerifiedSwitch().checked).toBe(true);

    rerender(<PurePluginList {...props} isVerifiedSwitchChecked={false} />);
    expect(getVerifiedSwitch().checked).toBe(false);
  });

  it('enables the filter immediately without confirmation', () => {
    const onVerifiedSwitchChange = vi.fn();
    renderList({ isVerifiedSwitchChecked: false, onVerifiedSwitchChange });

    fireEvent.click(getVerifiedSwitch());

    expect(onVerifiedSwitchChange).toHaveBeenCalledWith(true);
    expect(screen.queryByText(confirmTitle)).toBeNull();
  });

  it('keeps the filter enabled when the confirmation is cancelled', async () => {
    const onVerifiedSwitchChange = vi.fn();
    renderList({ isVerifiedSwitchChecked: true, onVerifiedSwitchChange });

    fireEvent.click(getVerifiedSwitch());
    expect(screen.getByText(confirmTitle)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'cancel-button' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    expect(onVerifiedSwitchChange).not.toHaveBeenCalled();
    expect(getVerifiedSwitch().checked).toBe(true);
  });

  it('disables the filter and closes the dialog when the confirmation is accepted', async () => {
    const onVerifiedSwitchChange = vi.fn();
    renderList({ isVerifiedSwitchChecked: true, onVerifiedSwitchChange });

    fireEvent.click(getVerifiedSwitch());
    fireEvent.click(screen.getByRole('button', { name: 'confirm-button' }));

    expect(onVerifiedSwitchChange).toHaveBeenCalledOnce();
    expect(onVerifiedSwitchChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

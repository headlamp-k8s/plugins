import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockRelease } from '../../__tests__/mockData';
import { renderWithProviders } from '../../__tests__/testUtils';
import { ReleaseActionsMenu } from './ReleaseActionsMenu';

describe('ReleaseActionsMenu', () => {
  const mockHandlers = {
    onUpgrade: vi.fn(),
    onRollback: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the actions menu button', () => {
    renderWithProviders(
      <ReleaseActionsMenu
        release={mockRelease}
        latestAppVersion="1.22.0"
        {...mockHandlers}
      />
    );

    const button = screen.getByRole('button', { name: /release actions/i });
    expect(button).toBeInTheDocument();
  });

  it('should open menu on button click', () => {
    renderWithProviders(
      <ReleaseActionsMenu
        release={mockRelease}
        latestAppVersion="1.22.0"
        {...mockHandlers}
      />
    );

    const button = screen.getByRole('button', { name: /release actions/i });
    fireEvent.click(button);

    expect(screen.getByText('Upgrade')).toBeInTheDocument();
    expect(screen.getByText('Rollback')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should enable upgrade when newer version is available', () => {
    renderWithProviders(
      <ReleaseActionsMenu
        release={mockRelease}
        latestAppVersion="1.22.0"
        {...mockHandlers}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /release actions/i }));
    
    const upgradeItem = screen.getByText('Upgrade').closest('li');
    expect(upgradeItem).not.toHaveClass('Mui-disabled');
  });

  it('should disable upgrade when no newer version is available', () => {
    renderWithProviders(
      <ReleaseActionsMenu
        release={mockRelease}
        latestAppVersion="1.21.0"
        {...mockHandlers}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /release actions/i }));
    
    const upgradeItem = screen.getByText('Upgrade').closest('li');
    expect(upgradeItem).toHaveClass('Mui-disabled');
  });

  it('should disable rollback for version 1', () => {
    const releaseV1 = { ...mockRelease, version: 1 };
    
    renderWithProviders(
      <ReleaseActionsMenu
        release={releaseV1}
        latestAppVersion="1.22.0"
        {...mockHandlers}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /release actions/i }));
    
    const rollbackItem = screen.getByText('Rollback').closest('li');
    expect(rollbackItem).toHaveClass('Mui-disabled');
  });

  it('should enable rollback for version > 1', () => {
    const releaseV3 = { ...mockRelease, version: 3 };
    
    renderWithProviders(
      <ReleaseActionsMenu
        release={releaseV3}
        latestAppVersion="1.22.0"
        {...mockHandlers}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /release actions/i }));
    
    const rollbackItem = screen.getByText('Rollback').closest('li');
    expect(rollbackItem).not.toHaveClass('Mui-disabled');
  });

  it('should call onUpgrade when upgrade is clicked', () => {
    renderWithProviders(
      <ReleaseActionsMenu
        release={mockRelease}
        latestAppVersion="1.22.0"
        {...mockHandlers}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /release actions/i }));
    fireEvent.click(screen.getByText('Upgrade'));

    expect(mockHandlers.onUpgrade).toHaveBeenCalledWith(mockRelease);
    expect(mockHandlers.onUpgrade).toHaveBeenCalledTimes(1);
  });

  it('should call onRollback when rollback is clicked', () => {
    const releaseV2 = { ...mockRelease, version: 2 };
    
    renderWithProviders(
      <ReleaseActionsMenu
        release={releaseV2}
        latestAppVersion="1.22.0"
        {...mockHandlers}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /release actions/i }));
    fireEvent.click(screen.getByText('Rollback'));

    expect(mockHandlers.onRollback).toHaveBeenCalledWith(releaseV2);
    expect(mockHandlers.onRollback).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete is clicked', () => {
    renderWithProviders(
      <ReleaseActionsMenu
        release={mockRelease}
        latestAppVersion="1.22.0"
        {...mockHandlers}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /release actions/i }));
    fireEvent.click(screen.getByText('Delete'));

    expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockRelease);
    expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1);
  });

  it('should close menu after action is clicked', () => {
    renderWithProviders(
      <ReleaseActionsMenu
        release={mockRelease}
        latestAppVersion="1.22.0"
        {...mockHandlers}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /release actions/i }));
    expect(screen.getByText('Delete')).toBeVisible();

    fireEvent.click(screen.getByText('Delete'));
    
    // Menu should close after action
    expect(screen.queryByText('Delete')).not.toBeVisible();
  });

  it('should handle missing latestAppVersion gracefully', () => {
    renderWithProviders(
      <ReleaseActionsMenu
        release={mockRelease}
        latestAppVersion={undefined}
        {...mockHandlers}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /release actions/i }));
    
    // Should allow upgrade when latest version is unknown
    const upgradeItem = screen.getByText('Upgrade').closest('li');
    expect(upgradeItem).not.toHaveClass('Mui-disabled');
  });

  it('should handle missing chart metadata', () => {
    const releaseWithoutMetadata = {
      ...mockRelease,
      chart: undefined,
    };
    
    renderWithProviders(
      <ReleaseActionsMenu
        release={releaseWithoutMetadata}
        latestAppVersion="1.22.0"
        {...mockHandlers}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /release actions/i }));
    
    // Should allow upgrade when current version is unknown
    const upgradeItem = screen.getByText('Upgrade').closest('li');
    expect(upgradeItem).not.toHaveClass('Mui-disabled');
  });

  it('should always enable delete action', () => {
    renderWithProviders(
      <ReleaseActionsMenu
        release={mockRelease}
        latestAppVersion="1.22.0"
        {...mockHandlers}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /release actions/i }));
    
    const deleteItem = screen.getByText('Delete').closest('li');
    expect(deleteItem).not.toHaveClass('Mui-disabled');
  });

  describe('Version comparison edge cases', () => {
    it('should enable upgrade for non-semver versions', () => {
      const releaseWithInvalidVersion = {
        ...mockRelease,
        chart: {
          metadata: {
            ...mockRelease.chart.metadata,
            appVersion: 'latest',
          },
        },
      };
      
      renderWithProviders(
        <ReleaseActionsMenu
          release={releaseWithInvalidVersion}
          latestAppVersion="invalid-version"
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /release actions/i }));
      
      const upgradeItem = screen.getByText('Upgrade').closest('li');
      expect(upgradeItem).not.toHaveClass('Mui-disabled');
    });

    it('should handle special latest version placeholder', () => {
      renderWithProviders(
        <ReleaseActionsMenu
          release={mockRelease}
          latestAppVersion="—"
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /release actions/i }));
      
      const upgradeItem = screen.getByText('Upgrade').closest('li');
      expect(upgradeItem).not.toHaveClass('Mui-disabled');
    });
  });
});

import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Toast } from './Toast';

const toast = { message: 'Topic created', type: 'success' as const };

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Toast', () => {
  it('does not call onClose when unmounted during the fade-out', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const { unmount } = render(<Toast toast={toast} onClose={onClose} />);

    // Start the fade-out, then go away before the 300ms animation ends, the way
    // a page navigation would.
    fireEvent.click(screen.getByLabelText('Close notification'));
    unmount();
    act(() => vi.advanceTimersByTime(300));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose once when the fade-out finishes while mounted', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Toast toast={toast} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('Close notification'));
    act(() => vi.advanceTimersByTime(300));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

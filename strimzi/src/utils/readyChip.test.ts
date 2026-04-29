import { readyChipProps } from './readyChip';

describe('readyChipProps', () => {
  it('renders Ready/success when status is True', () => {
    expect(readyChipProps('True')).toEqual({ label: 'Ready', color: 'success' });
  });

  it('renders Unknown/default when status is the literal string Unknown', () => {
    expect(readyChipProps('Unknown')).toEqual({ label: 'Unknown', color: 'default' });
  });

  it('renders Unknown/default when no condition has been reported', () => {
    expect(readyChipProps(undefined)).toEqual({ label: 'Unknown', color: 'default' });
    expect(readyChipProps(null)).toEqual({ label: 'Unknown', color: 'default' });
  });

  it('renders Not Ready/warning when status is False', () => {
    expect(readyChipProps('False')).toEqual({ label: 'Not Ready', color: 'warning' });
  });

  it('falls back to Not Ready for any unexpected non-True non-Unknown status', () => {
    expect(readyChipProps('Reconciling')).toEqual({ label: 'Not Ready', color: 'warning' });
  });
});

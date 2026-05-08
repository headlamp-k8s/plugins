import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import {
  ResultStatusChip,
  SeverityChip,
  SummaryChips,
  NotInstalledBanner,
} from './common';

describe('Common UI Components', () => {
  describe('ResultStatusChip', () => {
    test('renders with success color when status is pass', () => {
      render(<ResultStatusChip status="pass" />);
      const chip = screen.getByText('pass').closest('div');
      expect(chip).toHaveClass('MuiChip-colorSuccess');
    });

    test('renders with error color when status is fail', () => {
      render(<ResultStatusChip status="fail" />);
      const chip = screen.getByText('fail').closest('div');
      expect(chip).toHaveClass('MuiChip-colorError');
    });

    test('renders with error color when status is error', () => {
      render(<ResultStatusChip status="error" />);
      const chip = screen.getByText('error').closest('div');
      expect(chip).toHaveClass('MuiChip-colorError');
    });

    test('renders with warning color when status is warn', () => {
      render(<ResultStatusChip status="warn" />);
      const chip = screen.getByText('warn').closest('div');
      expect(chip).toHaveClass('MuiChip-colorWarning');
    });

    test('renders with default color when status is skip', () => {
      render(<ResultStatusChip status="skip" />);
      const chip = screen.getByText('skip').closest('div');
      expect(chip).toHaveClass('MuiChip-colorDefault');
    });
  });

  describe('SeverityChip', () => {
    test('renders with error color when severity is critical', () => {
      render(<SeverityChip severity="critical" />);
      const chip = screen.getByText('critical').closest('div');
      expect(chip).toHaveClass('MuiChip-colorError');
    });

    test('renders with error color when severity is high', () => {
      render(<SeverityChip severity="high" />);
      const chip = screen.getByText('high').closest('div');
      expect(chip).toHaveClass('MuiChip-colorError');
    });

    test('renders with warning color when severity is medium', () => {
      render(<SeverityChip severity="medium" />);
      const chip = screen.getByText('medium').closest('div');
      expect(chip).toHaveClass('MuiChip-colorWarning');
    });

    test('renders nothing when severity is undefined', () => {
      const { container } = render(<SeverityChip severity={undefined} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('SummaryChips', () => {
    test('renders only chips with count > 0', () => {
      const summary = { pass: 5, fail: 0, warn: 2, error: 0, skip: 0 };
      render(<SummaryChips summary={summary} />);

      expect(screen.getByText('Pass: 5')).toBeInTheDocument();
      expect(screen.getByText('Warn: 2')).toBeInTheDocument();

      expect(screen.queryByText(/Fail:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Skip:/)).not.toBeInTheDocument();
    });

    test('renders nothing when all counts are zero', () => {
      const summary = { pass: 0, fail: 0, warn: 0, error: 0, skip: 0 };
      const { container } = render(<SummaryChips summary={summary} />);
      // span is rendered but no chips inside it
      expect(container.querySelectorAll('.MuiChip-root')).toHaveLength(0);
    });

    test('renders all chips when all counts are non-zero', () => {
      const summary = { pass: 1, fail: 2, warn: 3, error: 4, skip: 5 };
      render(<SummaryChips summary={summary} />);

      expect(screen.getByText('Pass: 1')).toBeInTheDocument();
      expect(screen.getByText('Fail: 2')).toBeInTheDocument();
      expect(screen.getByText('Warn: 3')).toBeInTheDocument();
      expect(screen.getByText('Error: 4')).toBeInTheDocument();
      expect(screen.getByText('Skip: 5')).toBeInTheDocument();
    });
  });

  describe('NotInstalledBanner', () => {
    test('renders spinner and no message when loading is true', () => {
      render(<NotInstalledBanner loading={true} message="Kyverno missing" />);

      // Verify CircularProgress is present via its aria role (progressbar)
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Verify message is NOT present
      expect(screen.queryByText('Kyverno missing')).not.toBeInTheDocument();
    });

    test('renders message and link when loading is false', () => {
      render(<NotInstalledBanner loading={false} message="Kyverno missing" />);

      // Verify spinner is NOT present
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

      // Verify message and link are present
      expect(screen.getByText('Kyverno missing')).toBeInTheDocument();
      const link = screen.getByRole('link', { name: /installing Kyverno/i });
      expect(link).toHaveAttribute('href', 'https://kyverno.io/docs/installation/');
    });

    test('link opens in a new tab', () => {
      render(<NotInstalledBanner loading={false} message="Some error" />);
      const link = screen.getByRole('link', { name: /installing Kyverno/i });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});

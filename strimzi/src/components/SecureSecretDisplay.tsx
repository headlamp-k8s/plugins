import React from 'react';
import { useThemeColors } from '../utils/theme';

interface SecureSecretDisplayProps {
  /** The secret value to display (password, certificate, etc.) */
  secretValue: string;
  /** Type of secret being displayed */
  secretType: 'password' | 'certificate';
  /** Name of the user/resource this secret belongs to */
  resourceName: string;
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
}

/**
 * Secure component for displaying sensitive secrets with proper warnings.
 * This component ensures users are aware they're viewing sensitive data
 * and provides security best practices.
 */
export function SecureSecretDisplay({
  secretValue,
  secretType,
  resourceName,
  isOpen,
  onClose,
}: SecureSecretDisplayProps) {
  const colors = useThemeColors();
  const [hasConfirmed, setHasConfirmed] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);

  // Reset confirmation when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setHasConfirmed(false);
      setIsCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(secretValue).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleClose = () => {
    setHasConfirmed(false);
    setIsCopied(false);
    onClose();
  };

  // Confirmation step - show warning before revealing secret
  if (!hasConfirmed) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.overlay,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={handleClose}
      >
        <div
          style={{
            backgroundColor: colors.background,
            color: colors.text,
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '500px',
            border: `2px solid #ff9800`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Warning Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: '32px' }}>⚠️</span>
            <h2 style={{ margin: 0, color: '#ff9800' }}>Security Warning</h2>
          </div>

          {/* Warning Message */}
          <div style={{ marginBottom: '20px', lineHeight: '1.6' }}>
            <p style={{ margin: '0 0 12px 0' }}>
              You are about to view <strong>sensitive credentials</strong> for:
            </p>
            <p
              style={{
                margin: '0 0 12px 0',
                padding: '8px',
                backgroundColor: colors.inputBg,
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '14px',
              }}
            >
              {resourceName}
            </p>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
              <strong>Security best practices:</strong>
            </p>
            <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '13px' }}>
              <li>Ensure no one can see your screen</li>
              <li>Do not share this {secretType} via insecure channels</li>
              <li>Close this dialog immediately after use</li>
              <li>Be aware this action may be logged</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleClose}
              style={{
                padding: '10px 20px',
                backgroundColor: colors.inputBg,
                color: colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => setHasConfirmed(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              I Understand, Show Secret
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Secret display step - show the actual secret
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.overlay,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: colors.background,
          color: colors.text,
          padding: '24px',
          borderRadius: '8px',
          minWidth: '600px',
          maxWidth: '800px',
          maxHeight: '80vh',
          overflow: 'auto',
          border: `2px solid #f44336`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with warning badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🔐</span>
            <h2 style={{ margin: 0 }}>Sensitive Credentials</h2>
          </div>
          <span
            style={{
              padding: '4px 12px',
              backgroundColor: '#f44336',
              color: 'white',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            CONFIDENTIAL
          </span>
        </div>

        {/* Resource Info */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: colors.textSecondary }}>
            Resource:
          </p>
          <p
            style={{
              margin: '0',
              fontFamily: 'monospace',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            {resourceName}
          </p>
        </div>

        {/* Secret Content */}
        <div style={{ marginTop: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {secretType === 'password' ? 'Password' : 'Certificate & Private Key'}
            </label>
            <button
              onClick={handleCopyToClipboard}
              style={{
                padding: '6px 12px',
                backgroundColor: isCopied ? '#4caf50' : colors.inputBg,
                color: isCopied ? 'white' : colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {isCopied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          <textarea
            readOnly
            value={secretValue}
            style={{
              width: '100%',
              minHeight: secretType === 'certificate' ? '300px' : '100px',
              padding: '12px',
              border: `2px solid #f44336`,
              borderRadius: '4px',
              backgroundColor: colors.inputBg,
              color: colors.text,
              fontFamily: 'monospace',
              fontSize: '12px',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Security Reminder */}
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#856404',
          }}
        >
          <strong>⚠️ Remember:</strong> Close this window immediately after use. Do not share
          these credentials via insecure channels.
        </div>

        {/* Close Button */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleClose}
            style={{
              padding: '10px 24px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

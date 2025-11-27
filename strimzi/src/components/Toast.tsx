// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Angelo Cesaro

import React from 'react';
import { useThemeColors } from '../utils/theme';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  message: string;
  type: ToastType;
  duration?: number; // milliseconds, default 4000
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

/**
 * Toast notification component with fade-in/fade-out animations.
 * Displays temporary messages for user feedback (success, error, info).
 * Auto-dismisses after specified duration or can be manually closed.
 */
export function Toast({ toast, onClose }: ToastProps) {
  const colors = useThemeColors();
  const [isVisible, setIsVisible] = React.useState(false);
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    if (toast) {
      // Trigger fade-in animation
      setIsVisible(true);
      setIsExiting(false);

      // Auto-dismiss after duration
      const duration = toast.duration || 4000;
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [toast]);

  const handleClose = () => {
    // Trigger fade-out animation
    setIsExiting(true);

    // Wait for animation to complete before removing
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      onClose();
    }, 300); // Match animation duration
  };

  if (!toast || !isVisible) return null;

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return colors.text === '#e0e0e0' ? '#2e7d32' : '#4caf50'; // Dark/Light mode
      case 'error':
        return colors.text === '#e0e0e0' ? '#c62828' : '#f44336';
      case 'info':
        return colors.text === '#e0e0e0' ? '#1565c0' : '#2196f3';
      default:
        return colors.background;
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        maxWidth: '400px',
        minWidth: '300px',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'translateY(20px)' : 'translateY(0)',
        transition: 'opacity 300ms ease-out, transform 300ms ease-out',
        animation: isExiting ? 'none' : 'slideInUp 300ms ease-out',
      }}
    >
      <div
        style={{
          backgroundColor: getBackgroundColor(),
          color: '#ffffff',
          padding: '14px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            flexShrink: 0,
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
          }}
        >
          {getIcon()}
        </div>

        {/* Message */}
        <div
          style={{
            flex: 1,
            fontSize: '14px',
            lineHeight: '1.4',
            wordBreak: 'break-word',
          }}
        >
          {toast.message}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '4px',
            marginLeft: '8px',
            opacity: 0.8,
            transition: 'opacity 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>

      {/* CSS animations - injected as inline style element */}
      <style>
        {`
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}

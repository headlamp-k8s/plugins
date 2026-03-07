import React from 'react';
import { useTheme } from '@mui/material/styles';
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import Editor from '@monaco-editor/react';
import { Toast, ToastMessage } from './Toast';

interface ResourceEditorProps {
  open: boolean;
  onClose: () => void;
  resourceUrl: string;
  resourceName: string;
  resourceKind: string;
}

export function ResourceEditor({ open, onClose, resourceUrl, resourceName, resourceKind }: ResourceEditorProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [content, setContent] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState<ToastMessage | null>(null);

  React.useEffect(() => {
    if (!open || !resourceUrl) return;
    setLoading(true);
    ApiProxy.request(resourceUrl)
      .then((data: unknown) => {
        setContent(JSON.stringify(data, null, 2));
        setLoading(false);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        setToast({ message: `Failed to load resource: ${message}`, type: 'error' });
        setLoading(false);
      });
  }, [open, resourceUrl]);

  const handleSave = () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      setToast({ message: 'Invalid JSON', type: 'error' });
      return;
    }

    setSaving(true);
    ApiProxy.request(resourceUrl, {
      method: 'PUT',
      body: JSON.stringify(parsed),
      headers: { 'Content-Type': 'application/json' },
    })
      .then(() => {
        setToast({ message: `${resourceKind} "${resourceName}" updated`, type: 'success' });
        setTimeout(onClose, 1000);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        setToast({ message: `Failed to save: ${message}`, type: 'error' });
      })
      .finally(() => setSaving(false));
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: '12px',
          width: '900px',
          maxWidth: '90vw',
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isDark
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            : '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: theme.palette.text.primary }}>
              Edit {resourceKind}
            </div>
            <div style={{ fontSize: '13px', color: theme.palette.text.secondary, marginTop: '2px' }}>
              {resourceName}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: saving ? (isDark ? '#1e3a5f' : '#93c5fd') : (isDark ? '#2563eb' : '#3b82f6'),
                color: '#fff',
                cursor: saving || loading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                opacity: saving || loading ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: 'transparent',
                color: theme.palette.text.primary,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Editor */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {loading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: theme.palette.text.secondary,
                fontSize: '14px',
              }}
            >
              Loading resource...
            </div>
          ) : (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
              <Editor
                language="json"
                value={content}
                theme={isDark ? 'vs-dark' : 'light'}
                onChange={(value: string | undefined) => {
                  if (value !== undefined) setContent(value);
                }}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 13,
                  wordWrap: 'on',
                }}
              />
            </div>
          )}
        </div>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

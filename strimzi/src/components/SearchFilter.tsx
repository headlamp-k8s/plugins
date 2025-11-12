import React from 'react';

// Helper to get theme-aware colors
const useThemeColors = () => {
  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  return {
    background: isDark ? '#1e1e1e' : '#ffffff',
    text: isDark ? '#e0e0e0' : '#000000',
    textSecondary: isDark ? '#b0b0b0' : '#666666',
    border: isDark ? '#404040' : '#ddd',
    inputBg: isDark ? '#2a2a2a' : '#ffffff',
    inputBorder: isDark ? '#505050' : '#ddd',
    chipBg: isDark ? '#3a3a3a' : '#e3f2fd',
    chipText: isDark ? '#90caf9' : '#1976d2',
  };
};

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  resultCount?: number;
  totalCount?: number;
  children?: React.ReactNode; // For advanced filters
}

export function SearchFilter({
  searchTerm,
  onSearchChange,
  placeholder = 'Search...',
  resultCount,
  totalCount,
  children,
}: SearchFilterProps) {
  const colors = useThemeColors();
  const [showFilters, setShowFilters] = React.useState(false);

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          {/* Search Icon */}
          <span
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.textSecondary,
              fontSize: '18px',
            }}
          >
            🔍
          </span>

          {/* Search Input */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '10px 40px 10px 40px',
              border: `1px solid ${colors.inputBorder}`,
              borderRadius: '6px',
              backgroundColor: colors.inputBg,
              color: colors.text,
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#1976d2';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.inputBorder;
            }}
          />

          {/* Clear Button */}
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: colors.textSecondary,
                cursor: 'pointer',
                fontSize: '18px',
                padding: '0',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Toggle Button (if filters available) */}
        {children && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '10px 16px',
              border: `1px solid ${colors.inputBorder}`,
              borderRadius: '6px',
              backgroundColor: showFilters ? colors.chipBg : colors.inputBg,
              color: showFilters ? colors.chipText : colors.text,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: showFilters ? '600' : 'normal',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!showFilters) {
                e.currentTarget.style.backgroundColor = colors.chipBg;
              }
            }}
            onMouseLeave={(e) => {
              if (!showFilters) {
                e.currentTarget.style.backgroundColor = colors.inputBg;
              }
            }}
          >
            🎛️ Filters {showFilters ? '▲' : '▼'}
          </button>
        )}
      </div>

      {/* Results Counter */}
      {resultCount !== undefined && totalCount !== undefined && (
        <div
          style={{
            fontSize: '13px',
            color: colors.textSecondary,
            marginBottom: '10px',
          }}
        >
          Showing <strong style={{ color: colors.text }}>{resultCount}</strong> of{' '}
          <strong style={{ color: colors.text }}>{totalCount}</strong>{' '}
          {totalCount === 1 ? 'result' : 'results'}
        </div>
      )}

      {/* Advanced Filters (collapsible) */}
      {children && showFilters && (
        <div
          style={{
            padding: '15px',
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            backgroundColor: colors.background,
            marginTop: '10px',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// Filter Group Component for organizing filters
interface FilterGroupProps {
  label: string;
  children: React.ReactNode;
}

export function FilterGroup({ label, children }: FilterGroupProps) {
  const colors = useThemeColors();

  return (
    <div style={{ marginBottom: '15px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: '600',
          color: colors.text,
          marginBottom: '8px',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

// Filter Select Component
interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

export function FilterSelect({ value, onChange, options }: FilterSelectProps) {
  const colors = useThemeColors();

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '8px',
        border: `1px solid ${colors.inputBorder}`,
        borderRadius: '4px',
        backgroundColor: colors.inputBg,
        color: colors.text,
        fontSize: '14px',
        cursor: 'pointer',
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// Filter Number Range Component
interface FilterNumberRangeProps {
  minValue: number | '';
  maxValue: number | '';
  onMinChange: (value: number | '') => void;
  onMaxChange: (value: number | '') => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
}

export function FilterNumberRange({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minPlaceholder = 'Min',
  maxPlaceholder = 'Max',
}: FilterNumberRangeProps) {
  const colors = useThemeColors();

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <input
        type="number"
        value={minValue}
        onChange={(e) => onMinChange(e.target.value === '' ? '' : Number(e.target.value))}
        placeholder={minPlaceholder}
        style={{
          flex: 1,
          padding: '8px',
          border: `1px solid ${colors.inputBorder}`,
          borderRadius: '4px',
          backgroundColor: colors.inputBg,
          color: colors.text,
          fontSize: '14px',
        }}
      />
      <span style={{ color: colors.textSecondary }}>—</span>
      <input
        type="number"
        value={maxValue}
        onChange={(e) => onMaxChange(e.target.value === '' ? '' : Number(e.target.value))}
        placeholder={maxPlaceholder}
        style={{
          flex: 1,
          padding: '8px',
          border: `1px solid ${colors.inputBorder}`,
          borderRadius: '4px',
          backgroundColor: colors.inputBg,
          color: colors.text,
          fontSize: '14px',
        }}
      />
    </div>
  );
}

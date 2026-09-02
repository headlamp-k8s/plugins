import { Autocomplete, Box, TextField } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

/** Props for the filter bar rendered in the releases list header. */
interface ReleaseFiltersProps {
  nameFilter: string;
  namespaceFilter: string;
  statusFilter: string;
  /** Namespace strings derived from the currently loaded releases, used to populate the dropdown. */
  availableNamespaces: string[];
  availableStatuses: string[];
  onNameFilterChange: (value: string) => void;
  onNamespaceFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
}

export function ReleaseFilters({
  nameFilter,
  namespaceFilter,
  statusFilter,
  availableNamespaces,
  availableStatuses,
  onNameFilterChange,
  onNamespaceFilterChange,
  onStatusFilterChange,
}: ReleaseFiltersProps) {
  const [inputValue, setInputValue] = useState(nameFilter);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setInputValue(nameFilter);
  }, [nameFilter]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onNameFilterChange(inputValue);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inputValue, onNameFilterChange]);

  return (
    <Box display="flex" gap={2} alignItems="center">
      <TextField
        sx={{
          width: { xs: '100%', sm: '200px', md: '250px' },
          margin: { xs: '0.5rem 0', sm: '0 1rem' },
        }}
        id="outlined-basic"
        label="Search"
        value={inputValue}
        onChange={event => {
          setInputValue(event.target.value);
        }}
      />
      <Autocomplete
        sx={{ width: { xs: '100%', sm: '200px', md: '250px' } }}
        options={availableNamespaces}
        getOptionLabel={option => option || 'All Namespaces'}
        value={namespaceFilter || null}
        onChange={(event, newValue) => {
          onNamespaceFilterChange(newValue || '');
        }}
        renderInput={params => <TextField {...params} label="Namespace" size="small" />}
      />
      <Autocomplete
        sx={{ width: { xs: '100%', sm: '200px', md: '250px' } }}
        options={availableStatuses}
        getOptionLabel={option => option || 'All Statuses'}
        value={statusFilter || null}
        onChange={(event, newValue) => {
          onStatusFilterChange(newValue || '');
        }}
        renderInput={params => <TextField {...params} label="Status" size="small" />}
      />
    </Box>
  );
}

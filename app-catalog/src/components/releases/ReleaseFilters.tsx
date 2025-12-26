import { Autocomplete, Box, TextField } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

interface ReleaseFiltersProps {
  nameFilter: string;
  namespaceFilter: string;
  availableNamespaces: string[];
  onNameFilterChange: (value: string) => void;
  onNamespaceFilterChange: (value: string) => void;
}

export function ReleaseFilters({
  nameFilter,
  namespaceFilter,
  availableNamespaces,
  onNameFilterChange,
  onNamespaceFilterChange,
}: ReleaseFiltersProps) {
  const [inputValue, setInputValue] = useState(nameFilter);
  const timeoutRef = useRef<NodeJS.Timeout>();

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
          width: '20vw',
          margin: '0 1rem',
        }}
        id="outlined-basic"
        label="Search"
        value={inputValue}
        onChange={event => {
          setInputValue(event.target.value);
        }}
      />
      <Autocomplete
        sx={{ width: '20vw' }}
        options={['', ...availableNamespaces]}
        getOptionLabel={option => option || 'All Namespaces'}
        value={namespaceFilter}
        onChange={(event, newValue) => {
          onNamespaceFilterChange(newValue || '');
        }}
        renderInput={params => <TextField {...params} label="Filter by Namespace" size="small" />}
      />
    </Box>
  );
}

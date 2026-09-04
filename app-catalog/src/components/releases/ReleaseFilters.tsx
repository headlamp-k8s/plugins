import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { TextField } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

/** Props for the filter bar rendered in the releases list header. */
interface ReleaseFiltersProps {
  nameFilter: string;
  onNameFilterChange: (value: string) => void;
}

export function ReleaseFilters({ nameFilter, onNameFilterChange }: ReleaseFiltersProps) {
  const { t } = useTranslation();
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
    <TextField
      sx={{ width: { xs: '100%', sm: '200px', md: '250px' } }}
      id="outlined-basic"
      label={t('Search')}
      size="small"
      value={inputValue}
      onChange={event => {
        setInputValue(event.target.value);
      }}
    />
  );
}

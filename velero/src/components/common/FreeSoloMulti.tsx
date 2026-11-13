import { Autocomplete, Chip, TextField } from '@mui/material';

type FreeSoloMultiProps = {
  id?: string;
  label: string;
  placeholder: string;
  options: string[];
  value: string[];
  disabled?: boolean;
  onChange: (next: string[]) => void;
  onInputChange: (text: string, reason: string) => void;
};

/** Multi-select that also accepts typed values, including names not in `options`. */
export default function FreeSoloMulti({
  id,
  label,
  placeholder,
  options,
  value,
  disabled,
  onChange,
  onInputChange,
}: FreeSoloMultiProps) {
  return (
    <Autocomplete
      multiple
      freeSolo
      autoSelect
      id={id}
      options={options}
      value={value}
      disabled={disabled}
      onChange={(_, next) => onChange(next)}
      onInputChange={(_, text, reason) => onInputChange(text, reason)}
      renderInput={params => (
        <TextField {...params} variant="outlined" label={label} placeholder={placeholder} />
      )}
      renderTags={(tags, getTagProps) =>
        tags.map((option, index) => (
          <Chip label={option} {...getTagProps({ index })} size="small" />
        ))
      }
    />
  );
}

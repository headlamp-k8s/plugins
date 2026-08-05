import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  Box,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { getValueAtPath, SchemaFormField, setValueAtPath } from '../../helpers/valuesSchema';

/**
 * Renders a simple form for a chart's values, driven by the fields extracted
 * from the chart's values.schema.json. Field edits are propagated back to the
 * caller as an updated values object so the YAML editor stays in sync.
 */
export function ValuesForm(props: {
  fields: SchemaFormField[];
  values: Record<string, any>;
  onValuesChange: (values: Record<string, any>) => void;
}) {
  const { fields, values, onValuesChange } = props;
  const { t } = useTranslation();

  if (fields.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="body1" color="text.secondary">
          {t('This chart does not provide a values schema. Use the YAML view to edit values.')}
        </Typography>
      </Box>
    );
  }

  function handleFieldChange(field: SchemaFormField, rawValue: any) {
    let value: any = rawValue;
    if (field.type === 'number' || field.type === 'integer') {
      if (rawValue === '') {
        // Clearing a numeric field restores the schema/chart default.
        value = field.defaultValue;
      } else {
        const parsed = field.type === 'integer' ? parseInt(rawValue, 10) : parseFloat(rawValue);
        if (isNaN(parsed)) {
          return;
        }
        value = parsed;
      }
    }
    onValuesChange(setValueAtPath(values, field.path, value));
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 2,
        p: 2,
        maxHeight: '500px',
        overflowY: 'auto',
      }}
    >
      {fields.map(field => {
        const id = `values-form-${field.path.join('-')}`;
        const currentValue = getValueAtPath(values, field.path) ?? field.defaultValue;
        const label = field.path.join('.');
        const labelWithRequired = field.required ? `${label} *` : label;

        if (field.type === 'boolean') {
          return (
            <Tooltip key={id} title={field.description ?? ''}>
              <FormControlLabel
                control={
                  <Checkbox
                    id={id}
                    checked={!!currentValue}
                    onChange={event => handleFieldChange(field, event.target.checked)}
                  />
                }
                label={labelWithRequired}
              />
            </Tooltip>
          );
        }

        if (field.type === 'enum') {
          return (
            <TextField
              key={id}
              id={id}
              select
              size="small"
              label={labelWithRequired}
              helperText={field.description}
              value={currentValue ?? ''}
              onChange={event => handleFieldChange(field, event.target.value)}
            >
              {(field.enumValues ?? []).map(option => (
                <MenuItem key={String(option)} value={option}>
                  {String(option)}
                </MenuItem>
              ))}
            </TextField>
          );
        }

        return (
          <TextField
            key={id}
            id={id}
            size="small"
            type={field.type === 'string' ? 'text' : 'number'}
            label={labelWithRequired}
            helperText={field.description}
            value={currentValue ?? ''}
            inputProps={
              field.type === 'string'
                ? undefined
                : {
                    min: field.minimum,
                    max: field.maximum,
                    step: field.type === 'integer' ? 1 : 'any',
                  }
            }
            onChange={event => handleFieldChange(field, event.target.value)}
          />
        );
      })}
    </Box>
  );
}

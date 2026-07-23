import { Icon } from '@iconify/react';
import { EditorDialog } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Button } from '@mui/material';
import { useState } from 'react';
import { useInstanceClass } from '../../resources/instance';
import { buildInstanceSkeleton } from '../../resources/instanceSkeleton';
import { ResourceGraphDefinition } from '../../resources/resourceGraphDefinition';

/**
 * Opens Headlamp's YAML editor pre-filled with a minimal valid instance
 * of the RGD's generated API. Saving applies through the editor's
 * default apply logic — no custom form building.
 */
export default function NewInstanceButton(props: { rgd: ResourceGraphDefinition }) {
  const { rgd } = props;
  const [open, setOpen] = useState(false);
  const { instanceClass, apiInfo } = useInstanceClass(rgd);

  if (!instanceClass || !apiInfo) {
    return null;
  }

  // The discovered CRD, not the RGD's spec.schema, is the source of
  // truth for the apiVersion instances must be created with.
  const skeleton = buildInstanceSkeleton(rgd.jsonData, apiInfo);

  return (
    <>
      <Button
        startIcon={<Icon icon="mdi:plus-circle-outline" />}
        color="primary"
        variant="outlined"
        size="small"
        onClick={() => setOpen(true)}
      >
        New Instance
      </Button>
      <EditorDialog
        item={skeleton}
        open={open}
        onClose={() => setOpen(false)}
        setOpen={setOpen}
        onSave="default"
        saveLabel="Apply"
        title={`New ${rgd.generatedKind}`}
        aria-label={`New ${rgd.generatedKind}`}
      />
    </>
  );
}

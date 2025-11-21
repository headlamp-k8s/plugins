import { CallbackActionOptions } from '@kinvolk/headlamp-plugin/lib';
import {
  ActionButton,
  AuthVisible,
  ButtonStyle,
  ViewButton,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import { useState } from 'react';

interface EditConfigButtonProps {
  resource: KubeObject;
  options?: CallbackActionOptions;
  buttonStyle?: ButtonStyle;
  afterConfirm?: () => void;
  handleClick: () => void;
}

export function EditConfigButton(props: EditConfigButtonProps) {
  const [isReadOnly, setIsReadOnly] = useState(false);

  const { resource, buttonStyle, handleClick } = props;

  if (!resource) {
    return null;
  }

  if (isReadOnly) {
    return <ViewButton item={resource} />;
  }

  return (
    <AuthVisible
      item={resource}
      authVerb="update"
      onError={(err: Error) => {
        console.error(`Error while getting authorization for edit button in ${resource}:`, err);
        setIsReadOnly(true);
      }}
      onAuthResult={({ allowed }) => {
        setIsReadOnly(!allowed);
      }}
    >
      <ActionButton
        description={'Config Editor'}
        buttonStyle={buttonStyle}
        onClick={handleClick}
        icon="mdi:file-document-edit"
      />
    </AuthVisible>
  );
}

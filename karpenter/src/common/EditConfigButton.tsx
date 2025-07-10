import {
  AppDispatch,
  CallbackActionOptions,
  clusterAction,
  KubeObject,
  KubeObjectInterface,
} from '@kinvolk/headlamp-plugin/lib';
import {
  ActionButton,
  AuthVisible,
  ButtonStyle,
  ViewButton,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import yaml from 'js-yaml';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { jsonToYAML } from '../helpers/jsonTOYAML';
import { DiffEditorDialog } from './resourceEditor';

/**
 * Props for the EditConfigButton component.
 */
interface EditConfigButtonProps {
  /**
   * The Kubernetes resource object to edit.
   * This should be an instance of KubeObject containing the resource's data.
   */
  resource: KubeObject;
  /**
   * Optional action options for the cluster operation.
   */
  options?: CallbackActionOptions;
  /**
   * Optional styling for the button component.
   */
  buttonStyle?: ButtonStyle;
  /**
   * Optional callback function to execute after successful confirmation/save.
   * Can be used to perform additional actions after the resource is updated.
   */
  afterConfirm?: () => void;
  /**
   * The JSON schema used for validating the resource configuration.
   * This schema ensures the edited configuration conforms to expected structure.
   */
  schema: string;
}

export function EditConfigButton(props: EditConfigButtonProps) {
  const dispatch: AppDispatch = useDispatch();
  const { resource, options = {}, buttonStyle, afterConfirm, schema } = props;
  const [diffOpen, setDiffOpen] = React.useState(false);
  const [originalYaml, setOriginalYaml] = React.useState('');
  const [modifiedYaml, setModifiedYaml] = React.useState('');
  const [isReadOnly, setIsReadOnly] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const location = useLocation();

  function makeErrorMessage(err: any) {
    const status: number = err.status;
    switch (status) {
      case 408:
        return 'Conflicts when trying to perform operation (code 408).';
      default:
        return `Failed to perform operation: code ${status}`;
    }
  }

  async function updateFunc(newItem: KubeObjectInterface) {
    try {
      await resource.update(newItem);
    } catch (err) {
      setErrorMessage(makeErrorMessage(err));
      setDiffOpen(true);
      throw err;
    }
  }

  const applyFunc = React.useCallback(updateFunc, [resource]);

  function handleSave(yamlContent: string) {
    const parsed = yaml.load(yamlContent) as KubeObjectInterface;
    const cancelUrl = location.pathname;
    const itemName = resource.metadata.name;

    setDiffOpen(false);
    dispatch(
      clusterAction(() => applyFunc(parsed), {
        startMessage: `Applying changes to ${itemName}…`,
        cancelledMessage: `Cancelled changes to ${itemName}.`,
        successMessage: `Applied changes to ${itemName}.`,
        errorMessage: `Failed to apply changes to ${itemName}.`,
        cancelUrl,
        errorUrl: cancelUrl,
        ...options,
      })
    );

    if (afterConfirm) {
      afterConfirm();
    }
  }

  const handleShowDiff = () => {
    if (!resource || !resource.jsonData) {
      return;
    }

    try {
      const original = jsonToYAML(resource.jsonData);
      setOriginalYaml(original);
      setModifiedYaml(original);
      setDiffOpen(true);
    } catch (error) {
      console.error(error);
    }
  };

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
        onClick={handleShowDiff}
        icon="mdi:file-document-edit"
      />
      <DiffEditorDialog
        resource={resource}
        open={diffOpen}
        onClose={() => setDiffOpen(false)}
        originalYaml={originalYaml}
        modifiedYaml={modifiedYaml}
        onSave={handleSave}
        errorMessage={errorMessage}
        schema={schema}
      />
    </AuthVisible>
  );
}

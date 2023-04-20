import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
} from '@material-ui/core';
import MonacoEditor from '@monaco-editor/react';
import _ from 'lodash';
import { useSnackbar } from 'notistack';
import { useRef,useState } from 'react';
import { getActionStatus, upgradeRelease } from '../../api/releases';
import { jsonToYAML, yamlToJSON } from '../../helpers';

export function EditorDialog(props: {
  openEditor: boolean;
  handleEditor: (open: boolean) => void;
  releaseName: string;
  releaseNamespace: string;
  release: any;
  isUpdateRelease: boolean;
  handleUpdate: () => void;
}) {
  const {
    openEditor,
    handleEditor,
    releaseName,
    releaseNamespace,
    release,
    isUpdateRelease,
    handleUpdate,
  } = props;
  if (!release) return null;
  const themeName = localStorage.getItem('headlampThemePreference');
  const { enqueueSnackbar } = useSnackbar();
  const [valuesToShow, setValuesToShow] = useState(
    Object.assign({}, release.chart.values, release.config)
  );
  const [values, setValues] = useState(release.chart.values);
  const [userValues, setUserValues] = useState(() => {
    const userVals = _.cloneDeep(release.config);
    delete userVals['dev.headlamp.metadata'];
    return userVals;
  });
  const [isUserValues, setIsUserValues] = useState(false);
  const [releaseUpdateDescription, setReleaseUpdateDescription] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const checkBoxRef = useRef(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  function handleValueChange(event: any) {
    if (event.target.checked) {
      setValuesToShow(userValues);
    } else {
      setValuesToShow(values);
    }
    setIsUserValues(event.target.checked);
  }

  function checkUpgradeStatus() {
    setTimeout(() => {
      getActionStatus(releaseName, 'upgrade')
        .then((response: any) => {
          if (response.status === 'processing') {
            checkUpgradeStatus();
          } else if (response.status && response.status === 'failed') {
            enqueueSnackbar(`Error upgrading release ${releaseName} ${response.message}`, {
              variant: 'error',
              autoHideDuration: 5000,
            });
            handleEditor(false);
            setUpgradeLoading(false);
          } else if (!response.status || response.status !== 'success') {
            enqueueSnackbar(`Error upgrading release ${releaseName}`, {
              variant: 'error',
              autoHideDuration: 5000,
            });
            handleEditor(false);
          } else {
            enqueueSnackbar(`Release ${releaseName} upgraded successfully`, {
              variant: 'success',
              autoHideDuration: 5000,
            });
            handleEditor(false);
            setUpgradeLoading(false);
            handleUpdate();
          }
        })
        .catch(() => {
          setUpgradeLoading(false);
          handleEditor(false);
        });
    }, 1000);
  }

  function upgradeReleaseHandler() {
    setIsFormSubmitting(true);
    if (!releaseUpdateDescription) {
      enqueueSnackbar(`Please add release description`, {
        variant: 'error',
        autoHideDuration: 5000,
      });
      return;
    }
    setUpgradeLoading(true);
    const defaultValuesJSON = values;
    const userValuesJSON = userValues;
    // find default values diff
    const chartDefaultValuesDiff = _.omitBy(defaultValuesJSON, (value, key) =>
      _.isEqual(value, (release.chart.values || {})[key])
    );

    // find user values diff
    const chartUserValuesDiff = _.omitBy(userValuesJSON, (value, key) =>
      _.isEqual(value, (release.config || {})[key])
    );
    const chartValuesDIFF = Object.assign({}, chartDefaultValuesDiff, chartUserValuesDiff);
    const chartYAML = btoa(unescape(encodeURIComponent(jsonToYAML(chartValuesDIFF))));
    /* when we install a chart we add the metadata where we pass the chartName, below we access that 
       metadata from release.config */
    const chartName = release.config['dev.headlamp.metadata']['chartName'];
    upgradeRelease(releaseName, releaseNamespace, chartYAML, chartName, releaseUpdateDescription)
      .then(() => {
        checkUpgradeStatus();
      })
      .catch(() => {
        setUpgradeLoading(false);
        handleEditor(false);
        enqueueSnackbar(`Error upgrading release ${releaseName}`, {
          variant: 'error',
          autoHideDuration: 5000,
        });
      });
  }

  function handleEditorChange(value: string) {
    if (checkBoxRef?.current?.checked) {
      setUserValues(yamlToJSON(value));
    } else {
      setValues(yamlToJSON(value));
    }
  }

  return (
    <Dialog
      open={openEditor}
      maxWidth="lg"
      fullWidth
      style={{
        overflow: 'hidden',
      }}
    >
      <DialogTitle>
        <Box display="flex" p={2}>
          <Box mr={2}>
            <TextField
              id="release-name"
              disabled
              style={{
                width: '20vw',
              }}
              variant="filled"
              label="Release Name"
              value={releaseName}
            />
          </Box>
          <Box>
            <TextField
              id="release-namespace"
              disabled
              style={{
                width: '20vw',
              }}
              variant="filled"
              label="Release Namespace"
              value={releaseNamespace}
            />
          </Box>
          <Box ml={1}>
            {isUpdateRelease && (
              <TextField
                id="release-description"
                style={{
                  width: '20vw',
                }}
                error={isFormSubmitting && !releaseUpdateDescription}
                variant="outlined"
                label="Release Description"
                value={releaseUpdateDescription}
                onChange={event => setReleaseUpdateDescription(event.target.value)}
              />
            )}
          </Box>
        </Box>
        <Box ml={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isUserValues}
                onChange={handleValueChange}
                inputProps={{ 'aria-label': 'Switch between default and user defined values' }}
                inputRef={checkBoxRef}
              />
            }
            label="user defined values only"
          />
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box pt={2} height="100%" my={1} p={1}>
          <MonacoEditor
            value={jsonToYAML(valuesToShow)}
            language="yaml"
            height="400px"
            options={{
              selectOnLineNumbers: true,
            }}
            onChange={value => {
              handleEditorChange(value);
            }}
            theme={themeName === 'dark' ? 'vs-dark' : 'light'}
            onMount={editor => {
              setReleaseUpdateDescription('');
              setIsUserValues(false);
              setValuesToShow(Object.assign({}, release.chart.values, release.config));
              if (!isUpdateRelease) {
                editor.updateOptions({ readOnly: true });
              }
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions
        style={{
          padding: 0,
          margin: '1rem 0.5rem',
        }}
      >
        <Button
          style={{
            backgroundColor: '#000',
            color: 'white',
            textTransform: 'none',
          }}
          onClick={() => handleEditor(false)}
        >
          Close
        </Button>
        {isUpdateRelease &&
          (upgradeLoading ? (
            <Button disabled={upgradeLoading}>{upgradeLoading ? 'Upgrading' : 'Upgrade'}</Button>
          ) : (
            <Button
              style={{
                backgroundColor: '#000',
                color: 'white',
                textTransform: 'none',
              }}
              onClick={() => upgradeReleaseHandler()}
              disabled={upgradeLoading}
            >
              Upgrade
            </Button>
          ))}
      </DialogActions>
    </Dialog>
  );
}

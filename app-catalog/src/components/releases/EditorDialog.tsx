import { Dialog, Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Editor from '@monaco-editor/react';
import {
  Box,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  FormControlLabel,
  TextField,
} from '@mui/material';
import { Autocomplete } from '@mui/material';
import _ from 'lodash';
import { useSnackbar } from 'notistack';
import { useEffect, useRef, useState } from 'react';
import semver from 'semver';
import { fetchChart, getActionStatus, upgradeRelease } from '../../api/releases';
import { jsonToYAML, yamlToJSON } from '../../helpers';
import {APP_CATALOG_HELM_REPOSITORY} from "../charts/List";

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
  const [values, setValues] = useState(Object.assign({}, release.chart.values, release.config));
  const [userValues, setUserValues] = useState(release.config);
  const [isUserValues, setIsUserValues] = useState(false);
  const [releaseUpdateDescription, setReleaseUpdateDescription] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const checkBoxRef = useRef(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState<{
    value: string;
    title: string;
    version: string;
  }>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (isUpdateRelease) {
      async function fetchChartVersions() {
        let response;
        let error: Error | null = null;
        try {
          const metadataName = release.chart.metadata.name === APP_CATALOG_HELM_REPOSITORY ? '/' + release.chart.metadata.name : release.chart.metadata.name;
          response = await fetchChart(metadataName);
        } catch (err) {
          error = err;
        }

        if (!isMounted) {
          return;
        }

        if (!!error) {
          enqueueSnackbar(`Error fetching chart versions: ${error.message}`, {
            variant: 'error',
            autoHideDuration: 5000,
          });
        }

        setIsLoading(false);
        const charts = response.charts;
        // sort by semantic versioning
        const chartsCopy = _.cloneDeep(charts).sort((a: any, b: any) => {
          let compareValue = semver.compare(semver.coerce(a.version), semver.coerce(b.version));
          if (compareValue === 0) {
            compareValue = a.version.localeCompare(b.version);
          }
          // Return the negative value for descending order without another pass
          return -compareValue;
        });
        setVersions(
          chartsCopy.map((chart: any) => ({
            title: `${chart.name} v${chart.version}`,
            value: chart.name,
            version: chart.version,
          }))
        );
      }

      setIsLoading(true);
      fetchChartVersions();
    }

    return () => {
      isMounted = false;
    };
  }, [isUpdateRelease]);

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
      enqueueSnackbar('Please add release description', {
        variant: 'error',
        autoHideDuration: 5000,
      });
      return;
    }
    if (!selectedVersion) {
      enqueueSnackbar('Please select a version', {
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
    upgradeRelease(
      releaseName,
      releaseNamespace,
      chartYAML,
      selectedVersion.value,
      releaseUpdateDescription,
      selectedVersion.version
    )
      .then(() => {
        enqueueSnackbar(`Upgrade request for release ${releaseName} sent successfully`, {
          variant: 'info',
        });
        handleEditor(false);
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
      withFullScreen
      style={{
        overflow: 'hidden',
      }}
      onClose={() => handleEditor(false)}
      title={`Release Name: ${releaseName} / Namespace: ${releaseNamespace}`}
    >
      {isLoading ? (
        <Loader title="Loading Chart Versions" />
      ) : (
        <>
          <Box display="flex" p={2} pt={0}>
            <Box ml={2}>
              {isUpdateRelease && (
                <TextField
                  id="release-description"
                  style={{
                    width: '20vw',
                  }}
                  error={isFormSubmitting && !releaseUpdateDescription}
                  label="Release Description"
                  value={releaseUpdateDescription}
                  onChange={event => setReleaseUpdateDescription(event.target.value)}
                />
              )}
            </Box>
            {isUpdateRelease && (
              <Box ml={2}>
                <Autocomplete
                  style={{
                    width: '20vw',
                  }}
                  options={versions}
                  getOptionLabel={option => option.version}
                  value={selectedVersion}
                  onChange={(
                    event,
                    newValue: { value: string; title: string; version: string }
                  ) => {
                    setSelectedVersion(newValue);
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Versions"
                      placeholder="Select Version"
                      error={isFormSubmitting && !selectedVersion}
                    />
                  )}
                />
              </Box>
            )}
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
          <DialogContent>
            <Box pt={2} height="100%" my={1} p={1}>
              {openEditor && (
                <Editor
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
                    setIsUserValues(false);
                    setValuesToShow(Object.assign({}, release.chart.values, release.config));
                    if (!isUpdateRelease) {
                      editor.updateOptions({ readOnly: true });
                    }
                  }}
                />
              )}
            </Box>
          </DialogContent>
        </>
      )}
      <DialogActions
        style={{
          padding: 0,
          margin: '1rem 0.5rem',
        }}
      >
        <Button onClick={() => handleEditor(false)}>Close</Button>
        {isUpdateRelease &&
          (upgradeLoading ? (
            <Button disabled={upgradeLoading}>{upgradeLoading ? 'Upgrading' : 'Upgrade'}</Button>
          ) : (
            <Button onClick={() => upgradeReleaseHandler()} disabled={upgradeLoading || isLoading}>
              Upgrade
            </Button>
          ))}
      </DialogActions>
    </Dialog>
  );
}

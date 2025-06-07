import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { Dialog, Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Editor from '@monaco-editor/react';
import { Box, Button, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { Autocomplete } from '@mui/material';
import _ from 'lodash';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { fetchChartDetailFromArtifact, fetchChartValues } from '../../api/charts';
import { createRelease, getActionStatus } from '../../api/releases';
import { addRepository } from '../../api/repository';
import { jsonToYAML, yamlToJSON } from '../../helpers';
import { APP_CATALOG_HELM_REPOSITORY,VANILLA_HELM_REPO } from './List';
//import * as global from "global";

type FieldType = {
  value: string;
  title: string;
};

export function EditorDialog(props: {
  openEditor: boolean;
  chart: any;
  handleEditor: (open: boolean) => void;
}) {
  if (!props.chart) return null;

  const { openEditor, handleEditor, chart } = props;
  const [installLoading, setInstallLoading] = useState(false);
  const [namespaces, error] = K8s.ResourceClasses.Namespace.useList();
  const [chartValues, setChartValues] = useState<string>('');
  const [defaultChartValues, setDefaultChartValues] = useState<{}>('');
  const [chartValuesLoading, setChartValuesLoading] = useState(false);
  const [chartValuesFetchError, setChartValuesFetchError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [versions, setVersions] = useState<FieldType[]>([]);
  const [chartInstallDescription, setChartInstallDescription] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<FieldType>();
  const [selectedNamespace, setSelectedNamespace] = useState<FieldType>();
  const [releaseName, setReleaseName] = useState('');
  const namespaceNames = namespaces?.map(namespace => ({
    value: namespace.metadata.name,
    title: namespace.metadata.name,
  }));
  const themeName = localStorage.getItem('headlampThemePreference');

  useEffect(() => {
    setIsFormSubmitting(false);
  }, [openEditor]);

  useEffect(() => {
    if (!selectedNamespace && !!namespaceNames) {
      setSelectedNamespace(namespaceNames[0]);
    }
  }, [selectedNamespace, namespaceNames]);

  // Fetch chart values for a given package and version
  function refreshChartValue(packageID: string, packageVersion: string) {
    fetchChartValues(packageID, packageVersion)
      .then((response: any) => {
        setChartValues(response);
        setDefaultChartValues(yamlToJSON(response));
      })
      .catch(error => {
        enqueueSnackbar(`Error fetching chart values ${error}`, {
          variant: 'error',
        });
      });
  }

  function handleChartValueFetch(chart: any) {
    const packageID = globalThis.CHART_PROFILE === VANILLA_HELM_REPO ? chart.name : chart.package_id;
    const packageVersion = selectedVersion?.value ?? chart.version;
    setChartValuesLoading(true);
    fetchChartValues(packageID, packageVersion)
      .then((response: any) => {
        setChartValuesLoading(false);
        setChartValues(response);
        setDefaultChartValues(yamlToJSON(response));
      })
      .catch(error => {
        setChartValuesLoading(false);
        setChartValuesFetchError(error);
        enqueueSnackbar(`Error fetching chart values ${error}`, {
          variant: 'error',
        });
      });
  }

  useEffect(() => {
    if (globalThis.CHART_PROFILE === VANILLA_HELM_REPO) {
      const versionsArray = AVAILABLE_VERSIONS.get(chart.name);
      const availableVersions = versionsArray.map(({ version }) => ({ title: version, value: version }));
      // @ts-ignore
      setVersions(availableVersions);
      setChartInstallDescription(`${chart.name} deployment`);
      setSelectedVersion(availableVersions[0]);
    } else {
      fetchChartDetailFromArtifact(chart.name, chart.repository.name).then(response => {
        if (response.available_versions) {
          const availableVersions = response.available_versions.map(({ version }) => ({ title: version, value: version }));
          setVersions(availableVersions);
          setSelectedVersion(availableVersions[0]);
        }
      });
    }
    handleChartValueFetch(chart);
  }, [chart]);

  useEffect(() => {
    if (selectedVersion) {
      handleChartValueFetch(chart);
    }
  }, [selectedVersion]);

  function checkInstallStatus(releaseName: string) {
    setTimeout(() => {
      getActionStatus(releaseName, 'install').then((response: any) => {
        if (response.status === 'processing') {
          checkInstallStatus(releaseName);
        } else if (!response.status || response.status !== 'success') {
          enqueueSnackbar(`Error creating release ${response.message}`, {
            variant: 'error',
          });
          handleEditor(false);
          setInstallLoading(false);
        } else {
          enqueueSnackbar(`Release ${releaseName} created successfully`, {
            variant: 'success',
          });
          handleEditor(false);
          setInstallLoading(false);
        }
      });
    }, 2000);
  }

  function installAndCreateReleaseHandler() {
    setIsFormSubmitting(true);
    if (!validateFormField(releaseName)) {
      enqueueSnackbar('Release name is required', {
        variant: 'error',
      });
      return;
    }

    if (!validateFormField(selectedNamespace)) {
      enqueueSnackbar('Namespace is required', {
        variant: 'error',
      });
      return;
    }

    if (!validateFormField(selectedVersion)) {
      enqueueSnackbar('Version is required', {
        variant: 'error',
      });
      return;
    }

    if (!validateFormField(chartInstallDescription)) {
      enqueueSnackbar('Description is required', {
        variant: 'error',
      });
      return;
    }

    const jsonChartValues = yamlToJSON(chartValues);
    const chartValuesDIFF = _.omitBy(jsonChartValues, (value, key) =>
      _.isEqual(defaultChartValues[key], value)
    );
    setInstallLoading(true);

    // In case of profile: VANILLA_HELM_REPOSITORY, set the URL to access the index.yaml of the chart, as the repoURL.
    // During the installation of an application, this URL will be added as a chart repository, and the list of available versions
    // will be loaded during the upgrade from this repository.
    const repoURL =
      globalThis.CHART_PROFILE === VANILLA_HELM_REPO ? `${CHART_URL_PREFIX}/charts/` : chart.repository.url;
    const repoName =
        globalThis.CHART_PROFILE === VANILLA_HELM_REPO ? APP_CATALOG_HELM_REPOSITORY : chart.repository.name;
    addRepository(repoName, repoURL)
      .then(() => {
        createRelease(
          releaseName,
          selectedNamespace.value,
          btoa(unescape(encodeURIComponent(jsonToYAML(chartValuesDIFF)))),
          `${repoName}/${chart.name}`,
          selectedVersion.value,
          chartInstallDescription
        )
          .then(() => {
            enqueueSnackbar(`Installation request for ${releaseName} accepted`, {
              variant: 'info',
            });
            handleEditor(false);
            checkInstallStatus(releaseName);
          })
          .catch(error => {
            handleEditor(false);
            enqueueSnackbar(`Error creating release request ${error}`, {
              variant: 'error',
            });
          });
      })
      .catch(error => {
        handleEditor(false);
        enqueueSnackbar(`Error adding repository ${error}`, {
          variant: 'error',
        });
      });
  }

  function validateFormField(fieldValue: FieldType | null | string) {
    if (typeof fieldValue === 'string') {
      if (fieldValue === '') {
        return false;
      }
      return true;
    } else {
      if (!fieldValue || fieldValue.value === '') {
        return false;
      }
      return true;
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
      title={`App: ${chart.name}`}
      onClose={() => {
        handleEditor(false);
      }}
    >
      <DialogTitle>
        {chartValuesLoading ? null : (
          <Box display="flex" justifyContent="space-evenly">
            <Box mr={2}>
              <TextField
                id="release-name"
                error={isFormSubmitting && !validateFormField(releaseName)}
                style={{
                  width: '15vw',
                }}
                label="Release Name *"
                value={releaseName}
                placeholder="Enter a name for the release"
                onChange={event => {
                  setReleaseName(event.target.value);
                }}
              />
            </Box>
            <Box>
              {!error && namespaceNames && (
                <Autocomplete
                  style={{
                    width: '15vw',
                  }}
                  options={namespaceNames}
                  getOptionLabel={option => option.title}
                  value={selectedNamespace}
                  // @ts-ignore
                  onChange={(event, newValue: FieldType) => {
                    setSelectedNamespace(newValue);
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Namespaces *"
                      placeholder="Select Namespace"
                      error={isFormSubmitting && !validateFormField(selectedNamespace)}
                    />
                  )}
                />
              )}
            </Box>
            <Box ml={2}>
              <Autocomplete
                style={{
                  width: '15vw',
                }}
                options={versions}
                getOptionLabel={(option: any) => option.title ?? option}
                value={selectedVersion ?? versions[0]}
                // @ts-ignore
                onChange={(event, newValue: FieldType) => {
                  if (globalThis.CHART_PROFILE === VANILLA_HELM_REPO && chart.version !== newValue.value) {
                    console.log('Time to change');
                    // Refresh values.yaml for a chart when the current version and new version differ
                    refreshChartValue(chart.name, newValue.value);
                  }
                  setSelectedVersion(newValue);
                }}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Versions *"
                    placeholder="Select Version"
                    error={isFormSubmitting && !validateFormField(selectedVersion)}
                  />
                )}
              />
            </Box>
            <Box ml={2}>
              <TextField
                id="release-description"
                style={{
                  width: '15vw',
                }}
                error={isFormSubmitting && !validateFormField(chartInstallDescription)}
                label="Release Description *"
                value={chartInstallDescription}
                onChange={event => setChartInstallDescription(event.target.value)}
              />
            </Box>
          </Box>
        )}
      </DialogTitle>
      <DialogContent>
        <Box height="100%">
          {/* @todo: The editor onChange doesn't fire on an undo redo event */}
          {chartValuesLoading ? (
            <Loader title="" />
          ) : (
            <Editor
              value={chartValues}
              onChange={value => {
                if (!value) {
                  return;
                }
                setChartValues(value);
              }}
              onMount={editor => {
                setInstallLoading(false);
                editor.focus();
              }}
              language="yaml"
              height="500px"
              options={{
                selectOnLineNumbers: true,
              }}
              theme={themeName === 'dark' ? 'vs-dark' : 'light'}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Box mr={2} display="flex">
          <Box mr={1}>
            <Button
              style={{
                backgroundColor: '#000',
                color: 'white',
                textTransform: 'none',
              }}
              onClick={() => {
                handleEditor(false);
              }}
            >
              Close
            </Button>
          </Box>
          <Box>
            {installLoading || chartValuesLoading || !!chartValuesFetchError ? (
              <>
                <Button disabled variant="contained">
                  {installLoading ? 'Installing' : 'Install'}
                </Button>
              </>
            ) : (
              <Button
                onClick={installAndCreateReleaseHandler}
                variant="contained"
                style={{
                  backgroundColor: '#000',
                  color: 'white',
                  textTransform: 'none',
                }}
              >
                Install{installLoading && 'ing'}
              </Button>
            )}
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

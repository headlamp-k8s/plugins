import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { Dialog, Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import MonacoEditor from '@monaco-editor/react';
import _ from 'lodash';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { fetchChartDetailFromArtifact, fetchChartValues } from '../../api/charts';
import { createRelease, getActionStatus } from '../../api/releases';
import { addRepository } from '../../api/repository';
import { jsonToYAML, yamlToJSON } from '../../helpers';

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
  const [versions, setVersions] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<{ value: string; title: string }>();
  const [selectedNamespace, setSelectedNamespace] = useState<{
    value: string;
    title: string;
  }>({ value: 'default', title: 'default' });
  const [releaseName, setReleaseName] = useState('');
  const namespaceNames = namespaces?.map(namespace => ({
    value: namespace.metadata.name,
    title: namespace.metadata.name,
  }));
  const themeName = localStorage.getItem('headlampThemePreference');

  function handleChartValueFetch(chart: any) {
    const packageID = chart.package_id;
    const packageVersion = chart.version;
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
    fetchChartDetailFromArtifact(chart.name, chart.repository.name).then(response => {
      if (response.available_versions) {
        setVersions(
          response.available_versions.map(({ version }) => ({ title: version, value: version }))
        );
      }
    });
    handleChartValueFetch(chart);
  }, [chart]);

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

  function installAndCreateReleaseHandler(
    chart: any,
    releaseName: string,
    releaseNamespace: string,
    chartValues: string
  ) {
    setIsFormSubmitting(true);
    if (!validateReleaseNameFormField()) {
      enqueueSnackbar('Release name is required', {
        variant: 'error',
      });
      return;
    }
    if (!validateVersionFormField()) {
      enqueueSnackbar('Version is required', {
        variant: 'error',
      });
      return;
    }
    const repoName = chart.repository.name;
    const repoURL = chart.repository.url;
    const jsonChartValues = yamlToJSON(chartValues);
    const chartValuesDIFF = _.omitBy(jsonChartValues, (value, key) =>
      _.isEqual(defaultChartValues[key], value)
    );
    setInstallLoading(true);

    addRepository(repoName, repoURL).then(() => {
      createRelease(
        releaseName,
        releaseNamespace,
        btoa(unescape(encodeURIComponent(jsonToYAML(chartValuesDIFF)))),
        `${repoName}/${chart.name}`,
        selectedVersion.value,
        `Install ${chart.name} (${selectedVersion.value}) in ${releaseNamespace} namespace`
      )
        .then(() => {
          checkInstallStatus(releaseName);
        })
        .catch(error => {
          handleEditor(false);
          enqueueSnackbar(`Error creating release request ${error}`, {
            variant: 'error',
          });
        });
    });
  }

  function validateReleaseNameFormField() {
    if (releaseName === '') {
      return false;
    }
    return true;
  }

  function validateVersionFormField() {
    if (!selectedVersion || selectedVersion.value === '') {
      return false;
    }
    return true;
  }

  useEffect(() => {
    setReleaseName('');
  }, []);

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
        <Box display="flex">
          <Box mr={2}>
            <TextField
              id="release-name"
              error={isFormSubmitting && releaseName === ''}
              helperText={releaseName === '' ? 'Release name is required' : ''}
              style={{
                width: '20vw',
              }}
              label="Release Name"
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
                  width: '20vw',
                }}
                options={namespaceNames}
                getOptionLabel={option => option.title}
                defaultValue={namespaceNames[0]}
                value={selectedNamespace}
                // @ts-ignore
                onChange={(event, newValue: { value: string; title: string }) => {
                  setSelectedNamespace(newValue);
                }}
                renderInput={params => (
                  <TextField {...params} label="Namespaces" placeholder="Select Namespace" />
                )}
              />
            )}
          </Box>
          <Box ml={2}>
            <Autocomplete
              style={{
                width: '20vw',
              }}
              options={versions}
              getOptionLabel={option => option.title}
              value={selectedVersion}
              // @ts-ignore
              onChange={(event, newValue: { value: string; title: string }) => {
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
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box height="100%">
          {/* @todo: The editor onChange doesn't fire on an undo redo event */}
          {chartValuesLoading ? (
            <Loader title="" />
          ) : (
            <MonacoEditor
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
                setReleaseName('');
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
                onClick={() => {
                  installAndCreateReleaseHandler(
                    chart,
                    releaseName,
                    selectedNamespace.value,
                    chartValues
                  );
                }}
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

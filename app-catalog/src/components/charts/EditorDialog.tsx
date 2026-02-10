import { K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Dialog, Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Editor from '@monaco-editor/react';
import { Box, Button, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { Autocomplete } from '@mui/material';
import _ from 'lodash';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { getCatalogConfig } from '../../api/catalogConfig';
import { fetchChartDetailFromArtifact, fetchChartValues } from '../../api/charts';
import { createRelease, getActionStatus } from '../../api/releases';
import { addRepository } from '../../api/repository';
import { APP_CATALOG_HELM_REPOSITORY } from '../../constants/catalog';
import { jsonToYAML, yamlToJSON } from '../../helpers';

type FieldType = {
  value: string;
  title: string;
};

export function EditorDialog(props: {
  openEditor: boolean;
  chart: any;
  handleEditor: (open: boolean) => void;
  chartProfile: string;
}) {
  if (!props.chart) return null;

  const { openEditor, handleEditor, chart, chartProfile } = props;
  const { t } = useTranslation();
  const [installLoading, setInstallLoading] = useState(false);
  const [namespaces, error] = K8s.ResourceClasses.Namespace.useList();
  const [chartValues, setChartValues] = useState<string>('');
  const [defaultChartValues, setDefaultChartValues] = useState<Record<string, unknown>>({});
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
  const chartCfg = getCatalogConfig();

  useEffect(() => {
    setIsFormSubmitting(false);
  }, [openEditor]);

  useEffect(() => {
    if (!selectedNamespace && !!namespaceNames) {
      setSelectedNamespace(namespaceNames[0]);
    }
  }, [selectedNamespace, namespaceNames]);

  // Fetch chart values for a given package and version (when chart version changed in editor dialog)
  function refreshChartValue(packageID: string, packageVersion: string) {
    fetchChartValues(packageID, packageVersion)
      .then((response: any) => {
        setChartValues(response);
        setDefaultChartValues(yamlToJSON(response));
      })
      .catch(error => {
        enqueueSnackbar(t('Error fetching chart values {{ error }}', { error }), {
          variant: 'error',
        });
      });
  }

  function handleChartValueFetch(chart: any) {
    const packageID = chartCfg.chartProfile === chartProfile ? chart.name : chart.package_id;
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
        enqueueSnackbar(t('Error fetching chart values {{ error }}', { error }), {
          variant: 'error',
        });
      });
  }

  useEffect(() => {
    if (chartCfg.chartProfile === chartProfile) {
      const versionsArray =
        AVAILABLE_VERSIONS instanceof Map && AVAILABLE_VERSIONS.get && chart.name
          ? AVAILABLE_VERSIONS.get(chart.name)
          : undefined;

      const availableVersions = Array.isArray(versionsArray)
        ? versionsArray.map(({ version }) => ({
            title: version,
            value: version,
          }))
        : [];
      setVersions(availableVersions);
      setChartInstallDescription(`${chart.name} deployment`);
      setSelectedVersion(availableVersions[0]);
    } else {
      fetchChartDetailFromArtifact(chart.name, chart.repository.name).then(response => {
        if (response.available_versions) {
          const availableVersions = response.available_versions.map(({ version }) => ({
            title: version,
            value: version,
          }));
          setVersions(availableVersions);
          setSelectedVersion(availableVersions[0]);
        }
      });
    }
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
          enqueueSnackbar(
            t('Error creating release {{ message }}', { message: response.message }),
            {
              variant: 'error',
            }
          );
          handleEditor(false);
          setInstallLoading(false);
        } else {
          enqueueSnackbar(t('Release {{ releaseName }} created successfully', { releaseName }), {
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
      enqueueSnackbar(t('Release name is required'), {
        variant: 'error',
      });
      return;
    }

    if (!validateFormField(selectedNamespace)) {
      enqueueSnackbar(t('Namespace is required'), {
        variant: 'error',
      });
      return;
    }

    if (!validateFormField(selectedVersion)) {
      enqueueSnackbar(t('Version is required'), {
        variant: 'error',
      });
      return;
    }

    if (!validateFormField(chartInstallDescription)) {
      enqueueSnackbar(t('Description is required'), {
        variant: 'error',
      });
      return;
    }

    const jsonChartValues = yamlToJSON(chartValues) as Record<string, unknown>;
    const chartValuesDIFF = _.omitBy(jsonChartValues, (value, key) =>
      _.isEqual((defaultChartValues as Record<string, unknown>)[key], value)
    ) as Record<string, unknown>;
    setInstallLoading(true);

    // In case of profile: VANILLA_HELM_REPOSITORY, set the URL to access the index.yaml of the chart, as the repoURL.
    // During the installation of an application, this URL will be added as a chart repository, and the list of available versions
    // will be loaded during the upgrade from this repository.
    const repoURL =
      chartCfg.chartProfile === chartProfile
        ? `${chartCfg.chartURLPrefix}/charts/`
        : chart.repository.url;
    const repoName =
      chartCfg.chartProfile === chartProfile ? APP_CATALOG_HELM_REPOSITORY : chart.repository.name;
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
            enqueueSnackbar(
              t('Installation request for {{ releaseName }} accepted', { releaseName }),
              {
                variant: 'info',
              }
            );
            handleEditor(false);
            checkInstallStatus(releaseName);
          })
          .catch(error => {
            handleEditor(false);
            enqueueSnackbar(t('Error creating release request {{ error }}', { error }), {
              variant: 'error',
            });
          });
      })
      .catch(error => {
        handleEditor(false);
        enqueueSnackbar(t('Error adding repository {{ error }}', { error }), {
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
      title={t('App: {{ name }}', { name: chart.name })}
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
                label={t('Release Name *')}
                value={releaseName}
                placeholder={t('Enter a name for the release')}
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
                      label={t('Namespaces *')}
                      placeholder={t('Select Namespace')}
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
                  if (chartCfg.chartProfile === chartProfile && chart.version !== newValue.value) {
                    // Refresh values.yaml for a chart when the current version and new version differ
                    refreshChartValue(chart.name, newValue.value);
                  }
                  setSelectedVersion(newValue);
                }}
                renderInput={params => (
                  <TextField
                    {...params}
                    label={t('Versions *')}
                    placeholder={t('Select Version')}
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
                label={t('Release Description *')}
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
              {t('Close')}
            </Button>
          </Box>
          <Box>
            {installLoading || chartValuesLoading || !!chartValuesFetchError ? (
              <>
                <Button disabled variant="contained">
                  {installLoading ? t('Installing') : t('Install')}
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
                {installLoading ? t('Installing') : t('Install')}
              </Button>
            )}
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

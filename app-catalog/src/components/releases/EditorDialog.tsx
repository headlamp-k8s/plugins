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
import { APP_CATALOG_HELM_REPOSITORY } from '../../constants/catalog';
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

  if (!release || !release.chart) return null;

  const themeName = localStorage.getItem('headlampThemePreference');
  const { enqueueSnackbar } = useSnackbar();

  const chartValues = release.chart?.values ?? {};
  const releaseConfig = release.config ?? {};

  const [valuesToShow, setValuesToShow] = useState(
    Object.assign({}, chartValues, releaseConfig)
  );
  const [values, setValues] = useState(Object.assign({}, chartValues, releaseConfig));
  const [userValues, setUserValues] = useState(releaseConfig);

  const [isUserValues, setIsUserValues] = useState(false);
  const [releaseUpdateDescription, setReleaseUpdateDescription] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [yamlError, setYamlError] = useState<string | null>(null);

  const checkBoxRef = useRef<HTMLInputElement | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (isUpdateRelease) {
      const fetchChartVersions = async () => {
        try {
          const metadataName =
            release.chart?.metadata?.name === APP_CATALOG_HELM_REPOSITORY
              ? '/' + release.chart.metadata.name
              : release.chart?.metadata?.name;

          if (!metadataName) {
            throw new Error('Chart metadata name missing');
          }

          const response = await fetchChart(metadataName);
          if (!isMounted) return;

          const charts = response?.charts ?? [];
          const sorted = _.cloneDeep(charts).sort((a: any, b: any) => {
            let cmp = semver.compare(
              semver.coerce(a.version),
              semver.coerce(b.version)
            );
            return cmp === 0 ? a.version.localeCompare(b.version) : -cmp;
          });

          setVersions(
            sorted.map((chart: any) => ({
              title: `${chart.name} v${chart.version}`,
              value: chart.name,
              version: chart.version,
            }))
          );
        } catch (err: any) {
          enqueueSnackbar(`Error fetching chart versions: ${err.message}`, {
            variant: 'error',
          });
        } finally {
          setIsLoading(false);
        }
      };

      setIsLoading(true);
      fetchChartVersions();
    }

    return () => {
      isMounted = false;
    };
  }, [isUpdateRelease, release, enqueueSnackbar]);

  function handleValueChange(event: any) {
    const checked = event.target.checked;
    setIsUserValues(checked);
    setValuesToShow(checked ? userValues : values);
  }

  
  function handleEditorChange(value?: string) {
    if (!value) return;

    try {
      const parsed = yamlToJSON(value);
      setYamlError(null);

      if (checkBoxRef.current?.checked) {
        setUserValues(parsed);
      } else {
        setValues(parsed);
      }
    } catch {
      setYamlError('Invalid YAML format');
    }
  }

  function upgradeReleaseHandler() {
    setIsFormSubmitting(true);

    if (!releaseUpdateDescription) {
      enqueueSnackbar('Please add release description', { variant: 'error' });
      return;
    }

    if (!selectedVersion) {
      enqueueSnackbar('Please select a version', { variant: 'error' });
      return;
    }

    setUpgradeLoading(true);

    const diff = Object.assign(
      {},
      _.omitBy(values, (v, k) => _.isEqual(v, chartValues[k])),
      _.omitBy(userValues, (v, k) => _.isEqual(v, releaseConfig[k]))
    );

    const yaml = btoa(unescape(encodeURIComponent(jsonToYAML(diff))));

    upgradeRelease(
      releaseName,
      releaseNamespace,
      yaml,
      selectedVersion.value,
      releaseUpdateDescription,
      selectedVersion.version
    )
      .then(() => {
        enqueueSnackbar('Upgrade request sent', { variant: 'info' });
        handleEditor(false);
      })
      .catch(() => {
        enqueueSnackbar('Upgrade failed', { variant: 'error' });
        setUpgradeLoading(false);
      });
  }

  return (
    <Dialog
      open={openEditor}
      maxWidth="lg"
      fullWidth
      withFullScreen
      onClose={() => handleEditor(false)}
      title={`Release Name: ${releaseName} / Namespace: ${releaseNamespace}`}
    >
      {isLoading ? (
        <Loader title="Loading Chart Versions" />
      ) : (
        <>
          <DialogContent>
            <Editor
              value={jsonToYAML(valuesToShow)}
              language="yaml"
              height="400px"
              theme={themeName === 'dark' ? 'vs-dark' : 'light'}
              onChange={handleEditorChange}
            />
            {yamlError && (
              <Box color="error.main" mt={1}>
                {yamlError}
              </Box>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={() => handleEditor(false)}>Close</Button>
            <Button
              onClick={upgradeReleaseHandler}
              disabled={upgradeLoading || !!yamlError}
            >
              Upgrade
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}

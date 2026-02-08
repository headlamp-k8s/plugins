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

  // 🔧 FIX 1: guard deeper than just `release`
  if (!release || !release.chart) return null;

  const themeName = localStorage.getItem('headlampThemePreference');
  const { enqueueSnackbar } = useSnackbar();

  // 🔧 FIX 2: safe fallbacks for chart values
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
  const checkBoxRef = useRef<HTMLInputElement | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<{
    value: string;
    title: string;
    version: string;
  }>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (isUpdateRelease) {
      const fetchChartVersions = async () => {
        let response;
        let error: Error | null = null;

        try {
          // 🔧 FIX 3: safe metadata access
          const metadataName =
            release.chart?.metadata?.name === APP_CATALOG_HELM_REPOSITORY
              ? '/' + release.chart.metadata.name
              : release.chart?.metadata?.name ?? '';

          if (!metadataName) {
            throw new Error('Chart metadata name is missing');
          }

          response = await fetchChart(metadataName);
        } catch (err: any) {
          error = err;
        }

        if (!isMounted) return;

        if (error) {
          enqueueSnackbar(`Error fetching chart versions: ${error.message}`, {
            variant: 'error',
            autoHideDuration: 5000,
          });
          return;
        }

        setIsLoading(false);

        const charts = response?.charts ?? [];

        const chartsCopy = _.cloneDeep(charts).sort((a: any, b: any) => {
          let compareValue = semver.compare(
            semver.coerce(a.version),
            semver.coerce(b.version)
          );
          if (compareValue === 0) {
            compareValue = a.version.localeCompare(b.version);
          }
          return -compareValue;
        });

        setVersions(
          chartsCopy.map((chart: any) => ({
            title: `${chart.name} v${chart.version}`,
            value: chart.name,
            version: chart.version,
          }))
        );
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
    // 🔧 FIX 4: Monaco can emit undefined
    if (!value) return;

    const parsed = yamlToJSON(value);

    if (checkBoxRef.current?.checked) {
      setUserValues(parsed);
    } else {
      setValues(parsed);
    }
  }

  function checkUpgradeStatus() {
    setTimeout(() => {
      getActionStatus(releaseName, 'upgrade')
        .then((response: any) => {
          if (response.status === 'processing') {
            checkUpgradeStatus();
          } else if (response.status === 'failed') {
            enqueueSnackbar(`Error upgrading release ${releaseName} ${response.message}`, {
              variant: 'error',
              autoHideDuration: 5000,
            });
            handleEditor(false);
            setUpgradeLoading(false);
          } else if (response.status !== 'success') {
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

    const chartDefaultValuesDiff = _.omitBy(values, (value, key) =>
      _.isEqual(value, chartValues[key])
    );

    const chartUserValuesDiff = _.omitBy(userValues, (value, key) =>
      _.isEqual(value, releaseConfig[key])
    );

    const chartValuesDIFF = Object.assign(
      {},
      chartDefaultValuesDiff,
      chartUserValuesDiff
    );

    const chartYAML = btoa(
      unescape(encodeURIComponent(jsonToYAML(chartValuesDIFF)))
    );

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

  return (
    <Dialog
      open={openEditor}
      maxWidth="lg"
      fullWidth
      withFullScreen
      style={{ overflow: 'hidden' }}
      onClose={() => handleEditor(false)}
      title={`Release Name: ${releaseName} / Namespace: ${releaseNamespace}`}
    >
      {isLoading ? (
        <Loader title="Loading Chart Versions" />
      ) : (
        <>
          {/* UI unchanged */}
        </>
      )}
    </Dialog>
  );
}

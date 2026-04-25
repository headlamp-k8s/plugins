import { Icon } from '@iconify/react';
import { ApiError, apply } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { Loader, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ResourceClasses } from '@kinvolk/headlamp-plugin/lib/k8s';
import { KubeJob } from '@kinvolk/headlamp-plugin/lib/lib/k8s/job';
import Pod from '@kinvolk/headlamp-plugin/lib/lib/k8s/pod';
import MonacoEditor from '@monaco-editor/react';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import React from 'react';
import { getKomposeOutput, komposeNamespace, komposePod } from './kompose';

export function KomposeUI() {
  const [composeYAML, setComposeYAML] = React.useState('');
  const [komposeOutput, setKomposeOutput] = React.useState('');
  const [progressStatus, setProgressStatus] = React.useState('');
  const [error, setError] = React.useState(false);
  // We use an object instead of a string because we want the connected effect to rerender every time
  // the value is set.
  const [composeYAMLToConvert, setComposeYAMLToConvert] = React.useState<{ yaml: string }>({
    yaml: '',
  });
  const [step, setStep] = React.useState(0);
  const theme = useTheme();

  React.useEffect(() => {
    let cancel = null;
    let cancelled = false;
    async function runKompose() {
      // TODO: Fix status field in KubeJob to be optional
      const job = new ResourceClasses.Job(komposePod(composeYAMLToConvert.yaml) as any as KubeJob);
      setError(false);
      setProgressStatus('Creating namespace (if needed)…');

      // Create namespace
      try {
        await apply({
          apiVersion: 'v1',
          kind: 'Namespace',
          metadata: {
            name: komposeNamespace,
          },
        } as any); // We need this any till Headlamp's apply is not as restrictive.
      } catch (e) {
        if (e.status !== 409) {
          console.error('PluginError:Kompose: creating namespace', e);
          setProgressStatus(`Error creating namespace: ${e.message}`);
          setError(true);
          return;
        }
      }

      if (cancelled) {
        return;
      }

      setProgressStatus('Creating Kompose job…');

      // Create pod
      try {
        await apply(job.jsonData);
      } catch (e) {
        console.error('PluginError:Kompose: creating job', e);
        setProgressStatus(`Error creating job: ${e.message}`);
        setError(true);
        return;
      }

      if (cancelled) {
        return;
      }

      setProgressStatus('Done. Getting Kompose output…');

      const queryData = {
        namespace: job.getNamespace(),
        labelSelector: `job-name=${job.getName()}`,
      };

      cancel = ResourceClasses.Pod.apiList(
        (pods: Pod[]) => {
          if (pods.length === 0 || cancelled) {
            return;
          }

          const pod = pods[0];

          const container = pod.spec.containers[0];
          pod.getLogs(
            container.name,
            ({ logs }) => {
              if (cancelled) {
                return;
              }

              const jointLogs = (logs || []).join('');
              if (jointLogs) {
                const output = getKomposeOutput(jointLogs);
                if (output.isError) {
                  setError(true);
                  setProgressStatus(`Error: ${output.data}`);
                } else if (!!output.data) {
                  setKomposeOutput(output.data);
                  setError(false);
                  setProgressStatus('');
                  setStep(2);
                }
              }
            },
            {
              tailLines: -1,
              follow: false,
            }
          );
        },
        (err: ApiError) => {
          console.error('PluginError:Kompose: fetching pods', err);
          setProgressStatus(`Error: ${err.message}`);
          setError(true);
        },
        {
          queryParams: queryData,
        }
      )();
    }

    if (composeYAMLToConvert.yaml) {
      runKompose();
    }
    return () => {
      cancelled = true;

      if (!!cancel) {
        cancel.then(c => c());
      }
    };
  }, [composeYAMLToConvert]);

  const stepsRenderer = React.useCallback(() => {
    if (step === 0) {
      return (
        <Box>
          <MonacoEditor
            value={composeYAML}
            onChange={contents => {
              setComposeYAML(contents);
            }}
            language={'yaml'}
            height="500px"
            options={{
              selectOnLineNumbers: true,
            }}
            theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'light'}
          />
        </Box>
      );
    }

    if (step === 1) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 2,
          }}
        >
          {!error ? (
            <>
              <Loader title="Loading Kompose job" />
              <Button
                onClick={() => {
                  setComposeYAMLToConvert({ yaml: '' });
                  setError(false);
                  setStep(0);
                }}
                startIcon={<Icon icon="mdi:stop" width={20} />}
                size="small"
                variant="outlined"
              >
                Stop
              </Button>
            </>
          ) : (
            <Button
              onClick={() => {
                setProgressStatus('');
                setComposeYAMLToConvert({ yaml: composeYAML });
                setError(false);
              }}
              startIcon={<Icon icon="mdi:refresh" width={20} />}
              variant="outlined"
              size="small"
            >
              Retry
            </Button>
          )}
          <Typography variant="body1" color={error ? 'error' : undefined} sx={{ paddingTop: 2 }}>
            {progressStatus}
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        <MonacoEditor
          value={komposeOutput}
          language={'yaml'}
          height="500px"
          options={{
            selectOnLineNumbers: true,
          }}
          theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'light'}
        />
      </Box>
    );
  }, [theme, komposeOutput, step, progressStatus, error]);

  return (
    <SectionBox title="Kompose (beta)" paddingTop={2}>
      <Box>
        <Typography variant="body1">
          Kompose is a tool to help users who are familiar with docker-compose move to Kubernetes.
        </Typography>
        <Typography variant="body1">
          This Headlamp tool will use Kompose via a Kubernetes Job in your cluster, in a{' '}
          <em>headlamp-tools</em> namespace. It will be created if it doesn't exist (so make sure
          your role allows this). Notice that files with build instructions are not supported.
        </Typography>
        <Box sx={{ padding: 2, marginX: 4 }}>
          <Stepper activeStep={step}>
            <Step>
              <StepLabel>docker-compose YAML</StepLabel>
            </Step>
            <Step>
              <StepLabel>Convert</StepLabel>
            </Step>
            <Step>
              <StepLabel>Kubernetes YAML</StepLabel>
            </Step>
          </Stepper>
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Box>
              <Button
                onClick={() => {
                  setStep(0);
                  setComposeYAMLToConvert({ yaml: '' });
                }}
                disabled={step === 0}
              >
                Restart
              </Button>
            </Box>
            <Box sx={{ flex: '1 1 auto' }} />
            <Box>
              {step !== 2 ? (
                <Button
                  onClick={() => {
                    // @todo: We should validate the YAML before we enable this button
                    setComposeYAMLToConvert({ yaml: composeYAML });
                    setStep(step + 1);
                  }}
                  color="primary"
                  variant="contained"
                  disabled={step > 0 || !composeYAML}
                >
                  Convert
                </Button>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(komposeOutput);
                    }}
                    startIcon={<Icon icon="mdi:content-copy" width={20} />}
                  >
                    Copy
                  </Button>
                  <Button
                    onClick={() => {
                      const blob = new Blob([komposeOutput], { type: 'text/yaml' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'k8s-kompose.yml';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    startIcon={<Icon icon="mdi:download" width={20} />}
                    variant="contained"
                  >
                    Download
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
        <Box sx={{ padding: 1 }}>{stepsRenderer()}</Box>
      </Box>
    </SectionBox>
  );
}

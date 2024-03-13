import * as yaml from 'js-yaml';
import {
  AppBarActionsProcessorArgs,
  DefaultAppBarAction,
  K8s,
  registerAppBarAction,
  registerPluginSettings,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import {
  ResourceClasses
} from '@kinvolk/headlamp-plugin/lib/K8s';
import MonacoEditor from '@monaco-editor/react';
import { Loader, NameValueTable, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { ApiError, apply } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import React from 'react';
import Pod from '@kinvolk/headlamp-plugin/lib/lib/k8s/pod';
import { Icon } from '@iconify/react';

const ns = 'headlamp-tools';
const generateName = () => {
  return 'kompose-' + Math.random().toString(36).substring(7);
}

const komposePod = (composeBase64:string, komposeImage: string = '') => {
  return {
    kind: 'Job',
    apiVersion: 'batch/v1',
    metadata: {
      name: generateName(),
      namespace: ns,
    },
    spec: {
      activeDeadlineSeconds: 120,
      template: {
        spec: {
          restartPolicy: 'Never',
          terminationGracePeriodSeconds: 30,
          tolerations: [
            {
              operator: 'Exists',
            },
          ],
          containers: [
            {
              name: 'kompose',
              image: komposeImage || 'femtopixel/kompose',
              command: ['sh', '-c'],
              args: [`echo "${btoa(composeBase64)}" | base64 -d | kompose convert -o /k8s-kompose.yml -f - 2> /k8s-kompose-error.yml && cat /k8s-kompose.yml && echo KOMPOSE_OUTPUT=$(base64 /k8s-kompose.yml) || echo KOMPOSE_ERROR=$(cat /k8s-kompose-error.yml)__ENDERROR__`],
            },
          ],
        },
      },
    },
  };
};

function KomposeUI() {
  const [composeYAML, setComposeYAML] = React.useState('');
  const [komposeOutput, setKomposeOutput] = React.useState('');
  const [progressStatus, setProgressStatus] = React.useState('');
  const [error, setError] = React.useState(false);
  const themeName = 'light';
  const [composeYAMLToConvert, setComposeYAMLToConvert] = React.useState('');
  const [step, setStep] = React.useState(0);

  function getKomposeOuput(logs: string) {
    const output = {
      data: '',
      isError: false,
    };

    const errorMatch = logs.match(/KOMPOSE_ERROR=(.+)__ENDERROR__/g);
    if (!!errorMatch) {
      output.isError = true;
      output.data = errorMatch[0].slice('KOMPOSE_ERROR='.length, -('__ENDERROR__'.length));
      return output;
    }

    const match = logs.match(/KOMPOSE_OUTPUT=(.*)==/g);

    if (!!match) {
      const komposeYAML = atob(match[0].slice('KOMPOSE_OUTPUT='.length).replaceAll(' ', '\n'))
      output.data = komposeYAML;
    }

    return output;
  }

  React.useEffect(() => {
    let cancel = null;
    let cancelled = false;
    async function runKompose() {
      const job = new ResourceClasses.Job(komposePod(composeYAMLToConvert));
      setError(false);
      setProgressStatus('Creating namespace (if needed)…')

      // Create namespace
      await apply({
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: {
          name: ns,
        },
      } as any);

      if (cancelled) {
        return;
      }

      setProgressStatus('Creating Kompose job…')

      // Create pod
      await apply(job.jsonData);

      if (cancelled) {
        return;
      }

      setProgressStatus('Done. Getting Kompose ouput…')

      const queryData = {
        namespace: job.getNamespace(),
        labelSelector: `job-name=${job.getName()}`,
      };

      cancel = ResourceClasses.Pod.apiList((pods: Pod[]) => {
        if (pods.length === 0 || cancelled) {
          return;
        }

        const pod = pods[0];
        const container = pod.spec.containers[0];
        pod.getLogs(container.name, (logs: string[]) => {
          if (cancelled) {
            return;
          }

          const jointLogs = (logs || []).join('')
          if (jointLogs) {
            const output = getKomposeOuput(jointLogs);
            if (output.isError) {
              setError(true);
              setProgressStatus(`Error: ${output.data}`);
            } else if (!!output.data) {
              setKomposeOutput(output.data);
              setError(false);
              setProgressStatus('')
              setStep(2);
            }
          }
        },
        {
          tailLines: 100,
          follow: false,
        });
      },
      (err: ApiError) => {
        console.error('PluginError:Kompose: fetching pods', err);
        setProgressStatus(`Error: ${err.message}`);
        setError(true);
      },
      {
        queryParams: queryData
      })();
    }

    if (composeYAMLToConvert) {
      runKompose();
    }
    return () => {
      cancelled = true;

      if (!!cancel) {
        cancel.then(c => c());
      }
    }
  },
  [composeYAMLToConvert]);

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
            theme={themeName === 'dark' ? 'vs-dark' : 'light'}
          />
        </Box>
      )
    }

    if (step === 1) {
      return (
        <Box sx={
          {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 2,
          }
        }>
          {!error ?
            <>
              <Loader />
              <Button
                onClick={() => {
                  setComposeYAMLToConvert('');
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
          :
            <Button
              onClick={() => {
                // @todo: The retry is not working apparently
                setProgressStatus('');
                setComposeYAMLToConvert(composeYAML);
                setError(false);
              }}
              startIcon={<Icon icon="mdi:refresh" width={20} />}
              variant="outlined"
              size="small"
            >
              Retry
            </Button>
          }
          <Typography variant="body1" color={error ? 'error' : undefined} sx={{paddingTop: 2}}>
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
          theme={themeName === 'dark' ? 'vs-dark' : 'light'}
        />
      </Box>
    );
  }, [themeName, komposeOutput, step, progressStatus, error]);

  return (
    <SectionBox title="Kompose (beta)" paddingTop={2}>
      <Box>
        <Typography variant="body1">
          Kompose is a tool to help users who are familiar with docker-compose move to Kubernetes.
        </Typography>
        <Typography variant="body1">
          This Headlamp tool will use Kompose via a Kubernetes Job in your cluster, in a <em>headlamp-tools</em> namespace. It will be created if it doesn't exist.
        </Typography>
        <Box sx={{padding: 2, marginX: 4 }}>
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
                  setComposeYAMLToConvert('');
                }}
                disabled={step === 0}
              >
                Restart
              </Button>
            </Box>
            <Box sx={{ flex: '1 1 auto' }} />
            <Box>
              { step !== 2 ?
                <Button
                  onClick={() => {
                    // @todo: We should validate the YAML before we enable this button
                    setComposeYAMLToConvert(composeYAML);
                    setStep(step + 1);
                  }}
                  color="primary"
                  variant="contained"
                  disabled={step > 0 || !composeYAML}
                >
                  Convert
                </Button>
              :
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
              }
            </Box>
          </Box>
        </Box>
        <Box sx={{padding: 1 }}>
          {stepsRenderer()}
        </Box>
      </Box>
    </SectionBox>
  );
}

// registerAppBarAction(KomposeUI);
registerSidebarEntry({
  parent: null,
  name: 'kompose',
  label: 'Kompose',
  url: '/kompose',
  icon: 'mdi:lead-pencil',
});

registerRoute({
  path: '/kompose',
  sidebar: 'kompose',
  name: 'kompose',
  exact: true,
  component: () => {
    return <KomposeUI />;
  }
});

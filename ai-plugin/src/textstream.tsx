import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import MonacoEditor, { DiffEditor } from '@monaco-editor/react';
import * as jsYaml from 'js-yaml';
import { useSnackbar } from 'notistack';
import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { apply } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { ConfirmDialog, Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import { Prompt } from './ai/manager';

interface TextStreamContainerProps {
  history: Prompt[];
  isLoading: boolean;
  context: string;
  apiError: string;
  callback: () => void;
}

const TextStreamContainer = (props: TextStreamContainerProps) => {
  const { history, callback, isLoading, context, apiError } = props;

  // if (history.length === 0 && isLoading) {
  //   return <Loader title="" />;
  // }

  return (
    <Box
      sx={{
        overflow: 'auto',
        height: '100%',
      }}
    >
      {console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>HHHH', history)}
      {history.map(({ content, role }) => (
        <>
          <Box sx={{
              borderRadius: "10px",
              padding: "10px",
              margin: "10px",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
              wordBreak: 'break-word',
              marginRight: role === 'user' ? undefined : 4,
              marginLeft: role !== 'user' ? undefined : 4,
          }}>
            <Typography variant="body2" color="textPrimary" sx={{ fontWeight: 'bold' }}>{role === 'assistant' ? 'AI Assistant' : 'You'}</Typography>
            <TextStream incomingText={content} callback={() => {}} />
          </Box>
          <Divider />
        </>
      ))}
      {apiError && <Alert severity="error">{apiError}</Alert>}
      {isLoading && <Loader title="" />}
    </Box>
  );
};

const TextStream = (props) => {
  const { incomingText, callback } = props;
  const messageContainerRef = useRef(null);
  const [yaml, setYaml] = useState('');
  const themeName = localStorage.getItem('headlampThemePreference');
  const { enqueueSnackbar } = useSnackbar();
  const [openAlert, setOpenAlert] = useState(false);
  // Scroll to the latest message when new messages arrive
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }

    const regex = /```([^```]+)```/g;
    const matches = incomingText.match(regex);
    if (matches) {
      const extractedStrings = matches.map(match => match.match(/```([^```]+)```/)[1]);
      setYaml(extractedStrings[0]);
    } else {
      console.log('No matches found.');
    }
  }, [incomingText]);

  return (
    <Box
      className={`text-stream-message`}
    >
      <ReactMarkdown>{incomingText.replace(/```[^`]+```/g, '')}</ReactMarkdown>
      {yaml !== '' && (
        <>
          <MonacoEditor
            value={yaml}
            onChange={value => {
              if (!value) {
                return;
              }
              setYaml(value);
            }}
            language="yaml"
            height="500px"
            options={{
              selectOnLineNumbers: true,
            }}
            theme={themeName === 'dark' ? 'vs-dark' : 'light'}
          />
          <Box mt={1} textAlign="right">
            <Button
              onClick={() => {
                setOpenAlert(true);
              }}
            >
              Apply
            </Button>
            <ConfirmDialog
              open={openAlert}
              title={'Apply resource'}
              description={
                'Are you sure you want to apply this resource? Please verify as this is an AI generated yaml, make sure you know what you are doing here'
              }
              handleClose={() => setOpenAlert(false)}
              onConfirm={() => {
                console.log(jsYaml.load(yaml));
                const resource = jsYaml.load(yaml);
                apply(resource as KubeObjectInterface)
                  .then(() => {
                    enqueueSnackbar(`Resource applied successfully`, { variant: 'success' });
                    callback();
                  })
                  .catch(err => {
                    enqueueSnackbar(`Error applying resource: ${err}`, { variant: 'error' });
                  });
              }}
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default TextStreamContainer;

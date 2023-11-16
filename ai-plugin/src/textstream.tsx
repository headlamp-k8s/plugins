import { useState, useEffect, useRef } from 'react';
import { Typography, Box, Button } from '@material-ui/core';
import ReactMarkdown from 'react-markdown';
import MonacoEditor from '@monaco-editor/react';
import * as jsYaml from 'js-yaml';
import './TextStream.css'; // Import the CSS file
import { useSnackbar } from 'notistack';
import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { apply }  from '@kinvolk/headlamp-plugin/lib/ApiProxy';

const TextStream = ({ incomingText, callback }) => {
  const messageContainerRef = useRef(null);
  const [yaml, setYaml] = useState('');
  const themeName = localStorage.getItem('headlampThemePreference');
  const { enqueueSnackbar } = useSnackbar();

  // Scroll to the latest message when new messages arrive
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }

  const regex = /```([^```]+)```/g;
  const matches = incomingText.match(regex);

if (matches) {
  const extractedStrings = matches.map(match => match.match(/```([^```]+)```/)[1]);
  console.log(extractedStrings);
  setYaml(extractedStrings[0]);
} else {
  console.log('No matches found.');
}
  }, [incomingText]);

  console.log("incomingText", incomingText)
  return (
    <div className="text-stream-container">
      <Box className={`text-stream-message`}>
      <ReactMarkdown>
          {incomingText.replace(/```[^`]+```/g, '')}
      </ReactMarkdown>
       { yaml !== "" && <>
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
            <Button variant="outlined" onClick={() => {
                console.log(jsYaml.load(yaml))
                const resource = jsYaml.load(yaml);
                apply(resource as KubeObjectInterface).then(() => {
                    enqueueSnackbar(`Resource applied successfully`, { variant: 'success' });
                    callback();
                }).catch((err) => {
                    enqueueSnackbar(`Error applying resource: ${err}`, { variant: 'error'});
                });
            }}>
                Apply
            </Button>
            </Box>
        </>
        }
            
      </Box>
    </div>
  );
};

export default TextStream;

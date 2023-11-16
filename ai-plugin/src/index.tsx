import { registerDetailsViewHeaderAction, K8s } from '@kinvolk/headlamp-plugin/lib';
import { FormControl, InputLabel, InputAdornment, OutlinedInput, Button, Box, Chip } from '@material-ui/core';
import { config } from './config';
import { ActionButton, Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Icon } from '@iconify/react';

// Below are some imports you may want to use.
//   See README.md for links to plugin development documentation.
// import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
// import { K8s } from '@kinvolk/headlamp-plugin/lib/K8s';
// import { Typography } from '@material-ui/core';

import { OpenAIClient, AzureKeyCredential } from  "@azure/openai";
import { prompt } from './config/prompt';
import React from 'react';
import TextStream from './textstream';
import AIModal from './modal';

const client = new OpenAIClient(
  `https://${config.openApiName}.openai.azure.com/`, 
  new AzureKeyCredential(config.openApiKey)
);

function DeploymentAIPrompt(props) {
    const item = props.item;
    const [openPopup, setOpenPopup] = React.useState(false);
    const [textStream, setTextStream] = React.useState('');
    const [promptVal, setPromptVal] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    let availablePormpts = [];
  
    if(!item) {
        return null
    }

    availablePormpts = [
      "Explain",
      "Look for issues",
      "Analyze",
      "Check",
    ]
    if (item && item.kind === "Deployment") {
      availablePormpts.push("Scale if cpu usage goes up by 40%")
    } 
    function handleChange(event) {
        setPromptVal(event.target.value);
    }

    async function AnalyzeResourceBasedOnPrompt() {
        setOpenPopup(true);
        const events = client.listChatCompletions("gpt-35-turbo", [{ role: "user", content: `${prompt.deployment_metric} ${JSON.stringify(item.jsonData)}${promptVal}
        ` }])
        let stream = '';
        try {
        for await (const event of events) {
            for (const choice of event.choices) {
              const delta = choice.delta?.content;
            //  console.log(delta) 
              if (delta !== undefined) {
                stream += delta;
              }
            }
         
        }
    } finally {
        setLoading(false);
    }
        setTextStream(stream);
    }

    return <>
    <AIModal openPopup={openPopup} setOpenPopup={setOpenPopup} title="AI Analysis" backdropClickCallback={() => setTextStream('')}> 
    {
        <Box display="flex" mb={2} flexWrap="wrap" direction="column">
          {
        availablePormpts.map((prompt) => {
            return <Box m={1}>
              <Chip label={prompt.substring(0, 30)} onClick={() => {
                setPromptVal(prompt);
            }}
            />
            </Box>
        })}
        </Box>
      }
    <FormControl fullWidth variant="outlined">
      
          <InputLabel htmlFor="deployment-ai-prompt">Enter your prompt here</InputLabel>
          <OutlinedInput
            id="deployment-ai-prompt"
            onChange={handleChange}
            labelWidth={160}
            value={promptVal}
            endAdornment={
              <InputAdornment position="end">
                <ActionButton
                  icon="mdi:close"
                  description="Clear"
                  onClick={() => {
                    setPromptVal('');
                  }}
                />
              </InputAdornment>
            }
          />
          <Box mt={1}>
          <Button variant="outlined" onClick={() => {
            setLoading(true);
            AnalyzeResourceBasedOnPrompt()
          }}>Check</Button>
          </Box>
    </FormControl>

     {
        loading ? <Loader /> : textStream !== "" && <TextStream incomingText={textStream} callback={() => {
            setOpenPopup(false);
        }}/>
     }
    </AIModal>
    <ActionButton icon="mdi:brain" description='AI Analysis' onClick={() => {
        setOpenPopup(true);
    }}/></>

}

function AnalyzePod(props) {
    const item = props.item;
    
    if(!item) {
        return null
    }

    if(item.kind !== "Pod") {
        return null
    }


    const [textStream, setTextStream] = React.useState('');
    const [openPopup, setOpenPopup] = React.useState(false);

    async function analyzePod() {
            setOpenPopup(true);
            const events = client.listChatCompletions("gpt-35-turbo", [{ role: "user", content: `${prompt.pod_error}${JSON.stringify(item.jsonData)}
            ` }])
            let stream = ""
            for await (const event of events) {
                for (const choice of event.choices) {
                  const delta = choice.delta?.content;
                  console.log(delta)
                  if (delta !== undefined) {
                    //setTextStream(delta);
                    stream += delta;
                  }
                }
             
            }
            setTextStream(stream);
    }

    return item && <>
     <AIModal openPopup={openPopup} setOpenPopup={setOpenPopup} title="Pod Error Analyzer"> {
        textStream === "" ? <Loader /> : <TextStream incomingText={textStream} callback={() => {
          setOpenPopup(false);
        }}/>}</AIModal> 
    {<ActionButton icon={"mdi:sine-wave"} description='Analyze' onClick={() => {
        analyzePod()
    }}/>
    }
     
    </>;
}

registerDetailsViewHeaderAction(AnalyzePod);

registerDetailsViewHeaderAction(DeploymentAIPrompt)
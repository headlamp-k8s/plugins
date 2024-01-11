import { registerAppBarAction, registerHeadlampEventCallback } from '@kinvolk/headlamp-plugin/lib';
import {
  FormControl,
  TextField,
  Button,
  Box,
  Paper,
  Popper,
  Backdrop,
  Tabs,
  Tab,
} from '@material-ui/core';
import { useTheme } from '@material-ui/styles';
import OpenAI from 'openai';
import { ActionButton, TabPanel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import AIPrompt from './modal';
import { useGlobalState } from './utils';


function DeploymentAIPrompt() {
  const [openPopup, setOpenPopup] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [openApiKey, setOpenApiKey] = React.useState('');
  const [openApiName, setOpenApiName] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isAzureOpenAI, setIsAzureOpenAI] = React.useState(false);
  const [error, setError] = React.useState(false);
  const theme = useTheme();

   React.useEffect(() => {
    const apiKey = localStorage.getItem('openApiKey');
    const apiName = localStorage.getItem('openApiName');
    if (apiKey) {
      setOpenApiKey(apiKey);
    }
    if (apiName) {
      setOpenApiName(apiName);
    }

    if(!apiKey && !apiName) {
      setIsSubmitting(false);
    } else {
      setIsSubmitting(true);
    }
  }, [])

  return !isSubmitting || error ? (
      <>
      <ActionButton
        icon="mdi:brain"
        description="AI Analysis"
        onClick={(event) => {
          setOpenPopup(true);
          setAnchorEl(event.currentTarget)
        }}
      />
      <Popper
        placement="bottom"
        anchorEl={anchorEl}
        disablePortal={false}
        open={openPopup}
        popperOptions={{
          style: {
            zIndex: 2000,
          },
          }
        }
        style={{
          zIndex: 2000,
        }}
      >
        <Paper>
        <Tabs value={Number(isAzureOpenAI)} onChange={(e, newValue) => {
          setIsAzureOpenAI(Boolean(newValue));
        }}>
          <Tab label="Azure Open AI" />
          {/* <Tab label="Open AI" /> */}
        </Tabs>
        <TabPanel tabIndex={Number(isAzureOpenAI)} index={0} id="Azure OpenAI" labeledBy='Azure OpenAI'>
        <Box p={1}>
            <Box m={2}>
            <FormControl fullWidth variant="outlined">
              <TextField
                label="azure open ai api key here"
                id="azure_open_ai_api_key"
                value={openApiKey}
                onChange={(event) => {
                  setOpenApiKey(event.target.value);
                }}
                required
                error={isSubmitting && !openApiKey}
                />
            </FormControl>
            </Box>
            <Box m={2}>
            <FormControl fullWidth variant="outlined">
              <TextField
                label="azure open ai api name here"
                id="azure_open_ai_api_name"
                value={openApiName}
                onChange={(event) => {
                  setOpenApiName(event.target.value);
                }}
                required
                error={isSubmitting && !openApiName}
                />
            </FormControl>
            </Box>
            <Box mt={2} ml={2}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                  if(openApiKey && openApiName) {
                    localStorage.setItem('openApiKey', openApiKey);
                    localStorage.setItem('openApiName', openApiName);
                    setError(false)
                  } else {
                    setError(true)
                  }
                  setIsSubmitting(true);
                }}
                disabled={loading}
                style={{
                  color: theme.palette.clusterChooser.button.color,
                  backgroundColor: theme.palette.clusterChooser.button.background,
                }}
              >
                Submit
              </Button>
            </Box>
            </Box>
            </TabPanel>
            {/* <TabPanel tabIndex={Number(isAzureOpenAI)} index={1} id="OpenAI" labeledBy='OpenAI'>
              <Box p={2}>
            <Box m={2}>
            <FormControl fullWidth variant="outlined">
              <TextField
                label="open ai api key here"
                id="open_ai_api_key"
                value={openApiKey}
                onChange={(event) => {
                  setOpenApiKey(event.target.value);
                }}
                required
                error={isSubmitting && !openApiKey}
                />
            </FormControl>
            </Box>
            <Box  ml={2}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                  if(openApiKey) {
                    localStorage.setItem('openApiKey', openApiKey);
                    setError(false)
                  } else {
                    setError(true)
                  }
                  setIsSubmitting(true);
                  
                }}
                disabled={loading}
                style={{
                  color: theme.palette.clusterChooser.button.color,
                  backgroundColor: theme.palette.clusterChooser.button.background,
                }}
              >
                Submit
              </Button>
            </Box>
            </Box>
            
            </TabPanel> */}
          </Paper>
        </Popper>
        <Backdrop open={openPopup} onClick={() => {
        setOpenPopup(false);
      }}>
        </Backdrop>
    </>) : (
       <>
       <ActionButton
       icon="mdi:brain"
       description="AI Analysis"
       color="secondary"
       onClick={(event) => {
         setOpenPopup((prev) => !prev);
         setAnchorEl(event.currentTarget)
       }}
     />
      <AIPrompt
        openPopup={openPopup}
        setOpenPopup={setOpenPopup}
        isAzureOpenAI={openApiKey && openApiName}
      />
     </>
    )
}


registerAppBarAction(DeploymentAIPrompt);



registerAppBarAction(() => {
  const _pluginState = useGlobalState();
  registerHeadlampEventCallback((event) => {
    if(event.type === "object-event") {
      _pluginState.setEvent({
        ..._pluginState.event,
        objectEvent: event.data
      })
    }
    if(event.type === "list-view-loaded") {
      const slashCount = location.pathname.split('/').length - 1
      if(slashCount <= 3) {
        _pluginState.setEvent({
          title: event.data.title || event.data.type,
          items: event.data.items
        })
      }
      
    } else if(event.type === "details-view-loaded"){
       _pluginState.setEvent({
        title: event.data.title,
        resource: event.data.resource,
        objectEvent: _pluginState?.event?.objectEvent
      })
    }
    return null
  })
  return null
})

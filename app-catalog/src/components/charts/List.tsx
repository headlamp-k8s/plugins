import { Icon } from '@iconify/react';
import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';
import {
  Link as RouterLink,
  Loader,
  SectionHeader,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Divider,
  Link,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Autocomplete, Pagination } from '@mui/material';
import { useEffect, useState } from 'react';
//import { jsonToYAML, yamlToJSON } from '../../helpers';
import { fetchChartsFromArtifact } from '../../api/charts';
import { AppCatalogTitle } from './AppCatalogTitle';
//import { createRelease } from '../../api/releases';
import { EditorDialog } from './EditorDialog';

interface AppCatalogConfig {
  /**
   * Show only verified packages. If set to false shows all the packages
   */
  showOnlyVerified: boolean;
}

export const store = new ConfigStore<AppCatalogConfig>('app-catalog');
const useStoreConfig = store.useConfig();

export const PAGE_OFFSET_COUNT_FOR_CHARTS = 9;

export function ChartsList({ fetchCharts = fetchChartsFromArtifact }) {
  const helmChartCategoryList = [
    { title: 'All', value: 0 },
    { title: 'AI / Machine learning', value: 1 },
    { title: 'Database', value: 2 },
    { title: 'Integration and delivery', value: 3 },
    { title: 'Monitoring and logging', value: 4 },
    { title: 'Networking', value: 5 },
    { title: 'Security', value: 6 },
    { title: 'Storage', value: 7 },
    { title: 'Streaming and messaging', value: 8 },
  ];
  const [charts, setCharts] = useState<any | null>(null);
  const [openEditor, setEditorOpen] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [chartsTotalCount, setChartsTotalCount] = useState(0);
  const [chartCategory, setChartCategory] = useState(helmChartCategoryList[0]);
  const [search, setSearch] = useState('');
  const [selectedChartForInstall, setSelectedChartForInstall] = useState<any | null>(null);

  // note: since we default to true for showOnlyVerified and the settings page is not accessible from anywhere else but the list comp
  // we must have the default value here and have it imported for use in the settings tab
  const config = useStoreConfig();
  const showOnlyVerified = config?.showOnlyVerified ?? true;

  // note: When the users changes the chartCategory or search, then we always go back to the first page
  useEffect(() => {
    setPage(1);
  }, [chartCategory, search]);

  // note: When the page changes, we fetch the charts, this will run as a reaction to the previous useEffect
  useEffect(
    function fetchChartsOnPageChange() {
      setCharts(null);

      store.set({ showOnlyVerified: showOnlyVerified });

      async function fetchData() {
        try {
          const response: any = await fetchCharts(search, showOnlyVerified, chartCategory, page);
          setCharts(response.dataResponse.packages);
          setChartsTotalCount(parseInt(response.total));
        } catch (err) {
          console.error('Error fetching charts', err);
          setCharts([]);
        }
      }

      fetchData();
    },
    [page, chartCategory, search, showOnlyVerified]
  );

  function Search() {
    return (
      <TextField
        style={{
          width: '20vw',
          margin: '0 1rem',
        }}
        id="outlined-basic"
        label="Search"
        value={search}
        // @todo: Find a better way to handle search autofocus
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        onChange={event => {
          setSearch(event.target.value);
        }}
      />
    );
  }

  function CategoryForCharts() {
    return (
      <Autocomplete
        style={{
          width: '20vw',
        }}
        options={helmChartCategoryList}
        getOptionLabel={option => option?.title ?? helmChartCategoryList[0].title}
        defaultValue={helmChartCategoryList[0]}
        value={chartCategory}
        onChange={(event, newValue) => {
          // @ts-ignore
          setChartCategory((oldValue) => {
            if ((newValue?.value ?? helmChartCategoryList[0].value) === oldValue.value) {
              return oldValue;
            }
            return newValue ?? helmChartCategoryList[0];
          });
        }}
        renderInput={params => {
          if (process.env.NODE_ENV === 'test') {
            // To keep the ids stable under test.
            params.id = params.id ? params.id.replace(/[0-9]/g, '') : params.id;
            params.inputProps.id = params.inputProps.id
              ? params.inputProps.id.replace(/[0-9]/g, '')
              : params.inputProps.id;
            params.InputLabelProps.id = params.InputLabelProps.id
              ? params.InputLabelProps.id.replace(/[0-9]/g, '')
              : params.InputLabelProps.id;
            // params.InputLabelProps.htmlFor = params.InputLabelProps.htmlFor
            //   ? params.InputLabelProps.htmlFor.replace(/[0-9]/g, '')
            //   : params.InputLabelProps.htmlFor;
          }
          return <TextField {...params} label="Categories" placeholder="Favorites" />;
        }}
      />
    );
  }

  return (
    <>
      <EditorDialog
        openEditor={openEditor}
        chart={selectedChartForInstall}
        handleEditor={(open: boolean) => setEditorOpen(open)}
      />
      <SectionHeader title={<AppCatalogTitle />} actions={[<Search />, <CategoryForCharts />]} />
      <Box display="flex" flexWrap="wrap" justifyContent="space-between" alignContent="start">
        {!charts ? (
          <Box
            style={{
              margin: '0 auto',
            }}
          >
            <Loader title="" />
          </Box>
        ) : charts.length === 0 ? (
          <Box mt={2} mx={2}>
            <Typography variant="h5" component="h2">
              {`No charts found for ${
                search ? `search term: ${search}` : `category: ${chartCategory.title}`
              }`}
            </Typography>
          </Box>
        ) : (
          <Box
            display="flex"
            m={1}
            justifyContent="center"
            flexWrap="wrap"
            sx={{
              flexDirection: {
                xs: 'column',
                sm: 'row',
              },
            }}
          >
            {charts.map(chart => {
              return (
                <Box
                  m={1}
                  sx={{
                    width: {
                      xs: '100%',
                      sm: '100%',
                      md: '30%',
                    },
                    maxWidth: {
                      xs: '100%',
                      sm: '100%',
                      md: '30%',
                    },
                  }}
                >
                  <Card>
                    <Box
                      height="60px"
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      marginTop="15px"
                    >
                      <CardMedia
                        image={`https://artifacthub.io/image/${chart.logo_image_id}`}
                        alt={`${chart.name} logo`}
                        style={{
                          width: '60px',
                          margin: '1rem',
                          alignSelf: 'flex-start',
                        }}
                        component="img"
                      />
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-around"
                        marginRight="10px"
                      >
                        {(chart.cncf || chart.repository.cncf) && (
                          <Tooltip title="CNCF Project">
                            <Icon
                              icon="simple-icons:cncf"
                              style={{
                                marginLeft: '0.5em',
                                fontSize: '20px',
                              }}
                            />
                          </Tooltip>
                        )}
                        {(chart.official || chart.repository.official) && (
                          <Tooltip title="Official Chart">
                            <Icon
                              icon="mdi:star-circle"
                              style={{
                                marginLeft: '0.5em',
                                fontSize: '22px',
                              }}
                            />
                          </Tooltip>
                        )}
                        {chart.repository.verified_publisher && (
                          <Tooltip title="Verified Publisher">
                            <Icon
                              icon="mdi:check-decagram"
                              style={{
                                marginLeft: '0.5em',
                                fontSize: '22px',
                              }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    <CardContent
                      style={{
                        margin: '1rem 0rem',
                        height: '25vh',
                        overflow: 'hidden',
                        paddingTop: 0,
                      }}
                    >
                      <Box
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Tooltip title={chart.name}>
                          <Typography component="h2" variant="h5">
                            <RouterLink
                              routeName="/helm/:repoName/charts/:chartName"
                              params={{
                                chartName: chart.name,
                                repoName: chart.repository.name,
                              }}
                            >
                              {chart.name}
                            </RouterLink>
                          </Typography>
                        </Tooltip>
                      </Box>
                      <Box display="flex" justifyContent="space-between" my={1}>
                        <Typography>v{chart.version}</Typography>
                        <Box
                          marginLeft={1}
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Tooltip title={chart?.repository?.name || ''}>
                            <Typography>{chart?.repository?.name || ''}</Typography>
                          </Tooltip>
                        </Box>
                      </Box>
                      <Divider />
                      <Box mt={1}>
                        <Typography>
                          {chart?.description?.slice(0, 100)}
                          {chart?.description?.length > 100 && (
                            <Tooltip title={chart?.description}>
                              <span>…</span>
                            </Tooltip>
                          )}
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions
                      style={{
                        justifyContent: 'space-between',
                        padding: '14px',
                      }}
                    >
                      <Button
                        style={{
                          backgroundColor: '#000',
                          color: 'white',
                          textTransform: 'none',
                        }}
                        onClick={() => {
                          setSelectedChartForInstall(chart);
                          setEditorOpen(true);
                        }}
                      >
                        Install
                      </Button>
                      <Link href={chart?.repository?.url} target="_blank">
                        Learn More
                      </Link>
                    </CardActions>
                  </Card>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
      {charts && charts.length !== 0 && (
        <Box mt={2} mx="auto" maxWidth="max-content">
          <Pagination
            size="large"
            shape="rounded"
            page={page}
            count={Math.ceil(chartsTotalCount / PAGE_OFFSET_COUNT_FOR_CHARTS)}
            color="primary"
            onChange={(e, page: number) => {
              setPage(page);
            }}
          />
        </Box>
      )}
      <Box textAlign="right">
        <Link href="https://artifacthub.io/" target="_blank">
          Powered by ArtifactHub
        </Link>
      </Box>
    </>
  );
}

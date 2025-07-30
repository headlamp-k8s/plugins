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
import { useEffect, useRef, useState } from 'react';
import { yamlToJSON } from '../../helpers';
import { fetchChartIcon, fetchChartsFromArtifact } from '../../api/charts';
import { AvailableComponentVersions } from '../../helpers/catalog';
//import { createRelease } from '../../api/releases';
import { EditorDialog } from './EditorDialog';
import { SettingsLink } from './SettingsLink';
//import * as global from "global";

interface AppCatalogConfig {
  /**
   * Show only verified packages. If set to false shows all the packages
   */
  showOnlyVerified: boolean;
}

export const store = new ConfigStore<AppCatalogConfig>('app-catalog');
const useStoreConfig = store.useConfig();

export const PAGE_OFFSET_COUNT_FOR_CHARTS = 9;

export const VANILLA_HELM_REPO = 'VANILLA_HELM_REPOSITORY';

export const COMMUNITY_REPO = 'COMMUNITY_REPOSITORY';

// Replace the token with the URL prefix to values.yaml for a component on ${CUSTOM_CHART_VALUES_PREFIX}/${packageID}/${packageVersion}/values.yaml
// This is used only for the catalog provided by a vanilla Helm repository.
// For the default behavior when this token is not replaced during deployment, please take a look at the global variable CHART_VALUES_PREFIX and its
// usage in src/api/catalogs.tsx
export const CUSTOM_CHART_VALUES_PREFIX = 'CUSTOM_CHART_VALUES_PREFIX';

// The name of the helm repository added before installing an application, while using vanilla helm repository
export const APP_CATALOG_HELM_REPOSITORY = 'app-catalog';

// Define a global variable to hold the available versions of the components in the catalog
declare global {
  var AVAILABLE_VERSIONS: Map<any, any[]>;
}


interface SearchProps {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
}

function Search({ search, setSearch }: SearchProps) {
  const [inputValue, setInputValue] = useState(search);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setSearch(inputValue);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inputValue, setSearch]);

  return (
    <TextField
      sx={{
        width: '20vw',
        margin: '0 1rem',
      }}
      id="outlined-basic"
      label="Search"
      value={inputValue}
      onChange={event => {
        setInputValue(event.target.value);
      }}
    />
  );
}

interface CategoryForChartsProps {
  helmChartCategoryList: { title: string; value: number }[];
  chartCategory: { title: string; value: number };
  setChartCategory: React.Dispatch<React.SetStateAction<{ title: string; value: number }>>;
}

function CategoryForCharts({
  helmChartCategoryList,
  chartCategory,
  setChartCategory,
}: CategoryForChartsProps) {
  return (
    <Autocomplete
      sx={{
        width: '20vw',
      }}
      options={helmChartCategoryList}
      getOptionLabel={option => option?.title ?? helmChartCategoryList[0].title}
      defaultValue={helmChartCategoryList[0]}
      value={chartCategory}
      onChange={(event, newValue) => {
        // @ts-ignore
        setChartCategory(oldValue => {
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
  const [iconUrls, setIconUrls] = useState<{ [url: string]: string }>({}); // New state for multiple icon URLs

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
      store.set({ showOnlyVerified: showOnlyVerified });

      async function fetchData() {
        try {
          const response = await fetchCharts(search, showOnlyVerified, chartCategory, page);
          const data = await response.dataResponse.text();
          const d=yamlToJSON(data);
          if (globalThis.CHART_PROFILE === VANILLA_HELM_REPO) {
            setCharts(d.entries);
            setChartsTotalCount(parseInt(response.total));
            // Capture available versions from the response and set AVAILABLE_VERSIONS
            globalThis.AVAILABLE_VERSIONS = AvailableComponentVersions(d.entries);
          } else {
            setCharts(d.packages);
            setChartsTotalCount(parseInt(response.total));
          }
        } catch (err) {
          console.error('Error fetching charts', err);
          setCharts([]);
        }
      }

      fetchData();
    },
    [page, chartCategory, search, showOnlyVerified]
  );

  useEffect(() => {
        if (charts && Object.keys(charts).length > 0) {
            const fetchIcons = async () => {
                try {
                    const iconUrls = {};
                    const iconPromises = Object.values(charts).flatMap(chartArray =>
                        chartArray.map(async chart => {
                            const iconURL = chart.icon ?? '';
                                if (iconURL === '') {
                                    return;
                                }
                                const isURL = (urlString) => {
                                    try {
                                        new URL(urlString);
                                        return true;
                                    } catch (e) {
                                        return false;
                                    }
                                };
                                if (isURL(iconURL)) {
                                    // may be an external icon URL, so, just use as is
                                    iconUrls[iconURL] = iconURL
                                } else {
                                    const p = await fetchChartIcon(iconURL)
                                        .then((response: any) =>  {
                                            const contentType = response.headers.get('Content-Type');
                                            if (contentType.includes('image/svg+xml') || contentType.includes('text/xml') || contentType.includes('text/plain')) {
                                                response.text()
                                                    .then((txt) =>
                                                        new Promise((resolve, reject) => {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => reader.result
                                                            reader.onerror = reject;
                                                            iconUrls[iconURL] = `data:image/svg+xml;utf8,${encodeURIComponent(txt)}`;
                                                        })
                                                    );
                                            } else if (contentType.includes('image/')) {
                                                response.blob()
                                                    .then((blob) =>
                                                        new Promise((resolve, reject) => {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => reader.result
                                                            reader.onerror = reject;
                                                            reader.readAsDataURL(blob);
                                                            iconUrls[iconURL] = URL.createObjectURL(blob);
                                                        })
                                                    );
                                            }
                                        })
                                        .catch(error => console.error("failed to fetch icon:", error))
                                }
                        })
                    );
                     await Promise.all(iconPromises);
                    setIconUrls(iconUrls);
                } catch (error) {
                    console.error("Error fetching icons:", error);
                }
            };
            fetchIcons();
        }
  }, [charts]);

  return (
    <>
      <EditorDialog
        openEditor={openEditor}
        chart={selectedChartForInstall}
        handleEditor={(open: boolean) => setEditorOpen(open)}
      />
      <SectionHeader
        title="Applications"
        titleSideActions={[<SettingsLink />]}
        actions={[
          <Search search={search} setSearch={setSearch} />,
          <CategoryForCharts
            helmChartCategoryList={helmChartCategoryList}
            chartCategory={chartCategory}
            setChartCategory={setChartCategory}
          />,
        ]}
      />
      <Box>
        {!charts ? (
          <Box
            sx={{
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
            sx={{
              flexWrap: 'wrap',
              flexDirection: { sm: 'column', md: 'row' },
            }}
          >
            {
                // Filter out the charts meeting the value entered for search field and display only the matching charts
                Object.keys(
                  Object.keys(charts)
                    .filter(key => key.match(search))
                    .reduce((obj, key) => {
                      return Object.assign(obj, {
                        [key]: charts[key],
                      });
                    }, {})
                ).map(chartName => {
                  // When a chart contains multiple versions, only display the first version
                  return charts[chartName].slice(0, 1).map(chart => {
                return (
                    <Card key={chart.icon}
                          sx={{
                            margin: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            boxShadow: '0px 0px 5px 0px rgba(0,0,0,0.5)',
                            width: {
                              md: '40%',
                              lg: '30%',
                            },
                          }}
                    >
                      <Box
                          height="60px"
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          marginTop="15px"
                      >
                        {globalThis.CHART_PROFILE === VANILLA_HELM_REPO ? (
                            iconUrls[chart.icon] && (
                                <CardMedia
                                    image={iconUrls[chart.icon]}
                                    alt={`${chart.name} logo`}
                                    sx={{
                                      width: '60px',
                                      height: '60px',
                                      margin: '1rem',
                                      alignSelf: 'flex-start',
                                      objectFit: 'contain',
                                    }}
                                    component="img"
                                />
                            )
                        ) : (
                            chart.logo_image_id && (
                                <CardMedia
                                    image={`https://artifacthub.io/image/${chart.logo_image_id}`}
                                    alt={`${chart.name} logo`}
                                    sx={{
                                      width: '60px',
                                      height: '60px',
                                      margin: '1rem',
                                      alignSelf: 'flex-start',
                                      objectFit: 'contain',
                                    }}
                                    component="img"
                                />
                            )
                        )}
                        <Box display="flex" alignItems="center" marginLeft="auto" marginRight="10px">
                          {(chart?.cncf || chart?.repository?.cncf) && (
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
                          {(chart?.official || chart?.repository?.official) && (
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
                          {chart?.repository?.verified_publisher && (
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
                          sx={{
                            margin: '1rem 0rem',
                            height: '10vh',
                            overflow: 'hidden',
                            paddingTop: 0,
                          }}
                      >
                        <Box
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                        >
                          <Tooltip title={chart.name}>
                            <Typography component="h2" variant="h5">
                                {/* TODO: The app-catalog using artifacthub.io loads the details about the chart with an option to install the chart
                                    Fix this for vanilla helm repo */}
                                {globalThis.CHART_PROFILE === VANILLA_HELM_REPO ? chart.name :
                                (
                                    <RouterLink
                                        routeName="/helm/:repoName/charts/:chartName"
                                        params={{
                                            chartName: chart.name,
                                            repoName: chart?.repository?.name,
                                        }}
                                    >
                                     {chart.name}
                                    </RouterLink>
                                )}

                            </Typography>
                          </Tooltip>
                        </Box>
                        <Box display="flex" justifyContent="space-between" my={1}>
                          {/* If the chart.version contains v prefix, remove it */}
                          {chart.version.startsWith('v') ? (
                              <Typography>{chart.version}</Typography>
                          ) : (
                              <Typography>v{chart.version}</Typography>
                          )}
                          <Box
                              marginLeft={1}
                              sx={{
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
                          sx={{
                            justifyContent: 'space-between',
                            padding: '14px',
                          }}
                      >
                        <Button
                            sx={{
                              backgroundColor: '#000',
                              color: 'white',
                              textTransform: 'none',
                              '&:hover': {
                                background: '#605e5c',
                              },
                            }}
                            onClick={() => {
                              setSelectedChartForInstall(chart);
                              setEditorOpen(true);
                            }}
                        >
                          Install
                        </Button>
                        {/*
                            Provide Learn More link only when the chart has source
                            When there are multiple sources for a chart, use the first source for the link, rather than using comma separated values
                    */}
                          {globalThis.CHART_PROFILE === VANILLA_HELM_REPO ? (
                              !chart?.sources ? (
                                  ''
                              ) : chart?.sources?.length === 1 ? (
                                  <Link href={chart?.sources} target="_blank">
                                      Learn More
                                  </Link>
                              ) : (
                                  <Link href={chart?.sources[0]} target="_blank">
                                      Learn More
                                  </Link>
                              )
                          ):(
                              <Link href={chart?.repository?.url} target="_blank">
                                  Learn More
                              </Link>
                          )}
                      </CardActions>
                    </Card>
                );
              });
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
      {globalThis.CHART_PROFILE !== VANILLA_HELM_REPO && (
          <Box textAlign="right">
              <Link href="https://artifacthub.io/" target="_blank">
                  Powered by ArtifactHub
              </Link>
          </Box>
      )}
    </>
  );
}

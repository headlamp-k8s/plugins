import { Router } from '@kinvolk/headlamp-plugin/lib';
import {
  Loader,
  NameValueTable,
  SectionBox,
  SectionHeader,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Button, Link, Table, TableCell, TableHead, TableRow } from '@mui/material';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useParams } from 'react-router';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import remarkGfm from 'remark-gfm';
import { fetchChartDetailFromArtifact } from '../../api/charts';
import { EditorDialog } from './EditorDialog';
import { VANILLA_HELM_REPO } from './List';

const { createRouteURL } = Router;
export default function ChartDetails() {
  const { chartName, repoName } = useParams<{ chartName: string; repoName: string }>();
  const [chart, setChart] = useState<{
    name: string;
    description: string;
    logo_image_id: string;
    readme: string;
    app_version: string;
    maintainers: Array<{ name: string; email: string }>;
    home_url: string;
    package_id: string;
    version: string;
  } | null>(null);
  const [openEditor, setOpenEditor] = useState(false);

  useEffect(() => {
    // Note: This path is not enabled for vanilla helm repo. Please check the following comment in charts/List.tsx
    // TODO: The app-catalog using artifacthub.io loads the details about the chart with an option to install the chart
    //
    // An API to get details about a particular chart is required to achieve this. For example, take a look at the response
    // from https://artifacthub.io/api/v1/packages/helm/grafana/grafana
    // Easiest thing is to fetch index.yaml, get the details for chartName and fill the details
    fetchChartDetailFromArtifact(chartName, repoName).then(response => {
      setChart(response);
    });
  }, [chartName, repoName]);

  return (
    <>
      <EditorDialog
        openEditor={openEditor}
        chart={chart}
        handleEditor={open => {
          setOpenEditor(open);
        }}
      />
      <SectionBox
        title={
          <SectionHeader
            title={chartName}
            actions={[
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
                  setOpenEditor(true);
                }}
              >
                Install
              </Button>,
            ]}
          />
        }
        backLink={createRouteURL('Charts')}
      >
        {!chart ? (
          <Loader title="" />
        ) : (
          <NameValueTable
            rows={[
              {
                name: 'Name',
                value: (
                  <Box display="flex" alignItems="center">
                    {chart.logo_image_id && (
                      <Box mr={1}>
                          {CHART_PROFILE === VANILLA_HELM_REPO ? (
                              <img src={`${chart?.icon || ''}`} width="25" height="25" alt={chart.name} />
                              ) : (
                              <img
                                  src={`https://artifacthub.io/image/${chart.logo_image_id}`}
                                  width="25"
                                  height="25"
                                  alt={chart.name}
                              />
                          )}
                      </Box>
                    )}
                    <Box>{chart.name}</Box>
                  </Box>
                ),
              },
              {
                name: 'Description',
                value: (
                  <Box overflow="auto" width="80%">
                    {chart.description}
                  </Box>
                ),
              },
              {
                name: 'App Version',
                value: chart.app_version,
              },
              {
                name: 'Repository',
                value: repoName,
              },
              {
                name: 'Maintainers',
                value: chart?.maintainers?.map(maintainer => (
                  <Box display="flex" alignItems="center" mt={1}>
                    <Box mr={1}>{maintainer.name}</Box>
                    <Box>{maintainer.email}</Box>
                  </Box>
                )),
              },
              {
                name: 'URL',
                value: (
                  <Link href={chart.home_url} target="_blank">
                    {chart.home_url}
                  </Link>
                ),
              },
            ]}
          />
        )}
      </SectionBox>
      <SectionBox title="Readme">
        {!chart ? (
          <Loader title="" />
        ) : (
          <ReactMarkdown
            style={{
              padding: '1rem',
            }}
            remarkPlugins={[remarkGfm]}
            children={chart.readme}
            components={{
              a: props => {
                return <Link {...props} target="_blank" />;
              },
              table: props => {
                return (
                  <Table
                    {...props}
                    size="small"
                    style={{
                      tableLayout: 'fixed',
                    }}
                  />
                );
              },
              thead: props => {
                return <TableHead {...props} />;
              },
              tr: props => {
                return <TableRow {...props} />;
              },
              td: props => {
                return <TableCell {...props} style={{ textAlign: 'center', overflow: 'hidden' }} />;
              },
              // eslint-disable-next-line
              pre: ({ inline, className, children, ...props }) => {
                return (
                  !inline && (
                    <pre {...props} className={className}>
                      <Box display="block" width="64vw" my={0.5}>
                        {children}
                      </Box>
                    </pre>
                  )
                );
              },
              // eslint-disable-next-line
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    children={String(children).replace(/\n$/, '')}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  />
                ) : (
                  <code
                    className={className}
                    {...props}
                    style={{
                      overflow: 'auto',
                      width: '10vw',
                      display: 'block',
                    }}
                  >
                    {children}
                  </code>
                );
              },
            }}
          />
        )}
      </SectionBox>
    </>
  );
}

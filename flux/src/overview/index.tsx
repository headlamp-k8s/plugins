import { Link, NameValueTable, SectionBox, StatusLabel, TileChart } from "@kinvolk/headlamp-plugin/lib/components/common";
import { Box, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import React, { useEffect } from "react";
import { apiFactory } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { Icon } from "@iconify/react";
import SourceLink from '../common/Link';
import { IMAGE_AUTOMATION_BETA_VERSION } from "../image-automation/ImageAutomationList";
import Table from '../common/Table';
import { getFluxVersion } from "../helpers";


export function FluxOverview() {
    const [pods] = K8s.ResourceClasses.Pod.useList();
    const helmController = pods?.filter(pod => pod.metadata.labels?.['app'] === 'helm-controller');
    const kustomizeController = pods?.filter(
      pod => pod.metadata.labels?.['app'] === 'kustomize-controller'
    );
    const notificationController = pods?.filter(
      pod => pod.metadata.labels?.['app'] === 'notification-controller'
    );
    const sourceController = pods?.filter(pod => pod.metadata.labels?.['app'] === 'source-controller');
    const imageReflectorController = pods?.filter(
      pod => pod.metadata.labels?.['app'] === 'image-reflector-controller'
    );
    const imageAutomationController = pods?.filter(
      pod => pod.metadata.labels?.['app'] === 'image-automation-controller'
    );
  
    const controllers = helmController?.concat(
      kustomizeController,
      notificationController,
      sourceController,
      imageReflectorController,
      imageAutomationController
    );
    const [kustomizations] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
        'kustomizations.kustomize.toolkit.fluxcd.io'
    );
    const [gitRepoCRD] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
        'gitrepositories.source.toolkit.fluxcd.io'
    );
    const [ociRepos] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
        'ocirepositories.source.toolkit.fluxcd.io'
    );
    const [bucketRepos] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
        'buckets.source.toolkit.fluxcd.io'
    );
    const [helmRepos] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
        'helmrepositories.source.toolkit.fluxcd.io'
    );
    const [helmCharts] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
        'helmcharts.source.toolkit.fluxcd.io'
    );

    const [alerts] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
        'alerts.notification.toolkit.fluxcd.io'
      );
    const [providers] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
        'providers.notification.toolkit.fluxcd.io'
    );
    const [receivers] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
        'receivers.notification.toolkit.fluxcd.io'
    );

    const CRD = K8s.ResourceClasses.CustomResourceDefinition;
      const isVersionAvailable = CRD.apiEndpoint.apiInfo.find(
        apiInfo => apiInfo.version === IMAGE_AUTOMATION_BETA_VERSION
      );
      if (!isVersionAvailable) {
        CRD.apiEndpoint = apiFactory(
          ...CRD.apiEndpoint.apiInfo.map(apiInfo => {
            const params = [];
            params.push(apiInfo.group);
            params.push(apiInfo.version);
            params.push(apiInfo.resource);
            return params;
          }),
          ['apiextensions.k8s.io', IMAGE_AUTOMATION_BETA_VERSION, 'customresourcedefinitions']
        );
    }

    const [imageRepository] = CRD.useGet('imagerepositories.image.toolkit.fluxcd.io');
    const [imageUpdateAutomation] = CRD.useGet('imageupdateautomations.image.toolkit.fluxcd.io');
  
    const kustomizationResourceClass = React.useMemo(() => {
        return kustomizations?.makeCRClass();
    }, [kustomizations]);
   
    const gitRepoResourceClass = React.useMemo(() => {
        return gitRepoCRD?.makeCRClass();
    }, [gitRepoCRD]);

    const ociRepoResourceClass = React.useMemo(() => {
        return ociRepos?.makeCRClass();
    }, [ociRepos]);

    const bucketRepoResourceClass = React.useMemo(() => {
        return bucketRepos?.makeCRClass();
    }, [bucketRepos]);

    const helmRepoResourceClass = React.useMemo(() => {
        return helmRepos?.makeCRClass();
    }, [helmRepos]);

    const helmChartResourceClass = React.useMemo(() => {
        return helmCharts?.makeCRClass();
    }, [helmCharts]);

    const imageRepositoryClass = React.useMemo(() => {
        return imageRepository?.makeCRClass();
    }, [imageRepository]);

    const imageUpdateAutomationClass = React.useMemo(() => {
        return imageUpdateAutomation?.makeCRClass();
    }, [imageUpdateAutomation]);

    const version = getFluxVersion([gitRepoCRD, ociRepos, bucketRepos, helmRepos, helmCharts, kustomizations, alerts, providers, receivers, imageRepository, imageUpdateAutomation]);
    return (
        <>
        <Box display="flex" justifyContent="space-between" sx={{
            flexWrap: 'wrap'
        }}>
            <Box width="300px" m={2}>
            { kustomizationResourceClass && <FluxOverviewChart resourceClass={kustomizationResourceClass} /> }
            </Box>
            <Box width="300px" m={2}>
            { gitRepoResourceClass && <FluxOverviewChart resourceClass={gitRepoResourceClass} /> }
            </Box>
            <Box width="300px" m={2}>
            { ociRepoResourceClass && <FluxOverviewChart resourceClass={ociRepoResourceClass} /> }
            </Box>
            <Box width="300px" m={2}>
            { bucketRepoResourceClass && <FluxOverviewChart resourceClass={bucketRepoResourceClass} /> }
            </Box>
            <Box width="300px" m={2}>
            { helmRepoResourceClass && <FluxOverviewChart resourceClass={helmRepoResourceClass} /> }
            </Box>
            <Box width="300px" m={2}>
            { helmChartResourceClass && <FluxOverviewChart resourceClass={helmChartResourceClass} /> }
            </Box>
            <Box width="300px" m={2}>
            { alerts && <FluxOverviewChart resourceClass={alerts.makeCRClass()} /> }
            </Box>
            <Box width="300px" m={2}>
            { providers && <FluxOverviewChart resourceClass={providers.makeCRClass()} /> }
            </Box>
            <Box width="300px" m={2}>
            { receivers && <FluxOverviewChart resourceClass={receivers.makeCRClass()} /> }
            </Box>
            <Box width="300px" m={2}>
            { imageRepositoryClass && <FluxOverviewChart resourceClass={imageRepositoryClass} /> }
            </Box>
            <Box width="300px" m={2}>
            { imageUpdateAutomationClass && <FluxOverviewChart resourceClass={imageUpdateAutomationClass} /> }
            </Box>
        
        </Box>
        <SectionBox title="Flux Checks">
        <Accordion>
            <AccordionSummary expandIcon={<Icon icon="mdi:chevron-down" />}>
                <Box p={2}>
                    Version Information
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Box p={2}>
                  {
                    version
                  }
                </Box>
            </AccordionDetails>
        </Accordion>
        <Accordion>
            <AccordionSummary expandIcon={<Icon icon="mdi:chevron-down" />}>
            <Box p={2}>
                <Box>
                Controllers
                </Box>
                {/* show status whether all controllers are ready or not */}
                {
                    controllers?.length > 0  && (controllers?.every(controller => controller.status?.phase === 'Running') ? <StatusLabel status="success">
                        <Box display="flex" aligItems="center">
                        <Box mt={0.2} mr={0.1}><Icon icon="mdi:check" width={16} height={16}/></Box>
                            All Controllers Ready</Box> </StatusLabel>
                            : <StatusLabel status="warning"><Box display="flex" aligItems="center"><Box mt={0.2} mr={0.1}><Icon icon="mdi:close" width={16} height={16}/></Box> Some Controllers Are Not Ready</Box></StatusLabel>)
                }
            </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Box p={2}>
                    <Controllers controllers={controllers} />
                </Box>
            </AccordionDetails>
        </Accordion>
        <Accordion>
            <AccordionSummary expandIcon={<Icon icon="mdi:chevron-down" />}>
               <Box p={2}>
                <Box>CRDs</Box>
                {/* see if all crds check passed */}
                {
                    [kustomizations, gitRepoCRD, ociRepos, bucketRepos, helmRepos, helmCharts, alerts, providers, receivers, imageRepository, imageUpdateAutomation].every(crd => {
                        if(!crd) return true;
                        const conditions = crd.status?.conditions || [];
                        // Check if any condition has  status "True"
                        const isSuccess = conditions.some(cond => cond.status === 'True');
                        return isSuccess;
                    }) ? <StatusLabel status="success">
                        <Box display="flex" aligItems="center">
                        <Box mt={0.2} mr={0.1}><Icon icon="mdi:check" width={16} height={16}/></Box>
                            All Checks Passed</Box> </StatusLabel>
                            : <StatusLabel status="warning"><Box display="flex" aligItems="center"><Box mt={0.2} mr={0.1}><Icon icon="mdi:close" width={16} height={16}/></Box> Some CRDs Are Not Ready</Box></StatusLabel>
                }
               </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Box p={2}>
                    <CRDs />
                </Box>
            </AccordionDetails>
        </Accordion>
        </SectionBox>
        </>
    );
}

function FluxOverviewChart({ resourceClass }) {
    const [crds, error] = resourceClass.useList();
    console.log(resourceClass)
    function prepareLink(name) {
        switch(name) {
            case 'gitrepositories':
                return '/flux/sources';
            case 'ocirepositories':
                return '/flux/sources';
            case 'buckets':
                return '/flux/sources';
            case 'helmrepositories':
                return '/flux/sources';
            case 'helmcharts':
                return '/flux/sources';
            case 'helmrepositories':
                return '/flux/sources';
            case 'kustomizations':
                return '/flux/kustomization';
            case 'alerts':
                return '/flux/notifications';
            case 'providers':
                return '/flux/notifications';
            case 'receivers':
                return '/flux/notifications';
            case 'imagerepositories':
                return '/flux/image-automations';
            case 'imageupdateautomations':
                return '/flux/image-automations';
        }

        return '';

    }

    function prepareName(name) {
        switch(name) {
            case 'gitrepositories':
                return 'Git Repositories';
            case 'ocirepositories':
                return 'OCI Repositories';
            case 'buckets':
                return 'Buckets';
            case 'helmrepositories':
                return 'Helm Repositories';
            case 'helmcharts':
                return 'Helm Charts';
            case 'kustomizations':
                return 'Kustomizations';
            case 'alerts':
                return 'Alerts';
            case 'providers':
                return 'Providers';
            case 'receivers':
                return 'Receivers';
            case 'imagerepositories':
                return 'Image Repositories';
            case 'imageupdateautomations':
                return 'Image Update Automations';
        }

        return '';
    }
    function makeData() {
        if(crds) {
            const total = crds.length;
            const success = crds.filter(crd => crd.status?.conditions?.some(condition => condition.type === 'Ready' && condition.status === 'True')).length;
            const failed = total - success;
            const suspended = crds.filter((crd) => crd.spec?.suspend).length;

            return [
                {
                    name: 'failed',
                    value: failed,
                    fill: '#DC7501'
                    
                },
                {
                    name: 'success',
                    value: success,
                    fill: '#FDE100'
                },
                {
                    name: 'suspended',
                    value: suspended,
                    fill: '#FDE100'
                }
            ];
        }
        return [];
    }

    function makeLegend() {
        if(crds) {
            const total = crds.length;
            const success = crds.filter(crd => crd.status?.conditions?.some(condition => condition.type === 'Ready' && condition.status === 'True')).length;
            const failed = total - success;

            const suspended = crds.filter((crd) => crd.spec?.suspend).length;
            return <Box>
                <Box >
                    <Box>
                         <Link
                                routeName={prepareLink(resourceClass.apiName)}
                              >
                                {prepareName(resourceClass.apiName)}
                        </Link>
                    </Box>
                    <Box>
                        {failed}/{total} failed
                    </Box>
                    <Box>
                        {success}/{total} running
                    </Box>
                </Box>
                <Box>
                    <Box>
                        {suspended}/{total} suspended
                    </Box>
                </Box>
            </Box>
        }

        return [];
    }

    function getLabel() {
        if(crds) {
            const total = crds.length;
            const success = crds.filter(crd => crd.status?.conditions?.some(condition => condition.type === 'Ready' && condition.status === 'True')).length;
            const percentage = success/total * 100;
            if(isNaN(percentage)) {
                return '0%';
            }
            return (percentage)+'%';
        }
        return '';
    }
    return (
        <TileChart data={makeData()} total={100} label={getLabel()} legend={makeLegend()}/>
    );
}

function Controllers({
    controllers
}) {
    return         <Table
              data={controllers}
              columns={[
                {
                  extends: 'name',
                  routeName: 'pod',
                },
                {
                  header: 'Namespace',
                  accessorKey: 'metadata.namespace',
                  Cell: ({ row: { original: item } }) => (
                    <Link routeName="namespace" params={{ name: item.metadata.namespace }}>
                      {item.metadata.namespace}
                    </Link>
                  ),
                },
                {
                  header: 'Status',
                  accessorFn: item => item?.status.phase,
                },
                {
                  header: 'Image',
                  accessorFn: item => <SourceLink url={item.spec.containers[0].image} />,
                },
              ]}
            />
}

function CRDs() {
    const [crds] = K8s.ResourceClasses.CustomResourceDefinition.useList();
    const [fluxCrds, setFluxCrds] = React.useState([]);
    useEffect(() => {
        if(crds) setFluxCrds(crds?.filter(crd => crd.metadata.name.includes('fluxcd.')));
    }, [crds])  

    const rows = React.useMemo(() => {
        return fluxCrds.map(crd => {
            return {
                name: <Link routeName={"crd"} params={{name: crd.metadata.name}}>
                    {crd.metadata.name}
                </Link>,
                value: crd?.status?.storedVersions.join(', ')
            }
        }
        )
    }, [fluxCrds])
    return (
        <>
        <NameValueTable rows={rows} />
        </>
    )
}
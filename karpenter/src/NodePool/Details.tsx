import {
  DetailsGrid,
  Link,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { getResourceStr } from '@kinvolk/headlamp-plugin/lib/Utils';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { EditConfigButton } from '../common/EditConfigButton';
import { DiffEditorDialog } from '../common/resourceEditor';
import { handleShowDiff } from '../helpers/handleDiff';
import { getHandleSaveHelper } from '../helpers/handleSave';
import { renderInstanceRequirements } from '../helpers/instanceRequirements';
import { parseRam } from '../helpers/parseRam';
import { renderDisruptionBudgets } from '../helpers/renderBudgets';
import { nodePoolClass } from './List';

export function NodePoolDetailView(props: { name?: string }) {
  const params = useParams<{ name: string }>();
  const { name = params.name } = props;
  const NodePoolClass = nodePoolClass();
  const [originalYaml, setOriginalYaml] = React.useState('');
  const [modifiedYaml, setModifiedYaml] = React.useState('');
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [currentResource, setCurrentResource] = React.useState<KubeObject | null>(null);
  const dispatch = useDispatch();
  const location = useLocation();

  const getHandleSave = React.useCallback(() => {
    if (!currentResource) {
      return () => console.error('No resource available for saving');
    }

    return getHandleSaveHelper({
      dispatch,
      currentResource,
      cancelUrl: location.pathname,
      closeDialog: () => setIsEditorOpen(false),
    });
  }, [currentResource, dispatch]);

  const actions = () => {
    return (item: KubeObject) =>
      item
        ? [
            {
              id: 'Nodepool-config-editor',
              action: (
                <>
                  <EditConfigButton
                    resource={item}
                    handleClick={() =>
                      handleShowDiff(
                        item,
                        setCurrentResource,
                        setOriginalYaml,
                        setModifiedYaml,
                        setIsEditorOpen
                      )
                    }
                  />
                  {isEditorOpen && currentResource && (
                    <DiffEditorDialog
                      open={isEditorOpen}
                      onClose={() => setIsEditorOpen(false)}
                      schema="Nodepool-schema"
                      originalYaml={originalYaml}
                      modifiedYaml={modifiedYaml}
                      onSave={getHandleSave()}
                      resource={currentResource}
                    />
                  )}
                </>
              ),
            },
          ]
        : [];
  };

  return (
    <>
      <DetailsGrid
        resourceType={NodePoolClass}
        name={name}
        withEvents
        actions={actions()}
        extraInfo={item => {
          const usedCPU = parseInt(item.jsonData.status?.resources?.cpu || '0');
          const CPUlimit = parseInt(item.jsonData.spec?.limits?.cpu || '0');

          const usedMemory = parseRam(item.jsonData.status?.resources?.memory || '0');
          const memoryLimit = parseRam(item.jsonData.spec?.limits?.memory || '0');

          return (
            item && [
              {
                name: 'CPU',
                value: `${usedCPU} ${CPUlimit > 0 ? `of ${CPUlimit}` : '(No limit set)'}`,
              },
              {
                name: 'Memory',
                value: `${getResourceStr(usedMemory, 'memory')} ${
                  memoryLimit > 0 ? `of ${getResourceStr(memoryLimit, 'memory')}` : '(No limit set)'
                }`,
              },
              {
                name: 'Nodes',
                value: item.jsonData.status?.resources?.nodes,
              },
              {
                name: 'Pods',
                value: item.jsonData.status?.resources?.pods,
              },
            ]
          );
        }}
        extraSections={item =>
          item && [
            {
              id: 'nodepool-disruption',
              section: (
                <SectionBox title="Disruption Settings">
                  <NameValueTable
                    rows={[
                      {
                        name: 'Consolidation Policy',
                        value: item.jsonData.spec?.disruption?.consolidationPolicy || '-',
                      },
                      {
                        name: 'Consolidate After',
                        value: item.jsonData.spec?.disruption?.consolidateAfter || '-',
                      },
                      {
                        name: 'Disruption Budgets',
                        value:
                          renderDisruptionBudgets(item.jsonData.spec?.disruption?.budgets) || '-',
                      },
                      {
                        name: 'Expire After',
                        value: item.jsonData.spec?.template?.spec?.expireAfter || '-',
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
            {
              id: 'nodepool-template',
              section: (
                <SectionBox title="Node Template Configuration">
                  <NameValueTable
                    rows={[
                      {
                        name: 'Node Class',
                        value: (
                          <Link
                            routeName={'nodeclasses-detail'}
                            params={{
                              name: item.jsonData.spec?.template?.spec?.nodeClassRef?.name,
                            }}
                          >
                            {item.jsonData.spec?.template?.spec?.nodeClassRef?.name || '-'}
                          </Link>
                        ),
                      },
                      {
                        name: 'Instance Requirements',
                        value: renderInstanceRequirements(
                          item.jsonData.spec?.template?.spec?.requirements
                        ),
                      },
                      {
                        name: 'Expire After',
                        value: item.jsonData.spec?.template?.spec?.expireAfter || '-',
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
          ]
        }
      />
    </>
  );
}

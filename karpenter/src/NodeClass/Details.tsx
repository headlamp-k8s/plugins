import { AppDispatch } from '@kinvolk/headlamp-plugin/lib';
import {
  ConditionsSection,
  DetailsGrid,
  NameValueTable,
  SectionBox,
  StatusLabel as NStausLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/KubeObject';
import { Box } from '@mui/material';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { EditConfigButton } from '../common/EditConfigButton';
import { DiffEditorDialog } from '../common/resourceEditor';
import { StatusLabel } from '../common/StatusLabel';
import { handleShowDiff } from '../helpers/handleDiff';
import { getHandleSaveHelper } from '../helpers/handleSave';
import { nodeClassClass } from './List';

export function NodeClassDetailView(props: { name?: string }) {
  const params = useParams<{ name: string }>();
  const { name = params.name } = props;
  const [currentResource, setCurrentResource] = React.useState<KubeObject | null>(null);
  const [originalYaml, setOriginalYaml] = React.useState('');
  const [modifiedYaml, setModifiedYaml] = React.useState('');
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const NodeClass = nodeClassClass();
  const location = useLocation();

  const dispatch: AppDispatch = useDispatch();

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
              id: 'Nodeclass-config-editor',
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
                      schema="Nodeclass-schema"
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
    <DetailsGrid
      resourceType={NodeClass}
      name={name}
      withEvents
      actions={actions()}
      extraInfo={item =>
        item && [
          {
            name: 'Status',
            value: <StatusLabel item={item} />,
          },
          {
            name: 'IAM Role',
            value: item.jsonData.spec?.role || '-',
          },
          {
            name: 'Instance Profile',
            value: item.jsonData.status?.instanceProfile || '-',
          },
          {
            name: 'AMI Family',
            value: item.jsonData.spec?.amiFamily || '-',
          },
        ]
      }
      extraSections={item =>
        item && [
          {
            id: 'nodeclass-config',
            section: (
              <SectionBox title="NodeClass Configuration">
                <NameValueTable
                  rows={[
                    {
                      name: 'Subnet Selectors',
                      value: renderSelectorTerms(item.jsonData.spec?.subnetSelectorTerms),
                    },
                    {
                      name: 'Security Group Selectors',
                      value: renderSelectorTerms(item.jsonData.spec?.securityGroupSelectorTerms),
                    },
                  ]}
                />
              </SectionBox>
            ),
          },
          {
            id: 'status',
            section: (
              <SectionBox title="Status">
                <NameValueTable
                  rows={[
                    {
                      name: 'Security Group IDs',
                      value: renderStatusItems(
                        item.jsonData.status?.securityGroups?.map(g => g.id)
                      ),
                    },
                    {
                      name: 'Subnet IDs',
                      value: renderStatusItems(item.jsonData.status?.subnets?.map(s => s.id)),
                    },
                    {
                      name: 'Availability Zones',
                      value: renderStatusItems(item.jsonData.status?.subnets?.map(s => s.zone)),
                    },
                  ]}
                />
              </SectionBox>
            ),
          },
          {
            id: 'conditions',
            section: <ConditionsSection resource={item.jsonData} />,
          },
        ]
      }
    />
  );
}

function renderStatusItems(items: string[] = []) {
  if (!items || items.length === 0) return '-';

  return (
    <Box sx={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {items.map((item, index) => (
        <NStausLabel key={index} status="">
          {item}
        </NStausLabel>
      ))}
    </Box>
  );
}

function renderSelectorTerms(terms: any[] = []) {
  if (!terms || terms.length === 0) return '-';

  return (
    <Box sx={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {terms.flatMap(term =>
        Object.entries(term.tags || {}).map(([key, value]) => (
          <NStausLabel key={`${key}=${value}`} status="">
            {`${key}=${value}`}
          </NStausLabel>
        ))
      )}
    </Box>
  );
}

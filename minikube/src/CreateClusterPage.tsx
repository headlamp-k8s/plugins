import { PageGrid, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import CommandCluster from './CommandCluster/CommandCluster';

export default function CreateClusterPage() {
  return (
    <PageGrid>
      <SectionBox backLink title={'Create Cluster'} py={2} mt={[4, 0, 0]}>
        <CommandCluster
          askClusterName
          useGrid
          open
          handleClose={() => {}}
          onConfirm={() => {}}
          command={'start'}
        />
      </SectionBox>
    </PageGrid>
  );
}

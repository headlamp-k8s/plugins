// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Angelo Cesaro

import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Link } from '@mui/material';
import { Kafka as K8sKafka, K8sListResponse, KafkaNodePool } from '../crds';
import { getClusterMode, isKRaftMode, isKafkaReady } from '../crds';
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { SearchFilter, FilterGroup, FilterSelect } from './SearchFilter';
import { KafkaTopologyModal } from './KafkaTopologyModal';
import { getErrorMessage } from '../utils/errors';
import { Toast, ToastMessage } from './Toast';

export function KafkaList() {
  const theme = useTheme();
  const [kafkas, setKafkas] = React.useState<K8sKafka[]>([]);
  const [nodePools, setNodePools] = React.useState<KafkaNodePool[]>([]);
  const [toast, setToast] = React.useState<ToastMessage | null>(null);

  // Search and Filter state
  const [searchTerm, setSearchTerm] = React.useState('');
  const [modeFilter, setModeFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  // Topology modal state
  const [selectedKafka, setSelectedKafka] = React.useState<K8sKafka | null>(null);
  const [isTopologyModalOpen, setIsTopologyModalOpen] = React.useState(false);

  const fetchKafkas = React.useCallback(() => {
    ApiProxy.request('/apis/kafka.strimzi.io/v1beta2/kafkas')
      .then((data: K8sListResponse<K8sKafka>) => {
        setKafkas(data.items);
      })
      .catch((err: unknown) => {
        // Handle case when Strimzi CRD is not installed
        const message = getErrorMessage(err);
        if (message === 'Not Found' || message.includes('404')) {
          setToast({
            message: 'Strimzi is not installed in this cluster. Please install the Strimzi operator first.',
            type: 'error',
            duration: 6000
          });
        } else {
          setToast({ message, type: 'error' });
        }
      });
  }, []);

  const fetchNodePools = React.useCallback(() => {
    ApiProxy.request('/apis/kafka.strimzi.io/v1beta2/kafkanodepools')
      .then((data: K8sListResponse<KafkaNodePool>) => {
        setNodePools(data.items);
      })
      .catch(() => {
        // Silently ignore - NodePools might not exist in ZK mode or older Strimzi versions
        setNodePools([]);
      });
  }, []);

  React.useEffect(() => {
    // Initial fetch
    fetchKafkas();
    fetchNodePools();

    // Auto-refresh every 5 seconds
    const intervalId = setInterval(() => {
      fetchKafkas();
      fetchNodePools();
    }, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchKafkas, fetchNodePools]);

  // Filter kafkas based on search and filters
  const filteredKafkas = React.useMemo(() => {
    return kafkas.filter((kafka) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === '' ||
        kafka.metadata.name.toLowerCase().includes(searchLower) ||
        kafka.metadata.namespace.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Mode filter
      if (modeFilter !== 'all') {
        const mode = getClusterMode(kafka);
        if (modeFilter === 'kraft' && mode !== 'KRaft') return false;
        if (modeFilter === 'zookeeper' && mode !== 'ZooKeeper') return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const ready = isKafkaReady(kafka);
        if (statusFilter === 'ready' && !ready) return false;
        if (statusFilter === 'not-ready' && ready) return false;
      }

      return true;
    });
  }, [kafkas, searchTerm, modeFilter, statusFilter]);

  // Helper function to calculate replicas display
  const getReplicasDisplay = (kafka: K8sKafka): string => {
    const clusterName = kafka.metadata.name;
    const namespace = kafka.metadata.namespace;
    const kafkaReplicas = kafka.spec?.kafka?.replicas;
    const zkReplicas = kafka.spec?.zookeeper?.replicas;

    // ZooKeeper mode: show ZK and Kafka replicas
    if (zkReplicas !== undefined) {
      return `${zkReplicas} Zookeeper / ${kafkaReplicas} Kafka`;
    }

    // KRaft mode with replicas defined (no NodePools)
    if (kafkaReplicas !== undefined) {
      return kafkaReplicas.toString();
    }

    // KRaft mode with NodePools: calculate by role
    const clusterNodePools = nodePools.filter(
      (np) =>
        np.metadata.namespace === namespace &&
        np.metadata.labels?.['strimzi.io/cluster'] === clusterName
    );

    if (clusterNodePools.length === 0) {
      return 'N/A';
    }

    // Count replicas by role
    let controllerReplicas = 0;
    let brokerReplicas = 0;
    let dualReplicas = 0;

    clusterNodePools.forEach((np) => {
      const roles = np.spec.roles || [];
      const replicas = np.spec.replicas;

      const isController = roles.includes('controller');
      const isBroker = roles.includes('broker');

      if (isController && isBroker) {
        dualReplicas += replicas;
      } else if (isController) {
        controllerReplicas += replicas;
      } else if (isBroker) {
        brokerReplicas += replicas;
      }
    });

    // Build display string based on what roles exist
    const parts: string[] = [];
    if (controllerReplicas > 0) parts.push(`${controllerReplicas} Controller`);
    if (brokerReplicas > 0) parts.push(`${brokerReplicas} Broker`);
    if (dualReplicas > 0) parts.push(`${dualReplicas} Dual`);

    return parts.length > 0 ? parts.join(' / ') : 'N/A';
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Kafka Clusters</h1>
      <p>Strimzi Kafka clusters with KRaft and ZooKeeper support</p>

      {/* Search and Filter */}
      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search clusters by name or namespace..."
        resultCount={filteredKafkas.length}
        totalCount={kafkas.length}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <FilterGroup label="Mode">
            <FilterSelect
              value={modeFilter}
              onChange={setModeFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'kraft', label: 'KRaft' },
                { value: 'zookeeper', label: 'ZooKeeper' },
              ]}
            />
          </FilterGroup>

          <FilterGroup label="Status">
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'ready', label: 'Ready' },
                { value: 'not-ready', label: 'Not Ready' },
              ]}
            />
          </FilterGroup>
        </div>
      </SearchFilter>

      {filteredKafkas.length === 0 ? (
        <p style={{ textAlign: 'center', color: theme.palette.text.secondary, padding: '40px' }}>
          {kafkas.length === 0 ? 'No Kafka clusters found' : 'No clusters match your search criteria'}
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Name</th>
              <th style={{ padding: '12px' }}>Namespace</th>
              <th style={{ padding: '12px' }}>Mode</th>
              <th style={{ padding: '12px' }}>Version</th>
              <th style={{ padding: '12px' }}>Replicas</th>
              <th style={{ padding: '12px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredKafkas.map((kafka) => {
              const mode = getClusterMode(kafka);
              const isKRaft = isKRaftMode(kafka);
              const ready = isKafkaReady(kafka);
              const replicasDisplay = getReplicasDisplay(kafka);

              return (
                <tr key={`${kafka.metadata.namespace}/${kafka.metadata.name}`} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    <Link
                      component="button"
                      variant="body2"
                      onClick={() => {
                        setSelectedKafka(kafka);
                        setIsTopologyModalOpen(true);
                      }}
                      sx={{
                        textAlign: 'left',
                        fontWeight: 500,
                      }}
                    >
                      {kafka.metadata.name}
                    </Link>
                  </td>
                  <td style={{ padding: '12px' }}>{kafka.metadata.namespace}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: isKRaft ? theme.palette.success.main : theme.palette.info.main,
                      color: isKRaft
                        ? theme.palette.getContrastText(theme.palette.success.main)
                        : theme.palette.getContrastText(theme.palette.info.main),
                      fontSize: '12px'
                    }}>
                      {mode}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{kafka.spec.kafka.version || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>{replicasDisplay}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: ready ? theme.palette.success.main : theme.palette.warning.main,
                      color: ready
                        ? theme.palette.getContrastText(theme.palette.success.main)
                        : theme.palette.getContrastText(theme.palette.warning.main),
                      fontSize: '12px'
                    }}>
                      {ready ? 'Ready' : 'Not Ready'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Topology Modal */}
      <KafkaTopologyModal
        kafka={selectedKafka}
        open={isTopologyModalOpen}
        onClose={() => {
          setIsTopologyModalOpen(false);
          setSelectedKafka(null);
        }}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

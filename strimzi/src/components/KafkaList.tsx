import React from 'react';
import { Kafka as K8sKafka } from '../crds';
import { getClusterMode, isKRaftMode, isKafkaReady } from '../crds';
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { SearchFilter, FilterGroup, FilterSelect } from './SearchFilter';
import { KafkaTopologyModal } from './KafkaTopologyModal';

export function KafkaList() {
  const [kafkas, setKafkas] = React.useState<K8sKafka[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  // Search and Filter state
  const [searchTerm, setSearchTerm] = React.useState('');
  const [modeFilter, setModeFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  // Topology modal state
  const [selectedKafka, setSelectedKafka] = React.useState<K8sKafka | null>(null);
  const [isTopologyModalOpen, setIsTopologyModalOpen] = React.useState(false);

  React.useEffect(() => {
    // Fetch Kafka resources using Headlamp API
    ApiProxy.request('/apis/kafka.strimzi.io/v1beta2/kafkas')
      .then((data: any) => {
        if (data && data.items) {
          setKafkas(data.items);
        }
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, []);

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

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

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
        <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
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

              return (
                <tr key={`${kafka.metadata.namespace}/${kafka.metadata.name}`} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    <span
                      onClick={() => {
                        setSelectedKafka(kafka);
                        setIsTopologyModalOpen(true);
                      }}
                      style={{
                        color: '#2563eb',
                        textDecoration: 'none',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      {kafka.metadata.name}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{kafka.metadata.namespace}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: isKRaft ? '#4caf50' : '#2196f3',
                      color: 'white',
                      fontSize: '12px'
                    }}>
                      {mode}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{kafka.spec.kafka.version || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>{kafka.spec.kafka.replicas}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: ready ? '#4caf50' : '#ff9800',
                      color: 'white',
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
    </div>
  );
}

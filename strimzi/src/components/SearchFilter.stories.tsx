import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { FilterGroup, FilterNumberRange, FilterSelect, SearchFilter } from './SearchFilter';

const meta: Meta<typeof SearchFilter> = {
  title: 'strimzi/SearchFilter',
  component: SearchFilter,
};
export default meta;

function SearchFilterStateful(args: { placeholder?: string }) {
  const [term, setTerm] = React.useState('demo');
  return (
    <SearchFilter
      searchTerm={term}
      onSearchChange={setTerm}
      placeholder={args.placeholder}
      resultCount={term ? 1 : 0}
      totalCount={5}
    />
  );
}

type Story = StoryObj<typeof SearchFilter>;

export const Default: Story = {
  render: () => <SearchFilterStateful />,
};

export const WithFiltersPanel: Story = {
  render: () => {
    const [term, setTerm] = React.useState('');
    const [ns, setNs] = React.useState('default');
    const [minP, setMinP] = React.useState<number | ''>('');
    const [maxP, setMaxP] = React.useState<number | ''>('');
    return (
      <SearchFilter
        searchTerm={term}
        onSearchChange={setTerm}
        placeholder="Search topics..."
        resultCount={2}
        totalCount={10}
      >
        <FilterGroup label="Namespace">
          <FilterSelect
            value={ns}
            onChange={setNs}
            options={[
              { value: 'default', label: 'default' },
              { value: 'kafka', label: 'kafka' },
            ]}
          />
        </FilterGroup>
        <FilterGroup label="Partitions">
          <FilterNumberRange
            minValue={minP}
            maxValue={maxP}
            onMinChange={setMinP}
            onMaxChange={setMaxP}
          />
        </FilterGroup>
      </SearchFilter>
    );
  },
};

export const EmptySearch: Story = {
  render: () => {
    const [term, setTerm] = React.useState('');
    return <SearchFilter searchTerm={term} onSearchChange={setTerm} placeholder="Type to search…" />;
  },
};

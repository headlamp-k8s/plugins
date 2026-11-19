import { TableColumn } from '@kinvolk/headlamp-plugin/lib/components/common';
import React from 'react';
import Table from './Table';

/**
 * Interface for a row in the RulesTable.
 * @param name - The name of the rule.
 * @param desc - The description of the rule.
 * @param pod - The pod associated with the rule.
 * @param file - The source file of the rule.
 */
export interface RulesTableRow {
  name: string;
  desc: string;
  pod: string;
  file: string;
}

/**
 * Props for the RulesTable component.
 * @param data - Array of rule rows to display.
 * @param filterFunction - Optional function to filter rows.
 */
interface RulesTableProps {
  data: RulesTableRow[];
  filterFunction?: (row: RulesTableRow) => boolean;
}

/**
 * Columns for the RulesTable component.
 * @param name - The name of the rule.
 * @param desc - The description of the rule.
 * @param pod - The pod associated with the rule.
 * @param file - The source file of the rule.
 */
const columns: TableColumn<RulesTableRow, any>[] = [
  {
    header: 'Name',
    accessorFn: (row: RulesTableRow) => row.name,
  },
  {
    header: 'Description',
    accessorFn: (row: RulesTableRow) => row.desc,
  },
  {
    header: 'Pod',
    accessorFn: (row: RulesTableRow) => row.pod,
  },
  {
    header: 'Source File',
    accessorFn: (row: RulesTableRow) => row.file,
  },
];

/**
 * A table component for displaying Falco rules.
 * @param data - Array of rule rows to display.
 * @param filterFunction - Optional function to filter rows.
 */
const RulesTable: React.FC<RulesTableProps> = ({ data, filterFunction }) => {
  return <Table columns={columns} data={data} filterFunction={filterFunction} />;
};

export default RulesTable;

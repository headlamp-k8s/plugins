import {
  Table as HTable,
  TableColumn,
  TableProps as HTableProps,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import React from 'react';

/**
 * Interface for a column in the Table component.
 * @param header - The header text for the column.
 * @param accessorKey - The key to access the column data.
 * @param accessorFn - Optional function to access the column data.
 * @param Cell - Optional component to render the cell content.
 */
export interface TableCol {
  header: string;
  accessorKey?: string;
  accessorFn?: (item: any) => React.ReactNode;
  Cell?: (props: { row: { original: any } }) => React.ReactNode;
}

/**
 * Props for the Table component.
 * @param columns - Array of columns to display.
 * @param rowProps - Optional function to return row properties.
 */
export interface TableProps extends Omit<HTableProps<any>, 'columns'> {
  columns: (TableCol | TableColumn<any, any>)[];
  rowProps?: (row: { original: any }) => {
    onClick?: () => void;
    style?: Record<string, any>;
    [key: string]: any;
  };
}

/**
 * A table component for displaying data.
 * @param columns - Array of columns to display.
 * @param rowProps - Optional function to return row properties.
 */
const Table: React.FC<TableProps> = props => {
  return <HTable {...props} />;
};

export default Table;

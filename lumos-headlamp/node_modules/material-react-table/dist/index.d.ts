import * as react from 'react';
import { MutableRefObject, Dispatch, SetStateAction, ReactNode, RefObject, ChangeEvent, MouseEvent, DragEventHandler } from 'react';
import * as _tanstack_react_table from '@tanstack/react-table';
import { Row, ColumnFiltersState, ColumnOrderState, ColumnPinningState, ColumnSizingInfoState, ColumnSizingState, ExpandedState, GroupingState, PaginationState, RowSelectionState, SortingState, Updater, VisibilityState, AccessorFn, DeepKeys, DeepValue, Table, TableState, ColumnDef, Column, Header, HeaderGroup, Cell, AggregationFn, SortingFn, FilterFn, TableOptions, OnChangeFn, Renderable, RowPinningPosition } from '@tanstack/react-table';
import { VirtualItem, VirtualizerOptions, Virtualizer } from '@tanstack/react-virtual';
import { AlertProps } from '@mui/material/Alert';
import { AutocompleteProps } from '@mui/material/Autocomplete';
import { BoxProps } from '@mui/material/Box';
import { ButtonProps } from '@mui/material/Button';
import { CheckboxProps } from '@mui/material/Checkbox';
import { ChipProps } from '@mui/material/Chip';
import { CircularProgressProps } from '@mui/material/CircularProgress';
import { DialogProps } from '@mui/material/Dialog';
import { IconButtonProps } from '@mui/material/IconButton';
import { LinearProgressProps } from '@mui/material/LinearProgress';
import { PaginationProps } from '@mui/material/Pagination';
import { PaperProps } from '@mui/material/Paper';
import { RadioProps } from '@mui/material/Radio';
import { SelectProps } from '@mui/material/Select';
import { SkeletonProps } from '@mui/material/Skeleton';
import { SliderProps } from '@mui/material/Slider';
import { TableProps } from '@mui/material/Table';
import { TableBodyProps } from '@mui/material/TableBody';
import { TableCellProps } from '@mui/material/TableCell';
import { TableContainerProps } from '@mui/material/TableContainer';
import { TableFooterProps } from '@mui/material/TableFooter';
import { TableHeadProps } from '@mui/material/TableHead';
import { TableRowProps } from '@mui/material/TableRow';
import { TextFieldProps } from '@mui/material/TextField';
import { Theme } from '@mui/material/styles';
import * as _mui_x_date_pickers from '@mui/x-date-pickers';
import { DatePickerProps, DateTimePickerProps, TimePickerProps } from '@mui/x-date-pickers';
import { RankingInfo } from '@tanstack/match-sorter-utils';
import * as _mui_material_OverridableComponent from '@mui/material/OverridableComponent';
import * as _mui_material from '@mui/material';
import * as react_jsx_runtime from 'react/jsx-runtime';
import { CollapseProps } from '@mui/material/Collapse';
import { DividerProps } from '@mui/material/Divider';
import { TableSortLabelProps } from '@mui/material/TableSortLabel';
import { MenuItemProps } from '@mui/material/MenuItem';
import { MenuProps } from '@mui/material/Menu';

declare const MRT_AggregationFns: {
    sum: _tanstack_react_table.AggregationFn<any>;
    min: _tanstack_react_table.AggregationFn<any>;
    max: _tanstack_react_table.AggregationFn<any>;
    extent: _tanstack_react_table.AggregationFn<any>;
    mean: _tanstack_react_table.AggregationFn<any>;
    median: _tanstack_react_table.AggregationFn<any>;
    unique: _tanstack_react_table.AggregationFn<any>;
    uniqueCount: _tanstack_react_table.AggregationFn<any>;
    count: _tanstack_react_table.AggregationFn<any>;
};

declare const MRT_FilterFns: {
    between: {
        <TData extends MRT_RowData>(row: Row<TData>, id: string, filterValues: [number | string, number | string]): boolean;
        autoRemove(val: any): boolean;
    };
    betweenInclusive: {
        <TData extends MRT_RowData>(row: Row<TData>, id: string, filterValues: [number | string, number | string]): boolean;
        autoRemove(val: any): boolean;
    };
    contains: {
        <TData extends MRT_RowData>(row: Row<TData>, id: string, filterValue: number | string): boolean;
        autoRemove(val: any): boolean;
    };
    empty: {
        <TData extends MRT_RowData>(row: Row<TData>, id: string, _filterValue: number | string): boolean;
        autoRemove(val: any): boolean;
    };
    endsWith: {
        <TData extends MRT_RowData>(row: Row<TData>, id: string, filterValue: number | string): boolean;
        autoRemove(val: any): boolean;
    };
    equals: {
        <TData extends MRT_RowData>(row: Row<TData>, id: string, filterValue: number | string): boolean;
        autoRemove(val: any): boolean;
    };
    fuzzy: {
        <TData extends MRT_RowData>(row: Row<TData>, columnId: string, filterValue: number | string, addMeta: (item: RankingInfo) => void): boolean;
        autoRemove(val: any): boolean;
    };
    greaterThan: {
        <TData extends MRT_RowData>(row: Row<TData>, id: string, filterValue: number | string): boolean;
        autoRemove(val: any): boolean;
    };
    greaterThanOrEqualTo: {
        <TData extends MRT_RowData>(row: Row<TData>, id: string, filterValue: number | string): boolean;
        autoRemove(val: any): boolean;
    };
    lessThan: {
        <TData extends MRT_RowData>(row: Row<TData>, id: string, filterValue: number | string): boolean;
        autoRemove(val: any): boolean;
    };
    lessThanOrEqualTo: {
        <TData extends MRT_RowData>(row: Row<TData>, id: string, filterValue: number | string): boolean;
        autoRemove(val: any): boolean;
    };
    notEmpty: {
        <TData extends MRT_RowData>(row: Row<TData>, id: string, _filterValue: number | string): boolean;
        autoRemove(val: any): boolean;
    };
    notEquals: {
        <TData extends MRT_RowData>(row: Row<TData>, id: string, filterValue: number | string): boolean;
        autoRemove(val: any): boolean;
    };
    startsWith: {
        <TData extends MRT_RowData>(row: Row<TData>, id: string, filterValue: number | string): boolean;
        autoRemove(val: any): boolean;
    };
    includesString: _tanstack_react_table.FilterFn<any>;
    includesStringSensitive: _tanstack_react_table.FilterFn<any>;
    equalsString: _tanstack_react_table.FilterFn<any>;
    arrIncludes: _tanstack_react_table.FilterFn<any>;
    arrIncludesAll: _tanstack_react_table.FilterFn<any>;
    arrIncludesSome: _tanstack_react_table.FilterFn<any>;
    weakEquals: _tanstack_react_table.FilterFn<any>;
    inNumberRange: _tanstack_react_table.FilterFn<any>;
};

declare const MRT_SortingFns: {
    fuzzy: <TData extends MRT_RowData>(rowA: Row<TData>, rowB: Row<TData>, columnId: string) => number;
    alphanumeric: _tanstack_react_table.SortingFn<any>;
    alphanumericCaseSensitive: _tanstack_react_table.SortingFn<any>;
    text: _tanstack_react_table.SortingFn<any>;
    textCaseSensitive: _tanstack_react_table.SortingFn<any>;
    datetime: _tanstack_react_table.SortingFn<any>;
    basic: _tanstack_react_table.SortingFn<any>;
};
declare const rankGlobalFuzzy: <TData extends MRT_RowData>(rowA: MRT_Row<TData>, rowB: MRT_Row<TData>) => number;

declare const MRT_Default_Icons: {
    readonly ArrowDownwardIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly ArrowRightIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly CancelIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly ChevronLeftIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly ChevronRightIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly ClearAllIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly CloseIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly ContentCopy: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly DensityLargeIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly DensityMediumIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly DensitySmallIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly DragHandleIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly DynamicFeedIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly EditIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly ExpandMoreIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly FilterAltIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly FilterListIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly FilterListOffIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly FirstPageIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly FullscreenExitIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly FullscreenIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly KeyboardDoubleArrowDownIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly LastPageIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly MoreHorizIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly MoreVertIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly PushPinIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly RestartAltIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly SaveIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly SearchIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly SearchOffIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly SortIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly SyncAltIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly ViewColumnIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
    readonly VisibilityOffIcon: _mui_material_OverridableComponent.OverridableComponent<_mui_material.SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
    };
};
type MRT_Icons = Record<keyof typeof MRT_Default_Icons, any>;

type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>);
type Prettify<T> = {
    [K in keyof T]: T[K];
} & unknown;
type Xor<A, B> = Prettify<A & {
    [k in keyof B]?: never;
}> | Prettify<B & {
    [k in keyof A]?: never;
}>;
type DropdownOption = {
    label?: string;
    /**
     * @deprecated use `label` instead
     */
    text?: string;
    value: any;
} | string;
type MRT_DensityState = 'comfortable' | 'compact' | 'spacious';
type MRT_ColumnFilterFnsState = Record<string, MRT_FilterOption>;
type MRT_RowData = Record<string, any>;
type MRT_ColumnFiltersState = ColumnFiltersState;
type MRT_ColumnOrderState = ColumnOrderState;
type MRT_ColumnPinningState = ColumnPinningState;
type MRT_ColumnSizingInfoState = ColumnSizingInfoState;
type MRT_ColumnSizingState = ColumnSizingState;
type MRT_ExpandedState = ExpandedState;
type MRT_GroupingState = GroupingState;
type MRT_PaginationState = PaginationState;
type MRT_RowSelectionState = RowSelectionState;
type MRT_SortingState = SortingState;
type MRT_Updater<T> = Updater<T>;
type MRT_VirtualItem = VirtualItem;
type MRT_VisibilityState = VisibilityState;
type MRT_VirtualizerOptions<TScrollElement extends Element | Window = Element | Window, TItemElement extends Element = Element> = VirtualizerOptions<TScrollElement, TItemElement>;
type MRT_ColumnVirtualizer<TScrollElement extends Element | Window = HTMLDivElement, TItemElement extends Element = HTMLTableCellElement> = Virtualizer<TScrollElement, TItemElement> & {
    virtualColumns: MRT_VirtualItem[];
    virtualPaddingLeft?: number;
    virtualPaddingRight?: number;
};
type MRT_RowVirtualizer<TScrollElement extends Element | Window = HTMLDivElement, TItemElement extends Element = HTMLTableRowElement> = Virtualizer<TScrollElement, TItemElement> & {
    virtualRows: MRT_VirtualItem[];
};
/**
 * @deprecated use `MRT_ColumnVirtualizer` or `MRT_RowVirtualizer` instead
 */
type MRT_Virtualizer<_TScrollElement = any, _TItemElement = any> = MRT_ColumnVirtualizer | MRT_RowVirtualizer;
type MRT_ColumnHelper<TData extends MRT_RowData> = {
    accessor: <TAccessor extends AccessorFn<TData> | DeepKeys<TData>, TValue extends TAccessor extends AccessorFn<TData, infer TReturn> ? TReturn : TAccessor extends DeepKeys<TData> ? DeepValue<TData, TAccessor> : never>(accessor: TAccessor, column: MRT_DisplayColumnDef<TData, TValue>) => MRT_ColumnDef<TData, TValue>;
    display: (column: MRT_DisplayColumnDef<TData>) => MRT_ColumnDef<TData>;
    group: (column: MRT_GroupColumnDef<TData>) => MRT_ColumnDef<TData>;
};
interface MRT_Localization {
    actions: string;
    and: string;
    cancel: string;
    changeFilterMode: string;
    changeSearchMode: string;
    clearFilter: string;
    clearSearch: string;
    clearSelection: string;
    clearSort: string;
    clickToCopy: string;
    collapse: string;
    collapseAll: string;
    columnActions: string;
    copiedToClipboard: string;
    copy: string;
    dropToGroupBy: string;
    edit: string;
    expand: string;
    expandAll: string;
    filterArrIncludes: string;
    filterArrIncludesAll: string;
    filterArrIncludesSome: string;
    filterBetween: string;
    filterBetweenInclusive: string;
    filterByColumn: string;
    filterContains: string;
    filterEmpty: string;
    filterEndsWith: string;
    filterEquals: string;
    filterEqualsString: string;
    filterFuzzy: string;
    filterGreaterThan: string;
    filterGreaterThanOrEqualTo: string;
    filterInNumberRange: string;
    filterIncludesString: string;
    filterIncludesStringSensitive: string;
    filterLessThan: string;
    filterLessThanOrEqualTo: string;
    filterMode: string;
    filterNotEmpty: string;
    filterNotEquals: string;
    filterStartsWith: string;
    filterWeakEquals: string;
    filteringByColumn: string;
    goToFirstPage: string;
    goToLastPage: string;
    goToNextPage: string;
    goToPreviousPage: string;
    grab: string;
    groupByColumn: string;
    groupedBy: string;
    hideAll: string;
    hideColumn: string;
    max: string;
    min: string;
    move: string;
    noRecordsToDisplay: string;
    noResultsFound: string;
    of: string;
    or: string;
    pin: string;
    pinToLeft: string;
    pinToRight: string;
    resetColumnSize: string;
    resetOrder: string;
    rowActions: string;
    rowNumber: string;
    rowNumbers: string;
    rowsPerPage: string;
    save: string;
    search: string;
    select: string;
    selectedCountOfRowCountRowsSelected: string;
    showAll: string;
    showAllColumns: string;
    showHideColumns: string;
    showHideFilters: string;
    showHideSearch: string;
    sortByColumnAsc: string;
    sortByColumnDesc: string;
    sortedByColumnAsc: string;
    sortedByColumnDesc: string;
    thenBy: string;
    toggleDensity: string;
    toggleFullScreen: string;
    toggleSelectAll: string;
    toggleSelectRow: string;
    toggleVisibility: string;
    ungroupByColumn: string;
    unpin: string;
    unpinAll: string;
}
interface MRT_Theme {
    baseBackgroundColor: string;
    draggingBorderColor: string;
    matchHighlightColor: string;
    menuBackgroundColor: string;
    pinnedRowBackgroundColor: string;
    selectedRowBackgroundColor: string;
}
interface MRT_RowModel<TData extends MRT_RowData> {
    flatRows: MRT_Row<TData>[];
    rows: MRT_Row<TData>[];
    rowsById: {
        [key: string]: MRT_Row<TData>;
    };
}
type MRT_TableInstance<TData extends MRT_RowData> = Omit<Table<TData>, 'getAllColumns' | 'getAllFlatColumns' | 'getAllLeafColumns' | 'getBottomRows' | 'getCenterLeafColumns' | 'getCenterRows' | 'getColumn' | 'getExpandedRowModel' | 'getFlatHeaders' | 'getHeaderGroups' | 'getLeafHeaders' | 'getLeftLeafColumns' | 'getPaginationRowModel' | 'getPreFilteredRowModel' | 'getPrePaginationRowModel' | 'getRightLeafColumns' | 'getRowModel' | 'getSelectedRowModel' | 'getState' | 'getTopRows' | 'options'> & {
    getAllColumns: () => MRT_Column<TData>[];
    getAllFlatColumns: () => MRT_Column<TData>[];
    getAllLeafColumns: () => MRT_Column<TData>[];
    getBottomRows: () => MRT_Row<TData>[];
    getCenterLeafColumns: () => MRT_Column<TData>[];
    getCenterRows: () => MRT_Row<TData>[];
    getColumn: (columnId: string) => MRT_Column<TData>;
    getExpandedRowModel: () => MRT_RowModel<TData>;
    getFlatHeaders: () => MRT_Header<TData>[];
    getHeaderGroups: () => MRT_HeaderGroup<TData>[];
    getLeafHeaders: () => MRT_Header<TData>[];
    getLeftLeafColumns: () => MRT_Column<TData>[];
    getPaginationRowModel: () => MRT_RowModel<TData>;
    getPreFilteredRowModel: () => MRT_RowModel<TData>;
    getPrePaginationRowModel: () => MRT_RowModel<TData>;
    getRightLeafColumns: () => MRT_Column<TData>[];
    getRowModel: () => MRT_RowModel<TData>;
    getSelectedRowModel: () => MRT_RowModel<TData>;
    getState: () => MRT_TableState<TData>;
    getTopRows: () => MRT_Row<TData>[];
    options: MRT_StatefulTableOptions<TData>;
    refs: {
        actionCellRef: MutableRefObject<HTMLTableCellElement | null>;
        bottomToolbarRef: MutableRefObject<HTMLDivElement | null>;
        editInputRefs: MutableRefObject<Record<string, HTMLInputElement>>;
        filterInputRefs: MutableRefObject<Record<string, HTMLInputElement>>;
        lastSelectedRowId: MutableRefObject<null | string>;
        searchInputRef: MutableRefObject<HTMLInputElement | null>;
        tableContainerRef: MutableRefObject<HTMLDivElement | null>;
        tableFooterRef: MutableRefObject<HTMLTableSectionElement | null>;
        tableHeadCellRefs: MutableRefObject<Record<string, HTMLTableCellElement>>;
        tableHeadRef: MutableRefObject<HTMLTableSectionElement | null>;
        tablePaperRef: MutableRefObject<HTMLDivElement | null>;
        topToolbarRef: MutableRefObject<HTMLDivElement | null>;
    };
    setActionCell: Dispatch<SetStateAction<MRT_Cell<TData> | null>>;
    setColumnFilterFns: Dispatch<SetStateAction<MRT_ColumnFilterFnsState>>;
    setCreatingRow: Dispatch<SetStateAction<MRT_Row<TData> | null | true>>;
    setDensity: Dispatch<SetStateAction<MRT_DensityState>>;
    setDraggingColumn: Dispatch<SetStateAction<MRT_Column<TData> | null>>;
    setDraggingRow: Dispatch<SetStateAction<MRT_Row<TData> | null>>;
    setEditingCell: Dispatch<SetStateAction<MRT_Cell<TData> | null>>;
    setEditingRow: Dispatch<SetStateAction<MRT_Row<TData> | null>>;
    setGlobalFilterFn: Dispatch<SetStateAction<MRT_FilterOption>>;
    setHoveredColumn: Dispatch<SetStateAction<Partial<MRT_Column<TData>> | null>>;
    setHoveredRow: Dispatch<SetStateAction<Partial<MRT_Row<TData>> | null>>;
    setIsFullScreen: Dispatch<SetStateAction<boolean>>;
    setShowAlertBanner: Dispatch<SetStateAction<boolean>>;
    setShowColumnFilters: Dispatch<SetStateAction<boolean>>;
    setShowGlobalFilter: Dispatch<SetStateAction<boolean>>;
    setShowToolbarDropZone: Dispatch<SetStateAction<boolean>>;
};
type MRT_DefinedTableOptions<TData extends MRT_RowData> = Omit<MRT_TableOptions<TData>, 'icons' | 'localization' | 'mrtTheme'> & {
    icons: MRT_Icons;
    localization: MRT_Localization;
    mrtTheme: Required<MRT_Theme>;
};
type MRT_StatefulTableOptions<TData extends MRT_RowData> = MRT_DefinedTableOptions<TData> & {
    state: Pick<MRT_TableState<TData>, 'columnFilterFns' | 'columnOrder' | 'columnSizingInfo' | 'creatingRow' | 'density' | 'draggingColumn' | 'draggingRow' | 'editingCell' | 'editingRow' | 'globalFilterFn' | 'grouping' | 'hoveredColumn' | 'hoveredRow' | 'isFullScreen' | 'pagination' | 'showAlertBanner' | 'showColumnFilters' | 'showGlobalFilter' | 'showToolbarDropZone'>;
};
interface MRT_TableState<TData extends MRT_RowData> extends TableState {
    actionCell?: MRT_Cell<TData> | null;
    columnFilterFns: MRT_ColumnFilterFnsState;
    creatingRow: MRT_Row<TData> | null;
    density: MRT_DensityState;
    draggingColumn: MRT_Column<TData> | null;
    draggingRow: MRT_Row<TData> | null;
    editingCell: MRT_Cell<TData> | null;
    editingRow: MRT_Row<TData> | null;
    globalFilterFn: MRT_FilterOption;
    hoveredColumn: Partial<MRT_Column<TData>> | null;
    hoveredRow: Partial<MRT_Row<TData>> | null;
    isFullScreen: boolean;
    isLoading: boolean;
    isSaving: boolean;
    showAlertBanner: boolean;
    showColumnFilters: boolean;
    showGlobalFilter: boolean;
    showLoadingOverlay: boolean;
    showProgressBars: boolean;
    showSkeletons: boolean;
    showToolbarDropZone: boolean;
}
interface MRT_ColumnDef<TData extends MRT_RowData, TValue = unknown> extends Omit<ColumnDef<TData, TValue>, 'accessorKey' | 'aggregatedCell' | 'aggregationFn' | 'cell' | 'columns' | 'filterFn' | 'footer' | 'header' | 'id' | 'sortingFn'> {
    AggregatedCell?: (props: {
        cell: MRT_Cell<TData, TValue>;
        column: MRT_Column<TData, TValue>;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
        staticColumnIndex?: number;
        staticRowIndex?: number;
    }) => ReactNode;
    Cell?: (props: {
        cell: MRT_Cell<TData, TValue>;
        column: MRT_Column<TData, TValue>;
        renderedCellValue: ReactNode;
        row: MRT_Row<TData>;
        rowRef?: RefObject<HTMLTableRowElement>;
        staticColumnIndex?: number;
        staticRowIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => ReactNode;
    Edit?: (props: {
        cell: MRT_Cell<TData, TValue>;
        column: MRT_Column<TData, TValue>;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => ReactNode;
    Filter?: (props: {
        column: MRT_Column<TData, TValue>;
        header: MRT_Header<TData>;
        rangeFilterIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => ReactNode;
    Footer?: ((props: {
        column: MRT_Column<TData, TValue>;
        footer: MRT_Header<TData>;
        table: MRT_TableInstance<TData>;
    }) => ReactNode) | ReactNode;
    GroupedCell?: (props: {
        cell: MRT_Cell<TData, TValue>;
        column: MRT_Column<TData, TValue>;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
        staticColumnIndex?: number;
        staticRowIndex?: number;
    }) => ReactNode;
    Header?: ((props: {
        column: MRT_Column<TData, TValue>;
        header: MRT_Header<TData>;
        table: MRT_TableInstance<TData>;
    }) => ReactNode) | ReactNode;
    PlaceholderCell?: (props: {
        cell: MRT_Cell<TData, TValue>;
        column: MRT_Column<TData, TValue>;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => ReactNode;
    /**
     * Either an `accessorKey` or a combination of an `accessorFn` and `id` are required for a data column definition.
     * Specify a function here to point to the correct property in the data object.
     *
     * @example accessorFn: (row) => row.username
     */
    accessorFn?: (originalRow: TData) => TValue;
    /**
     * Either an `accessorKey` or a combination of an `accessorFn` and `id` are required for a data column definition.
     * Specify which key in the row this column should use to access the correct data.
     * Also supports Deep Key Dot Notation.
     *
     * @example accessorKey: 'username' //simple
     * @example accessorKey: 'name.firstName' //deep key dot notation
     */
    accessorKey?: DeepKeys<TData> | (string & {});
    aggregationFn?: Array<MRT_AggregationFn<TData>> | MRT_AggregationFn<TData>;
    /**
     * Specify what type of column this is. Either `data`, `display`, or `group`. Defaults to `data`.
     * Leave this blank if you are just creating a normal data column.
     *
     * @default 'data'
     *
     * @example columnDefType: 'display'
     */
    columnDefType?: 'data' | 'display' | 'group';
    columnFilterModeOptions?: Array<LiteralUnion<string & MRT_FilterOption>> | null;
    columns?: MRT_ColumnDef<TData, TValue>[];
    editSelectOptions?: ((props: {
        cell: MRT_Cell<TData, TValue>;
        column: MRT_Column<TData>;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => DropdownOption[]) | DropdownOption[];
    editVariant?: 'select' | 'text';
    enableClickToCopy?: 'context-menu' | ((cell: MRT_Cell<TData>) => 'context-menu' | boolean) | boolean;
    enableColumnActions?: boolean;
    enableColumnDragging?: boolean;
    enableColumnFilterModes?: boolean;
    enableColumnOrdering?: boolean;
    enableEditing?: ((row: MRT_Row<TData>) => boolean) | boolean;
    enableFilterMatchHighlighting?: boolean;
    filterFn?: MRT_FilterFn<TData>;
    filterSelectOptions?: DropdownOption[];
    filterVariant?: 'autocomplete' | 'checkbox' | 'date' | 'date-range' | 'datetime' | 'datetime-range' | 'multi-select' | 'range' | 'range-slider' | 'select' | 'text' | 'time' | 'time-range';
    /**
     * footer must be a string. If you want custom JSX to render the footer, you can also specify a `Footer` option. (Capital F)
     */
    footer?: string;
    /**
     * If `layoutMode` is `'grid'` or `'grid-no-grow'`, you can specify the flex grow value for individual columns to still grow and take up remaining space, or set to `false`/0 to not grow.
     */
    grow?: boolean | number;
    /**
     * header must be a string. If you want custom JSX to render the header, you can also specify a `Header` option. (Capital H)
     */
    header: string;
    /**
     * Either an `accessorKey` or a combination of an `accessorFn` and `id` are required for a data column definition.
     *
     * If you have also specified an `accessorFn`, MRT still needs to have a valid `id` to be able to identify the column uniquely.
     *
     * `id` defaults to the `accessorKey` or `header` if not specified.
     *
     * @default gets set to the same value as `accessorKey` by default
     */
    id?: LiteralUnion<string & keyof TData>;
    muiColumnActionsButtonProps?: ((props: {
        column: MRT_Column<TData>;
        table: MRT_TableInstance<TData>;
    }) => IconButtonProps) | IconButtonProps;
    muiColumnDragHandleProps?: ((props: {
        column: MRT_Column<TData>;
        table: MRT_TableInstance<TData>;
    }) => IconButtonProps) | IconButtonProps;
    muiCopyButtonProps?: ((props: {
        cell: MRT_Cell<TData, TValue>;
        column: MRT_Column<TData>;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => ButtonProps) | ButtonProps;
    muiEditTextFieldProps?: ((props: {
        cell: MRT_Cell<TData, TValue>;
        column: MRT_Column<TData>;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => TextFieldProps) | TextFieldProps;
    muiFilterAutocompleteProps?: ((props: {
        column: MRT_Column<TData>;
        table: MRT_TableInstance<TData>;
    }) => AutocompleteProps<any, any, any, any>) | AutocompleteProps<any, any, any, any>;
    muiFilterCheckboxProps?: ((props: {
        column: MRT_Column<TData>;
        table: MRT_TableInstance<TData>;
    }) => CheckboxProps) | CheckboxProps;
    muiFilterDatePickerProps?: ((props: {
        column: MRT_Column<TData>;
        rangeFilterIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => DatePickerProps<never>) | DatePickerProps<never>;
    muiFilterDateTimePickerProps?: ((props: {
        column: MRT_Column<TData>;
        rangeFilterIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => DateTimePickerProps<never>) | DateTimePickerProps<never>;
    muiFilterSliderProps?: ((props: {
        column: MRT_Column<TData>;
        table: MRT_TableInstance<TData>;
    }) => SliderProps) | SliderProps;
    muiFilterTextFieldProps?: ((props: {
        column: MRT_Column<TData>;
        rangeFilterIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => TextFieldProps) | TextFieldProps;
    muiFilterTimePickerProps?: ((props: {
        column: MRT_Column<TData>;
        rangeFilterIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => TimePickerProps<never>) | TimePickerProps<never>;
    muiTableBodyCellProps?: ((props: {
        cell: MRT_Cell<TData, TValue>;
        column: MRT_Column<TData>;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => TableCellProps) | TableCellProps;
    muiTableFooterCellProps?: ((props: {
        column: MRT_Column<TData>;
        table: MRT_TableInstance<TData>;
    }) => TableCellProps) | TableCellProps;
    muiTableHeadCellProps?: ((props: {
        column: MRT_Column<TData>;
        table: MRT_TableInstance<TData>;
    }) => TableCellProps) | TableCellProps;
    renderCellActionMenuItems?: (props: {
        cell: MRT_Cell<TData>;
        closeMenu: () => void;
        column: MRT_Column<TData>;
        internalMenuItems: ReactNode[];
        row: MRT_Row<TData>;
        staticColumnIndex?: number;
        staticRowIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => ReactNode[];
    renderColumnActionsMenuItems?: (props: {
        closeMenu: () => void;
        column: MRT_Column<TData>;
        internalColumnMenuItems: ReactNode[];
        table: MRT_TableInstance<TData>;
    }) => ReactNode[];
    renderColumnFilterModeMenuItems?: (props: {
        column: MRT_Column<TData>;
        internalFilterOptions: MRT_InternalFilterOption[];
        onSelectFilterMode: (filterMode: MRT_FilterOption) => void;
        table: MRT_TableInstance<TData>;
    }) => ReactNode[];
    sortingFn?: MRT_SortingFn<TData>;
    visibleInShowHideMenu?: boolean;
}
type MRT_DisplayColumnDef<TData extends MRT_RowData, TValue = unknown> = Omit<MRT_ColumnDef<TData, TValue>, 'accessorFn' | 'accessorKey'>;
type MRT_GroupColumnDef<TData extends MRT_RowData> = MRT_DisplayColumnDef<TData, any> & {
    columns: MRT_ColumnDef<TData>[];
};
type MRT_DefinedColumnDef<TData extends MRT_RowData, TValue = unknown> = Omit<MRT_ColumnDef<TData, TValue>, 'defaultDisplayColumn' | 'id'> & {
    _filterFn: MRT_FilterOption;
    defaultDisplayColumn: Partial<MRT_ColumnDef<TData, TValue>>;
    id: string;
};
type MRT_Column<TData extends MRT_RowData, TValue = unknown> = Omit<Column<TData, TValue>, 'columnDef' | 'columns' | 'filterFn' | 'footer' | 'header'> & {
    columnDef: MRT_DefinedColumnDef<TData, TValue>;
    columns?: MRT_Column<TData, TValue>[];
    filterFn?: MRT_FilterFn<TData>;
    footer: string;
    header: string;
};
type MRT_Header<TData extends MRT_RowData> = Omit<Header<TData, unknown>, 'column'> & {
    column: MRT_Column<TData>;
};
type MRT_HeaderGroup<TData extends MRT_RowData> = Omit<HeaderGroup<TData>, 'headers'> & {
    headers: MRT_Header<TData>[];
};
type MRT_Row<TData extends MRT_RowData> = Omit<Row<TData>, '_valuesCache' | 'getAllCells' | 'getParentRow' | 'getParentRows' | 'getRow' | 'getVisibleCells' | 'subRows'> & {
    _valuesCache: Record<LiteralUnion<string & DeepKeys<TData>>, any>;
    getAllCells: () => MRT_Cell<TData>[];
    getParentRow: () => MRT_Row<TData> | null;
    getParentRows: () => MRT_Row<TData>[];
    getRow: () => MRT_Row<TData>;
    getVisibleCells: () => MRT_Cell<TData>[];
    subRows?: MRT_Row<TData>[];
};
type MRT_Cell<TData extends MRT_RowData, TValue = unknown> = Omit<Cell<TData, TValue>, 'column' | 'row'> & {
    column: MRT_Column<TData, TValue>;
    row: MRT_Row<TData>;
};
type MRT_AggregationOption = string & keyof typeof MRT_AggregationFns;
type MRT_AggregationFn<TData extends MRT_RowData> = AggregationFn<TData> | MRT_AggregationOption;
type MRT_SortingOption = LiteralUnion<string & keyof typeof MRT_SortingFns>;
type MRT_SortingFn<TData extends MRT_RowData> = MRT_SortingOption | SortingFn<TData>;
type MRT_FilterOption = LiteralUnion<string & keyof typeof MRT_FilterFns>;
type MRT_FilterFn<TData extends MRT_RowData> = FilterFn<TData> | MRT_FilterOption;
type MRT_InternalFilterOption = {
    divider: boolean;
    label: string;
    option: string;
    symbol: string;
};
type MRT_DisplayColumnIds = 'mrt-row-actions' | 'mrt-row-drag' | 'mrt-row-expand' | 'mrt-row-numbers' | 'mrt-row-pin' | 'mrt-row-select' | 'mrt-row-spacer';
/**
 * `columns` and `data` props are the only required props, but there are over 170 other optional props.
 *
 * See more info on creating columns and data on the official docs site:
 * @link https://www.material-react-table.com/docs/getting-started/usage
 *
 * See the full props list on the official docs site:
 * @link https://www.material-react-table.com/docs/api/props
 */
interface MRT_TableOptions<TData extends MRT_RowData> extends Omit<Partial<TableOptions<TData>>, 'columns' | 'data' | 'defaultColumn' | 'enableRowSelection' | 'expandRowsFn' | 'getRowId' | 'globalFilterFn' | 'initialState' | 'onStateChange' | 'state'> {
    columnFilterDisplayMode?: 'custom' | 'popover' | 'subheader';
    columnFilterModeOptions?: Array<LiteralUnion<string & MRT_FilterOption>> | null;
    columnVirtualizerInstanceRef?: MutableRefObject<MRT_ColumnVirtualizer | MRT_Virtualizer | null>;
    columnVirtualizerOptions?: ((props: {
        table: MRT_TableInstance<TData>;
    }) => Partial<VirtualizerOptions<HTMLDivElement, HTMLTableCellElement>>) | Partial<VirtualizerOptions<HTMLDivElement, HTMLTableCellElement>>;
    /**
     * The columns to display in the table. `accessorKey`s or `accessorFn`s must match keys in the `data` table option.
     *
     * See more info on creating columns on the official docs site:
     * @link https://www.material-react-table.com/docs/guides/data-columns
     * @link https://www.material-react-table.com/docs/guides/display-columns
     *
     * See all Columns Options on the official docs site:
     * @link https://www.material-react-table.com/docs/api/column-options
     */
    columns: MRT_ColumnDef<TData, any>[];
    createDisplayMode?: 'custom' | 'modal' | 'row';
    /**
     * Pass your data as an array of objects. Objects can theoretically be any shape, but it's best to keep them consistent.
     *
     * See the usage guide for more info on creating columns and data:
     * @link https://www.material-react-table.com/docs/getting-started/usage
     */
    data: TData[];
    /**
     * Instead of specifying a bunch of the same options for each column, you can just change an option in the `defaultColumn` table option to change a default option for all columns.
     */
    defaultColumn?: Partial<MRT_ColumnDef<TData>>;
    /**
     * Change the default options for display columns.
     */
    defaultDisplayColumn?: Partial<MRT_DisplayColumnDef<TData>>;
    displayColumnDefOptions?: Partial<{
        [key in MRT_DisplayColumnIds]: Partial<MRT_DisplayColumnDef<TData>>;
    }>;
    editDisplayMode?: 'cell' | 'custom' | 'modal' | 'row' | 'table';
    enableBatchRowSelection?: boolean;
    enableBottomToolbar?: boolean;
    enableCellActions?: ((cell: MRT_Cell<TData>) => boolean) | boolean;
    enableClickToCopy?: 'context-menu' | ((cell: MRT_Cell<TData>) => 'context-menu' | boolean) | boolean;
    enableColumnActions?: boolean;
    enableColumnDragging?: boolean;
    enableColumnFilterModes?: boolean;
    enableColumnOrdering?: boolean;
    enableColumnVirtualization?: boolean;
    enableDensityToggle?: boolean;
    enableEditing?: ((row: MRT_Row<TData>) => boolean) | boolean;
    enableExpandAll?: boolean;
    enableFacetedValues?: boolean;
    enableFilterMatchHighlighting?: boolean;
    enableFullScreenToggle?: boolean;
    enableGlobalFilterModes?: boolean;
    enableGlobalFilterRankedResults?: boolean;
    enablePagination?: boolean;
    enableRowActions?: boolean;
    enableRowDragging?: boolean;
    enableRowNumbers?: boolean;
    enableRowOrdering?: boolean;
    enableRowSelection?: ((row: MRT_Row<TData>) => boolean) | boolean;
    enableRowVirtualization?: boolean;
    enableSelectAll?: boolean;
    enableStickyFooter?: boolean;
    enableStickyHeader?: boolean;
    enableTableFooter?: boolean;
    enableTableHead?: boolean;
    enableToolbarInternalActions?: boolean;
    enableTopToolbar?: boolean;
    expandRowsFn?: (dataRow: TData) => TData[];
    getRowId?: (originalRow: TData, index: number, parentRow: MRT_Row<TData>) => string;
    globalFilterFn?: MRT_FilterOption;
    globalFilterModeOptions?: MRT_FilterOption[] | null;
    icons?: Partial<MRT_Icons>;
    initialState?: Partial<MRT_TableState<TData>>;
    /**
     * Changes which kind of CSS layout is used to render the table. `semantic` uses default semantic HTML elements, while `grid` adds CSS grid and flexbox styles
     */
    layoutMode?: 'grid' | 'grid-no-grow' | 'semantic';
    /**
     * Pass in either a locale imported from `material-react-table/locales/*` or a custom locale object.
     *
     * See the localization (i18n) guide for more info:
     * @link https://www.material-react-table.com/docs/guides/localization
     */
    localization?: Partial<MRT_Localization>;
    /**
     * Memoize cells, rows, or the entire table body to potentially improve render performance.
     *
     * @warning This will break some dynamic rendering features. See the memoization guide for more info:
     * @link https://www.material-react-table.com/docs/guides/memoize-components
     */
    memoMode?: 'cells' | 'rows' | 'table-body';
    mrtTheme?: ((theme: Theme) => Partial<MRT_Theme>) | Partial<MRT_Theme>;
    muiBottomToolbarProps?: ((props: {
        table: MRT_TableInstance<TData>;
    }) => BoxProps) | BoxProps;
    muiCircularProgressProps?: ((props: {
        table: MRT_TableInstance<TData>;
    }) => CircularProgressProps & {
        Component?: ReactNode;
    }) | (CircularProgressProps & {
        Component?: ReactNode;
    });
    muiColumnActionsButtonProps?: ((props: {
        column: MRT_Column<TData>;
        table: MRT_TableInstance<TData>;
    }) => IconButtonProps) | IconButtonProps;
    muiColumnDragHandleProps?: ((props: {
        column: MRT_Column<TData>;
        table: MRT_TableInstance<TData>;
    }) => IconButtonProps) | IconButtonProps;
    muiCopyButtonProps?: ((props: {
        cell: MRT_Cell<TData>;
        column: MRT_Column<TData>;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => ButtonProps) | ButtonProps;
    muiCreateRowModalProps?: ((props: {
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => DialogProps) | DialogProps;
    muiDetailPanelProps?: ((props: {
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => TableCellProps) | TableCellProps;
    muiEditRowDialogProps?: ((props: {
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => DialogProps) | DialogProps;
    muiEditTextFieldProps?: ((props: {
        cell: MRT_Cell<TData>;
        column: MRT_Column<TData>;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => TextFieldProps) | TextFieldProps;
    muiExpandAllButtonProps?: ((props: {
        table: MRT_TableInstance<TData>;
    }) => IconButtonProps) | IconButtonProps;
    muiExpandButtonProps?: ((props: {
        row: MRT_Row<TData>;
        staticRowIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => IconButtonProps) | IconButtonProps;
    muiFilterAutocompleteProps?: ((props: {
        column: MRT_Column<TData>;
        table: MRT_TableInstance<TData>;
    }) => AutocompleteProps<any, any, any, any>) | AutocompleteProps<any, any, any, any>;
    muiFilterCheckboxProps?: ((props: {
        column: MRT_Column<TData>;
        table: MRT_TableInstance<TData>;
    }) => CheckboxProps) | CheckboxProps;
    muiFilterDatePickerProps?: ((props: {
        column: MRT_Column<TData>;
        rangeFilterIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => DatePickerProps<never>) | DatePickerProps<never>;
    muiFilterDateTimePickerProps?: ((props: {
        column: MRT_Column<TData>;
        rangeFilterIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => DateTimePickerProps<never>) | DateTimePickerProps<never>;
    muiFilterSliderProps?: ((props: {
        column: MRT_Column<TData>;
        table: MRT_TableInstance<TData>;
    }) => SliderProps) | SliderProps;
    muiFilterTextFieldProps?: ((props: {
        column: MRT_Column<TData>;
        rangeFilterIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => TextFieldProps) | TextFieldProps;
    muiFilterTimePickerProps?: ((props: {
        column: MRT_Column<TData>;
        rangeFilterIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => TimePickerProps<never>) | TimePickerProps<never>;
    muiLinearProgressProps?: ((props: {
        isTopToolbar: boolean;
        table: MRT_TableInstance<TData>;
    }) => LinearProgressProps) | LinearProgressProps;
    muiPaginationProps?: ((props: {
        table: MRT_TableInstance<TData>;
    }) => Partial<PaginationProps & {
        SelectProps?: Partial<SelectProps>;
        disabled?: boolean;
        rowsPerPageOptions?: {
            label: string;
            value: number;
        }[] | number[];
        showRowsPerPage?: boolean;
    }>) | Partial<PaginationProps & {
        SelectProps?: Partial<SelectProps>;
        disabled?: boolean;
        rowsPerPageOptions?: {
            label: string;
            value: number;
        }[] | number[];
        showRowsPerPage?: boolean;
    }>;
    muiRowDragHandleProps?: ((props: {
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => IconButtonProps) | IconButtonProps;
    muiSearchTextFieldProps?: ((props: {
        table: MRT_TableInstance<TData>;
    }) => TextFieldProps) | TextFieldProps;
    muiSelectAllCheckboxProps?: ((props: {
        table: MRT_TableInstance<TData>;
    }) => CheckboxProps) | CheckboxProps;
    muiSelectCheckboxProps?: ((props: {
        row: MRT_Row<TData>;
        staticRowIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => CheckboxProps | RadioProps) | (CheckboxProps | RadioProps);
    muiSkeletonProps?: ((props: {
        cell: MRT_Cell<TData>;
        column: MRT_Column<TData>;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => SkeletonProps) | SkeletonProps;
    muiTableBodyCellProps?: ((props: {
        cell: MRT_Cell<TData>;
        column: MRT_Column<TData>;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => TableCellProps) | TableCellProps;
    muiTableBodyProps?: ((props: {
        table: MRT_TableInstance<TData>;
    }) => TableBodyProps) | TableBodyProps;
    muiTableBodyRowProps?: ((props: {
        isDetailPanel?: boolean;
        row: MRT_Row<TData>;
        staticRowIndex: number;
        table: MRT_TableInstance<TData>;
    }) => TableRowProps) | TableRowProps;
    muiTableContainerProps?: ((props: {
        table: MRT_TableInstance<TData>;
    }) => TableContainerProps) | TableContainerProps;
    muiTableFooterCellProps?: ((props: {
        column: MRT_Column<TData>;
        table: MRT_TableInstance<TData>;
    }) => TableCellProps) | TableCellProps;
    muiTableFooterProps?: ((props: {
        table: MRT_TableInstance<TData>;
    }) => TableFooterProps) | TableFooterProps;
    muiTableFooterRowProps?: ((props: {
        footerGroup: MRT_HeaderGroup<TData>;
        table: MRT_TableInstance<TData>;
    }) => TableRowProps) | TableRowProps;
    muiTableHeadCellProps?: ((props: {
        column: MRT_Column<TData>;
        table: MRT_TableInstance<TData>;
    }) => TableCellProps) | TableCellProps;
    muiTableHeadProps?: ((props: {
        table: MRT_TableInstance<TData>;
    }) => TableHeadProps) | TableHeadProps;
    muiTableHeadRowProps?: ((props: {
        headerGroup: MRT_HeaderGroup<TData>;
        table: MRT_TableInstance<TData>;
    }) => TableRowProps) | TableRowProps;
    muiTablePaperProps?: ((props: {
        table: MRT_TableInstance<TData>;
    }) => PaperProps) | PaperProps;
    muiTableProps?: ((props: {
        table: MRT_TableInstance<TData>;
    }) => TableProps) | TableProps;
    muiToolbarAlertBannerChipProps?: ((props: {
        table: MRT_TableInstance<TData>;
    }) => ChipProps) | ChipProps;
    muiToolbarAlertBannerProps?: ((props: {
        table: MRT_TableInstance<TData>;
    }) => AlertProps) | AlertProps;
    muiTopToolbarProps?: ((props: {
        table: MRT_TableInstance<TData>;
    }) => BoxProps) | BoxProps;
    onActionCellChange?: OnChangeFn<MRT_Cell<TData> | null>;
    onColumnFilterFnsChange?: OnChangeFn<{
        [key: string]: MRT_FilterOption;
    }>;
    onCreatingRowCancel?: (props: {
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => void;
    onCreatingRowChange?: OnChangeFn<MRT_Row<TData> | null>;
    onCreatingRowSave?: (props: {
        exitCreatingMode: () => void;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
        values: Record<LiteralUnion<string & DeepKeys<TData>>, any>;
    }) => void;
    onDensityChange?: OnChangeFn<MRT_DensityState>;
    onDraggingColumnChange?: OnChangeFn<MRT_Column<TData> | null>;
    onDraggingRowChange?: OnChangeFn<MRT_Row<TData> | null>;
    onEditingCellChange?: OnChangeFn<MRT_Cell<TData> | null>;
    onEditingRowCancel?: (props: {
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => void;
    onEditingRowChange?: OnChangeFn<MRT_Row<TData> | null>;
    onEditingRowSave?: (props: {
        exitEditingMode: () => void;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
        values: Record<LiteralUnion<string & DeepKeys<TData>>, any>;
    }) => Promise<void> | void;
    onGlobalFilterFnChange?: OnChangeFn<MRT_FilterOption>;
    onHoveredColumnChange?: OnChangeFn<Partial<MRT_Column<TData>> | null>;
    onHoveredRowChange?: OnChangeFn<Partial<MRT_Row<TData>> | null>;
    onIsFullScreenChange?: OnChangeFn<boolean>;
    onShowAlertBannerChange?: OnChangeFn<boolean>;
    onShowColumnFiltersChange?: OnChangeFn<boolean>;
    onShowGlobalFilterChange?: OnChangeFn<boolean>;
    onShowToolbarDropZoneChange?: OnChangeFn<boolean>;
    paginationDisplayMode?: 'custom' | 'default' | 'pages';
    positionActionsColumn?: 'first' | 'last';
    positionCreatingRow?: 'bottom' | 'top' | number;
    positionExpandColumn?: 'first' | 'last';
    positionGlobalFilter?: 'left' | 'none' | 'right';
    positionPagination?: 'both' | 'bottom' | 'none' | 'top';
    positionToolbarAlertBanner?: 'bottom' | 'head-overlay' | 'none' | 'top';
    positionToolbarDropZone?: 'both' | 'bottom' | 'none' | 'top';
    renderBottomToolbar?: ((props: {
        table: MRT_TableInstance<TData>;
    }) => ReactNode) | ReactNode;
    renderBottomToolbarCustomActions?: (props: {
        table: MRT_TableInstance<TData>;
    }) => ReactNode;
    renderCaption?: ((props: {
        table: MRT_TableInstance<TData>;
    }) => ReactNode) | ReactNode;
    renderCellActionMenuItems?: (props: {
        cell: MRT_Cell<TData>;
        closeMenu: () => void;
        column: MRT_Column<TData>;
        internalMenuItems: ReactNode[];
        row: MRT_Row<TData>;
        staticColumnIndex?: number;
        staticRowIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => ReactNode[];
    renderColumnActionsMenuItems?: (props: {
        closeMenu: () => void;
        column: MRT_Column<TData>;
        internalColumnMenuItems: ReactNode[];
        table: MRT_TableInstance<TData>;
    }) => ReactNode[];
    renderColumnFilterModeMenuItems?: (props: {
        column: MRT_Column<TData>;
        internalFilterOptions: MRT_InternalFilterOption[];
        onSelectFilterMode: (filterMode: MRT_FilterOption) => void;
        table: MRT_TableInstance<TData>;
    }) => ReactNode[];
    renderCreateRowDialogContent?: (props: {
        internalEditComponents: ReactNode[];
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => ReactNode;
    renderDetailPanel?: (props: {
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => ReactNode;
    renderEditRowDialogContent?: (props: {
        internalEditComponents: ReactNode[];
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => ReactNode;
    renderEmptyRowsFallback?: (props: {
        table: MRT_TableInstance<TData>;
    }) => ReactNode;
    renderGlobalFilterModeMenuItems?: (props: {
        internalFilterOptions: MRT_InternalFilterOption[];
        onSelectFilterMode: (filterMode: MRT_FilterOption) => void;
        table: MRT_TableInstance<TData>;
    }) => ReactNode[];
    renderRowActionMenuItems?: (props: {
        closeMenu: () => void;
        row: MRT_Row<TData>;
        staticRowIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => ReactNode[];
    renderRowActions?: (props: {
        cell: MRT_Cell<TData>;
        row: MRT_Row<TData>;
        staticRowIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => ReactNode;
    renderToolbarAlertBannerContent?: (props: {
        groupedAlert: ReactNode | null;
        selectedAlert: ReactNode | null;
        table: MRT_TableInstance<TData>;
    }) => ReactNode;
    renderToolbarInternalActions?: (props: {
        table: MRT_TableInstance<TData>;
    }) => ReactNode;
    renderTopToolbar?: ((props: {
        table: MRT_TableInstance<TData>;
    }) => ReactNode) | ReactNode;
    renderTopToolbarCustomActions?: (props: {
        table: MRT_TableInstance<TData>;
    }) => ReactNode;
    rowNumberDisplayMode?: 'original' | 'static';
    rowPinningDisplayMode?: 'bottom' | 'select-bottom' | 'select-sticky' | 'select-top' | 'sticky' | 'top' | 'top-and-bottom';
    rowVirtualizerInstanceRef?: MutableRefObject<MRT_RowVirtualizer | MRT_Virtualizer | null>;
    rowVirtualizerOptions?: ((props: {
        table: MRT_TableInstance<TData>;
    }) => Partial<VirtualizerOptions<HTMLDivElement, HTMLTableRowElement>>) | Partial<VirtualizerOptions<HTMLDivElement, HTMLTableRowElement>>;
    selectAllMode?: 'all' | 'page';
    /**
     * Manage state externally any way you want, then pass it back into MRT.
     */
    state?: Partial<MRT_TableState<TData>>;
}

declare const flexRender: (Comp: Renderable<any>, props: any) => JSX.Element | ReactNode;
declare function createMRTColumnHelper<TData extends MRT_RowData>(): MRT_ColumnHelper<TData>;
declare const createRow: <TData extends MRT_RowData>(table: MRT_TableInstance<TData>, originalRow?: TData, rowIndex?: number, depth?: number, subRows?: MRT_Row<TData>[], parentId?: string) => MRT_Row<TData>;

declare const isCellEditable: <TData extends MRT_RowData>({ cell, table, }: {
    cell: MRT_Cell<TData>;
    table: MRT_TableInstance<TData>;
}) => boolean | undefined;
declare const openEditingCell: <TData extends MRT_RowData>({ cell, table, }: {
    cell: MRT_Cell<TData>;
    table: MRT_TableInstance<TData>;
}) => void;

declare const getColumnId: <TData extends MRT_RowData>(columnDef: MRT_ColumnDef<TData>) => string;
declare const getAllLeafColumnDefs: <TData extends MRT_RowData>(columns: MRT_ColumnDef<TData>[]) => MRT_ColumnDef<TData>[];
declare const prepareColumns: <TData extends MRT_RowData>({ columnDefs, tableOptions, }: {
    columnDefs: MRT_ColumnDef<TData>[];
    tableOptions: MRT_DefinedTableOptions<TData>;
}) => MRT_DefinedColumnDef<TData>[];
declare const reorderColumn: <TData extends MRT_RowData>(draggedColumn: MRT_Column<TData>, targetColumn: MRT_Column<TData>, columnOrder: MRT_ColumnOrderState) => MRT_ColumnOrderState;
declare const getDefaultColumnFilterFn: <TData extends MRT_RowData>(columnDef: MRT_ColumnDef<TData>) => MRT_FilterOption;
declare const getColumnFilterInfo: <TData extends MRT_RowData>({ header, table, }: {
    header: MRT_Header<TData>;
    table: MRT_TableInstance<TData>;
}) => {
    readonly allowedColumnFilterOptions: LiteralUnion<string & MRT_FilterOption, string>[] | null | undefined;
    readonly currentFilterOption: MRT_FilterOption;
    readonly facetedUniqueValues: Map<any, number>;
    readonly isAutocompleteFilter: boolean;
    readonly isDateFilter: boolean;
    readonly isMultiSelectFilter: boolean;
    readonly isRangeFilter: boolean;
    readonly isSelectFilter: boolean;
    readonly isTextboxFilter: boolean;
};
declare const useDropdownOptions: <TData extends MRT_RowData>({ header, table, }: {
    header: MRT_Header<TData>;
    table: MRT_TableInstance<TData>;
}) => DropdownOption[] | undefined;

declare function defaultDisplayColumnProps<TData extends MRT_RowData>({ header, id, size, tableOptions, }: {
    header?: keyof MRT_Localization;
    id: MRT_DisplayColumnIds;
    size: number;
    tableOptions: MRT_DefinedTableOptions<TData>;
}): {
    readonly id: MRT_DisplayColumnIds;
    readonly header: string;
    readonly getUniqueValues?: _tanstack_react_table.AccessorFn<TData, unknown[]> | undefined;
    readonly getGroupingValue?: ((row: TData) => any) | undefined;
    readonly aggregationFn?: MRT_AggregationFn<TData> | MRT_AggregationFn<TData>[] | undefined;
    readonly columns?: MRT_ColumnDef<TData, unknown>[] | undefined;
    readonly filterFn?: MRT_FilterFn<TData> | undefined;
    readonly footer?: string;
    readonly sortingFn?: MRT_SortingFn<TData> | undefined;
    readonly meta?: _tanstack_react_table.ColumnMeta<TData, unknown> | undefined;
    readonly enableHiding?: boolean;
    readonly enablePinning?: boolean;
    readonly enableColumnFilter?: boolean;
    readonly enableGlobalFilter?: boolean;
    readonly enableMultiSort?: boolean;
    readonly enableSorting?: boolean;
    readonly invertSorting?: boolean;
    readonly sortDescFirst?: boolean;
    readonly sortUndefined?: false | -1 | 1 | "first" | "last";
    readonly enableGrouping?: boolean;
    readonly enableResizing?: boolean;
    readonly maxSize?: number;
    readonly minSize?: number;
    readonly size: number;
    readonly AggregatedCell?: ((props: {
        cell: MRT_Cell<TData, unknown>;
        column: MRT_Column<TData, unknown>;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
        staticColumnIndex?: number;
        staticRowIndex?: number;
    }) => react.ReactNode) | undefined;
    readonly Cell?: ((props: {
        cell: MRT_Cell<TData, unknown>;
        column: MRT_Column<TData, unknown>;
        renderedCellValue: react.ReactNode;
        row: MRT_Row<TData>;
        rowRef?: react.RefObject<HTMLTableRowElement>;
        staticColumnIndex?: number;
        staticRowIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => react.ReactNode) | undefined;
    readonly Edit?: ((props: {
        cell: MRT_Cell<TData, unknown>;
        column: MRT_Column<TData, unknown>;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => react.ReactNode) | undefined;
    readonly Filter?: ((props: {
        column: MRT_Column<TData, unknown>;
        header: MRT_Header<TData>;
        rangeFilterIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => react.ReactNode) | undefined;
    readonly Footer?: react.ReactNode | ((props: {
        column: MRT_Column<TData, unknown>;
        footer: MRT_Header<TData>;
        table: MRT_TableInstance<TData>;
    }) => react.ReactNode);
    readonly GroupedCell?: ((props: {
        cell: MRT_Cell<TData, unknown>;
        column: MRT_Column<TData, unknown>;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
        staticColumnIndex?: number;
        staticRowIndex?: number;
    }) => react.ReactNode) | undefined;
    readonly Header?: react.ReactNode | ((props: {
        column: MRT_Column<TData, unknown>;
        header: MRT_Header<TData>;
        table: MRT_TableInstance<TData>;
    }) => react.ReactNode);
    readonly PlaceholderCell?: ((props: {
        cell: MRT_Cell<TData, unknown>;
        column: MRT_Column<TData, unknown>;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => react.ReactNode) | undefined;
    readonly columnDefType?: "data" | "display" | "group";
    readonly columnFilterModeOptions?: Array<LiteralUnion<string & MRT_FilterOption>> | null;
    readonly editSelectOptions?: DropdownOption[] | ((props: {
        cell: MRT_Cell<TData, unknown>;
        column: MRT_Column<TData, unknown>;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => DropdownOption[]) | undefined;
    readonly editVariant?: "select" | "text";
    readonly enableClickToCopy?: boolean | "context-menu" | ((cell: MRT_Cell<TData, unknown>) => "context-menu" | boolean) | undefined;
    readonly enableColumnActions?: boolean;
    readonly enableColumnDragging?: boolean;
    readonly enableColumnFilterModes?: boolean;
    readonly enableColumnOrdering?: boolean;
    readonly enableEditing?: boolean | ((row: MRT_Row<TData>) => boolean) | undefined;
    readonly enableFilterMatchHighlighting?: boolean;
    readonly filterSelectOptions?: DropdownOption[];
    readonly filterVariant?: "autocomplete" | "checkbox" | "date" | "date-range" | "datetime" | "datetime-range" | "multi-select" | "range" | "range-slider" | "select" | "text" | "time" | "time-range";
    readonly grow?: boolean | number;
    readonly muiColumnActionsButtonProps?: _mui_material.IconButtonProps | ((props: {
        column: MRT_Column<TData, unknown>;
        table: MRT_TableInstance<TData>;
    }) => _mui_material.IconButtonProps) | undefined;
    readonly muiColumnDragHandleProps?: _mui_material.IconButtonProps | ((props: {
        column: MRT_Column<TData, unknown>;
        table: MRT_TableInstance<TData>;
    }) => _mui_material.IconButtonProps) | undefined;
    readonly muiCopyButtonProps?: _mui_material.ButtonProps | ((props: {
        cell: MRT_Cell<TData, unknown>;
        column: MRT_Column<TData, unknown>;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => _mui_material.ButtonProps) | undefined;
    readonly muiEditTextFieldProps?: _mui_material.TextFieldProps | ((props: {
        cell: MRT_Cell<TData, unknown>;
        column: MRT_Column<TData, unknown>;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => _mui_material.TextFieldProps) | undefined;
    readonly muiFilterAutocompleteProps?: _mui_material.AutocompleteProps<any, any, any, any, "div"> | ((props: {
        column: MRT_Column<TData, unknown>;
        table: MRT_TableInstance<TData>;
    }) => _mui_material.AutocompleteProps<any, any, any, any>) | undefined;
    readonly muiFilterCheckboxProps?: _mui_material.CheckboxProps | ((props: {
        column: MRT_Column<TData, unknown>;
        table: MRT_TableInstance<TData>;
    }) => _mui_material.CheckboxProps) | undefined;
    readonly muiFilterDatePickerProps?: _mui_x_date_pickers.DatePickerProps<never, false> | ((props: {
        column: MRT_Column<TData, unknown>;
        rangeFilterIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => _mui_x_date_pickers.DatePickerProps<never>) | undefined;
    readonly muiFilterDateTimePickerProps?: _mui_x_date_pickers.DateTimePickerProps<never, false> | ((props: {
        column: MRT_Column<TData, unknown>;
        rangeFilterIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => _mui_x_date_pickers.DateTimePickerProps<never>) | undefined;
    readonly muiFilterSliderProps?: _mui_material.SliderProps | ((props: {
        column: MRT_Column<TData, unknown>;
        table: MRT_TableInstance<TData>;
    }) => _mui_material.SliderProps) | undefined;
    readonly muiFilterTextFieldProps?: _mui_material.TextFieldProps | ((props: {
        column: MRT_Column<TData, unknown>;
        rangeFilterIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => _mui_material.TextFieldProps) | undefined;
    readonly muiFilterTimePickerProps?: _mui_x_date_pickers.TimePickerProps<never, false> | ((props: {
        column: MRT_Column<TData, unknown>;
        rangeFilterIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => _mui_x_date_pickers.TimePickerProps<never>) | undefined;
    readonly muiTableBodyCellProps?: _mui_material.TableCellProps | ((props: {
        cell: MRT_Cell<TData, unknown>;
        column: MRT_Column<TData, unknown>;
        row: MRT_Row<TData>;
        table: MRT_TableInstance<TData>;
    }) => _mui_material.TableCellProps) | undefined;
    readonly muiTableFooterCellProps?: _mui_material.TableCellProps | ((props: {
        column: MRT_Column<TData, unknown>;
        table: MRT_TableInstance<TData>;
    }) => _mui_material.TableCellProps) | undefined;
    readonly muiTableHeadCellProps?: _mui_material.TableCellProps | ((props: {
        column: MRT_Column<TData, unknown>;
        table: MRT_TableInstance<TData>;
    }) => _mui_material.TableCellProps) | undefined;
    readonly renderCellActionMenuItems?: ((props: {
        cell: MRT_Cell<TData, unknown>;
        closeMenu: () => void;
        column: MRT_Column<TData, unknown>;
        internalMenuItems: react.ReactNode[];
        row: MRT_Row<TData>;
        staticColumnIndex?: number;
        staticRowIndex?: number;
        table: MRT_TableInstance<TData>;
    }) => react.ReactNode[]) | undefined;
    readonly renderColumnActionsMenuItems?: ((props: {
        closeMenu: () => void;
        column: MRT_Column<TData, unknown>;
        internalColumnMenuItems: react.ReactNode[];
        table: MRT_TableInstance<TData>;
    }) => react.ReactNode[]) | undefined;
    readonly renderColumnFilterModeMenuItems?: ((props: {
        column: MRT_Column<TData, unknown>;
        internalFilterOptions: MRT_InternalFilterOption[];
        onSelectFilterMode: (filterMode: MRT_FilterOption) => void;
        table: MRT_TableInstance<TData>;
    }) => react.ReactNode[]) | undefined;
    readonly visibleInShowHideMenu?: boolean;
};
declare const showRowPinningColumn: <TData extends MRT_RowData>(tableOptions: MRT_StatefulTableOptions<TData>) => boolean;
declare const showRowDragColumn: <TData extends MRT_RowData>(tableOptions: MRT_StatefulTableOptions<TData>) => boolean;
declare const showRowExpandColumn: <TData extends MRT_RowData>(tableOptions: MRT_StatefulTableOptions<TData>) => boolean;
declare const showRowActionsColumn: <TData extends MRT_RowData>(tableOptions: MRT_StatefulTableOptions<TData>) => boolean;
declare const showRowSelectionColumn: <TData extends MRT_RowData>(tableOptions: MRT_StatefulTableOptions<TData>) => boolean;
declare const showRowNumbersColumn: <TData extends MRT_RowData>(tableOptions: MRT_StatefulTableOptions<TData>) => boolean;
declare const showRowSpacerColumn: <TData extends MRT_RowData>(tableOptions: MRT_StatefulTableOptions<TData>) => boolean;
declare const getLeadingDisplayColumnIds: <TData extends MRT_RowData>(tableOptions: MRT_StatefulTableOptions<TData>) => MRT_DisplayColumnIds[];
declare const getTrailingDisplayColumnIds: <TData extends MRT_RowData>(tableOptions: MRT_StatefulTableOptions<TData>) => MRT_DisplayColumnIds[];
declare const getDefaultColumnOrderIds: <TData extends MRT_RowData>(tableOptions: MRT_StatefulTableOptions<TData>, reset?: boolean) => string[];

declare const getMRT_Rows: <TData extends MRT_RowData>(table: MRT_TableInstance<TData>, all?: boolean) => MRT_Row<TData>[];
declare const getCanRankRows: <TData extends MRT_RowData>(table: MRT_TableInstance<TData>) => boolean | undefined;
declare const getIsRankingRows: <TData extends MRT_RowData>(table: MRT_TableInstance<TData>) => any;
declare const getIsRowSelected: <TData extends MRT_RowData>({ row, table, }: {
    row: MRT_Row<TData>;
    table: MRT_TableInstance<TData>;
}) => boolean | undefined;
declare const getMRT_RowSelectionHandler: <TData extends MRT_RowData>({ row, staticRowIndex, table, }: {
    row: MRT_Row<TData>;
    staticRowIndex?: number;
    table: MRT_TableInstance<TData>;
}) => (event: ChangeEvent<HTMLInputElement> | MouseEvent<HTMLTableRowElement>, value?: boolean) => void;
declare const getMRT_SelectAllHandler: <TData extends MRT_RowData>({ table }: {
    table: MRT_TableInstance<TData>;
}) => (event: ChangeEvent<HTMLInputElement> | MouseEvent<HTMLButtonElement>, value?: boolean, forceAll?: boolean) => void;

declare const useMaterialReactTable: <TData extends MRT_RowData>(tableOptions: MRT_TableOptions<TData>) => MRT_TableInstance<TData>;

declare const useMRT_ColumnVirtualizer: <TData extends MRT_RowData, TScrollElement extends Element | Window = HTMLDivElement, TItemElement extends Element = HTMLTableCellElement>(table: MRT_TableInstance<TData>) => MRT_ColumnVirtualizer | undefined;

declare const useMRT_Effects: <TData extends MRT_RowData>(table: MRT_TableInstance<TData>) => void;

declare const useMRT_RowVirtualizer: <TData extends MRT_RowData, TScrollElement extends Element | Window = HTMLDivElement, TItemElement extends Element = HTMLTableRowElement>(table: MRT_TableInstance<TData>, rows?: MRT_Row<TData>[]) => MRT_RowVirtualizer<TScrollElement, TItemElement> | undefined;

declare const useMRT_Rows: <TData extends MRT_RowData>(table: MRT_TableInstance<TData>) => MRT_Row<TData>[];

/**
 * The MRT hook that wraps the TanStack useReactTable hook and adds additional functionality
 * @param definedTableOptions - table options with proper defaults set
 * @returns the MRT table instance
 */
declare const useMRT_TableInstance: <TData extends MRT_RowData>(definedTableOptions: MRT_DefinedTableOptions<TData>) => MRT_TableInstance<TData>;

declare const MRT_DefaultColumn: {
    readonly filterVariant: "text";
    readonly maxSize: 1000;
    readonly minSize: 40;
    readonly size: 180;
};
declare const MRT_DefaultDisplayColumn: {
    readonly columnDefType: "display";
    readonly enableClickToCopy: false;
    readonly enableColumnActions: false;
    readonly enableColumnDragging: false;
    readonly enableColumnFilter: false;
    readonly enableColumnOrdering: false;
    readonly enableEditing: false;
    readonly enableGlobalFilter: false;
    readonly enableGrouping: false;
    readonly enableHiding: false;
    readonly enableResizing: false;
    readonly enableSorting: false;
};
declare const useMRT_TableOptions: <TData extends MRT_RowData>(tableOptions: MRT_TableOptions<TData>) => MRT_DefinedTableOptions<TData>;

type TableInstanceProp<TData extends MRT_RowData> = {
    table: MRT_TableInstance<TData>;
};
type MaterialReactTableProps<TData extends MRT_RowData> = Xor<TableInstanceProp<TData>, MRT_TableOptions<TData>>;
declare const MaterialReactTable: <TData extends MRT_RowData>(props: MaterialReactTableProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_TableBodyProps<TData extends MRT_RowData> extends TableBodyProps {
    columnVirtualizer?: MRT_ColumnVirtualizer;
    table: MRT_TableInstance<TData>;
}
declare const MRT_TableBody: <TData extends MRT_RowData>({ columnVirtualizer, table, ...rest }: MRT_TableBodyProps<TData>) => react_jsx_runtime.JSX.Element;
declare const Memo_MRT_TableBody: typeof MRT_TableBody;

interface MRT_TableBodyCellProps<TData extends MRT_RowData> extends TableCellProps {
    cell: MRT_Cell<TData>;
    numRows?: number;
    rowRef: RefObject<HTMLTableRowElement>;
    staticColumnIndex?: number;
    staticRowIndex: number;
    table: MRT_TableInstance<TData>;
}
declare const MRT_TableBodyCell: <TData extends MRT_RowData>({ cell, numRows, rowRef, staticColumnIndex, staticRowIndex, table, ...rest }: MRT_TableBodyCellProps<TData>) => react_jsx_runtime.JSX.Element;
declare const Memo_MRT_TableBodyCell: typeof MRT_TableBodyCell;

interface MRT_TableBodyCellValueProps<TData extends MRT_RowData> {
    cell: MRT_Cell<TData>;
    rowRef?: RefObject<HTMLTableRowElement>;
    staticColumnIndex?: number;
    staticRowIndex?: number;
    table: MRT_TableInstance<TData>;
}
declare const MRT_TableBodyCellValue: <TData extends MRT_RowData>({ cell, rowRef, staticColumnIndex, staticRowIndex, table, }: MRT_TableBodyCellValueProps<TData>) => ReactNode;

interface MRT_TableBodyRowProps<TData extends MRT_RowData> extends TableRowProps {
    columnVirtualizer?: MRT_ColumnVirtualizer;
    numRows?: number;
    pinnedRowIds?: string[];
    row: MRT_Row<TData>;
    rowVirtualizer?: MRT_RowVirtualizer;
    staticRowIndex: number;
    table: MRT_TableInstance<TData>;
    virtualRow?: VirtualItem;
}
declare const MRT_TableBodyRow: <TData extends MRT_RowData>({ columnVirtualizer, numRows, pinnedRowIds, row, rowVirtualizer, staticRowIndex, table, virtualRow, ...rest }: MRT_TableBodyRowProps<TData>) => react_jsx_runtime.JSX.Element;
declare const Memo_MRT_TableBodyRow: typeof MRT_TableBodyRow;

interface MRT_TableBodyRowGrabHandleProps<TData extends MRT_RowData> extends IconButtonProps {
    row: MRT_Row<TData>;
    rowRef: RefObject<HTMLTableRowElement>;
    table: MRT_TableInstance<TData>;
}
declare const MRT_TableBodyRowGrabHandle: <TData extends MRT_RowData>({ row, rowRef, table, ...rest }: MRT_TableBodyRowGrabHandleProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_TableBodyRowPinButtonProps<TData extends MRT_RowData> extends IconButtonProps {
    row: MRT_Row<TData>;
    table: MRT_TableInstance<TData>;
}
declare const MRT_TableBodyRowPinButton: <TData extends MRT_RowData>({ row, table, ...rest }: MRT_TableBodyRowPinButtonProps<TData>) => react_jsx_runtime.JSX.Element | null;

interface MRT_TableDetailPanelProps<TData extends MRT_RowData> extends TableCellProps {
    parentRowRef: RefObject<HTMLTableRowElement>;
    row: MRT_Row<TData>;
    rowVirtualizer?: MRT_RowVirtualizer;
    staticRowIndex: number;
    table: MRT_TableInstance<TData>;
    virtualRow?: MRT_VirtualItem;
}
declare const MRT_TableDetailPanel: <TData extends MRT_RowData>({ parentRowRef, row, rowVirtualizer, staticRowIndex, table, virtualRow, ...rest }: MRT_TableDetailPanelProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_ColumnPinningButtonsProps<TData extends MRT_RowData> extends BoxProps {
    column: MRT_Column<TData>;
    table: MRT_TableInstance<TData>;
}
declare const MRT_ColumnPinningButtons: <TData extends MRT_RowData>({ column, table, ...rest }: MRT_ColumnPinningButtonsProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_CopyButtonProps<TData extends MRT_RowData> extends ButtonProps {
    cell: MRT_Cell<TData>;
    table: MRT_TableInstance<TData>;
}
declare const MRT_CopyButton: <TData extends MRT_RowData>({ cell, table, ...rest }: MRT_CopyButtonProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_EditActionButtonsProps<TData extends MRT_RowData> extends BoxProps {
    row: MRT_Row<TData>;
    table: MRT_TableInstance<TData>;
    variant?: 'icon' | 'text';
}
declare const MRT_EditActionButtons: <TData extends MRT_RowData>({ row, table, variant, ...rest }: MRT_EditActionButtonsProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_ExpandAllButtonProps<TData extends MRT_RowData> extends IconButtonProps {
    table: MRT_TableInstance<TData>;
}
declare const MRT_ExpandAllButton: <TData extends MRT_RowData>({ table, ...rest }: MRT_ExpandAllButtonProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_ExpandButtonProps<TData extends MRT_RowData> extends IconButtonProps {
    row: MRT_Row<TData>;
    staticRowIndex?: number;
    table: MRT_TableInstance<TData>;
}
declare const MRT_ExpandButton: <TData extends MRT_RowData>({ row, staticRowIndex, table, }: MRT_ExpandButtonProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_GrabHandleButtonProps<TData extends MRT_RowData> extends IconButtonProps {
    iconButtonProps?: IconButtonProps;
    location?: 'column' | 'row';
    onDragEnd: DragEventHandler<HTMLButtonElement>;
    onDragStart: DragEventHandler<HTMLButtonElement>;
    table: MRT_TableInstance<TData>;
}
declare const MRT_GrabHandleButton: <TData extends MRT_RowData>({ location, table, ...rest }: MRT_GrabHandleButtonProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_RowPinButtonProps<TData extends MRT_RowData> extends IconButtonProps {
    pinningPosition: RowPinningPosition;
    row: MRT_Row<TData>;
    table: MRT_TableInstance<TData>;
}
declare const MRT_RowPinButton: <TData extends MRT_RowData>({ pinningPosition, row, table, ...rest }: MRT_RowPinButtonProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_ShowHideColumnsButtonProps<TData extends MRT_RowData> extends IconButtonProps {
    table: MRT_TableInstance<TData>;
}
declare const MRT_ShowHideColumnsButton: <TData extends MRT_RowData>({ table, ...rest }: MRT_ShowHideColumnsButtonProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_ToggleDensePaddingButtonProps<TData extends MRT_RowData> extends IconButtonProps {
    table: MRT_TableInstance<TData>;
}
declare const MRT_ToggleDensePaddingButton: <TData extends MRT_RowData>({ table, ...rest }: MRT_ToggleDensePaddingButtonProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_ToggleFiltersButtonProps<TData extends MRT_RowData> extends IconButtonProps {
    table: MRT_TableInstance<TData>;
}
declare const MRT_ToggleFiltersButton: <TData extends MRT_RowData>({ table, ...rest }: MRT_ToggleFiltersButtonProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_ToggleFullScreenButtonProps<TData extends MRT_RowData> extends IconButtonProps {
    table: MRT_TableInstance<TData>;
}
declare const MRT_ToggleFullScreenButton: <TData extends MRT_RowData>({ table, ...rest }: MRT_ToggleFullScreenButtonProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_ToggleGlobalFilterButtonProps<TData extends MRT_RowData> extends IconButtonProps {
    table: MRT_TableInstance<TData>;
}
declare const MRT_ToggleGlobalFilterButton: <TData extends MRT_RowData>({ table, ...rest }: MRT_ToggleGlobalFilterButtonProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_ToggleRowActionMenuButtonProps<TData extends MRT_RowData> extends IconButtonProps {
    cell: MRT_Cell<TData>;
    row: MRT_Row<TData>;
    staticRowIndex?: number;
    table: MRT_TableInstance<TData>;
}
declare const MRT_ToggleRowActionMenuButton: <TData extends MRT_RowData>({ cell, row, staticRowIndex, table, ...rest }: MRT_ToggleRowActionMenuButtonProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_TableFooterProps<TData extends MRT_RowData> extends TableFooterProps {
    columnVirtualizer?: MRT_ColumnVirtualizer;
    table: MRT_TableInstance<TData>;
}
declare const MRT_TableFooter: <TData extends MRT_RowData>({ columnVirtualizer, table, ...rest }: MRT_TableFooterProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_TableFooterCellProps<TData extends MRT_RowData> extends TableCellProps {
    footer: MRT_Header<TData>;
    staticColumnIndex?: number;
    table: MRT_TableInstance<TData>;
}
declare const MRT_TableFooterCell: <TData extends MRT_RowData>({ footer, staticColumnIndex, table, ...rest }: MRT_TableFooterCellProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_TableFooterRowProps<TData extends MRT_RowData> extends TableRowProps {
    columnVirtualizer?: MRT_ColumnVirtualizer;
    footerGroup: MRT_HeaderGroup<TData>;
    table: MRT_TableInstance<TData>;
}
declare const MRT_TableFooterRow: <TData extends MRT_RowData>({ columnVirtualizer, footerGroup, table, ...rest }: MRT_TableFooterRowProps<TData>) => react_jsx_runtime.JSX.Element | null;

interface MRT_TableHeadProps<TData extends MRT_RowData> extends TableHeadProps {
    columnVirtualizer?: MRT_ColumnVirtualizer;
    table: MRT_TableInstance<TData>;
}
declare const MRT_TableHead: <TData extends MRT_RowData>({ columnVirtualizer, table, ...rest }: MRT_TableHeadProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_TableHeadCellProps<TData extends MRT_RowData> extends TableCellProps {
    columnVirtualizer?: MRT_ColumnVirtualizer;
    header: MRT_Header<TData>;
    staticColumnIndex?: number;
    table: MRT_TableInstance<TData>;
}
declare const MRT_TableHeadCell: <TData extends MRT_RowData>({ columnVirtualizer, header, staticColumnIndex, table, ...rest }: MRT_TableHeadCellProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_TableHeadCellColumnActionsButtonProps<TData extends MRT_RowData> extends IconButtonProps {
    header: MRT_Header<TData>;
    table: MRT_TableInstance<TData>;
}
declare const MRT_TableHeadCellColumnActionsButton: <TData extends MRT_RowData>({ header, table, ...rest }: MRT_TableHeadCellColumnActionsButtonProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_TableHeadCellFilterContainerProps<TData extends MRT_RowData> extends CollapseProps {
    header: MRT_Header<TData>;
    table: MRT_TableInstance<TData>;
}
declare const MRT_TableHeadCellFilterContainer: <TData extends MRT_RowData>({ header, table, ...rest }: MRT_TableHeadCellFilterContainerProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_TableHeadCellFilterLabelProps<TData extends MRT_RowData> extends IconButtonProps {
    header: MRT_Header<TData>;
    table: MRT_TableInstance<TData>;
}
declare const MRT_TableHeadCellFilterLabel: <TData extends MRT_RowData = {}>({ header, table, ...rest }: MRT_TableHeadCellFilterLabelProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_TableHeadCellGrabHandleProps<TData extends MRT_RowData> extends IconButtonProps {
    column: MRT_Column<TData>;
    table: MRT_TableInstance<TData>;
    tableHeadCellRef: RefObject<HTMLTableCellElement>;
}
declare const MRT_TableHeadCellGrabHandle: <TData extends MRT_RowData>({ column, table, tableHeadCellRef, ...rest }: MRT_TableHeadCellGrabHandleProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_TableHeadCellResizeHandleProps<TData extends MRT_RowData> extends DividerProps {
    header: MRT_Header<TData>;
    table: MRT_TableInstance<TData>;
}
declare const MRT_TableHeadCellResizeHandle: <TData extends MRT_RowData>({ header, table, ...rest }: MRT_TableHeadCellResizeHandleProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_TableHeadCellSortLabelProps<TData extends MRT_RowData> extends TableSortLabelProps {
    header: MRT_Header<TData>;
    table: MRT_TableInstance<TData>;
}
declare const MRT_TableHeadCellSortLabel: <TData extends MRT_RowData>({ header, table, ...rest }: MRT_TableHeadCellSortLabelProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_TableHeadRowProps<TData extends MRT_RowData> extends TableRowProps {
    columnVirtualizer?: MRT_ColumnVirtualizer;
    headerGroup: MRT_HeaderGroup<TData>;
    table: MRT_TableInstance<TData>;
}
declare const MRT_TableHeadRow: <TData extends MRT_RowData>({ columnVirtualizer, headerGroup, table, ...rest }: MRT_TableHeadRowProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_EditCellTextFieldProps<TData extends MRT_RowData> extends TextFieldProps<'standard'> {
    cell: MRT_Cell<TData>;
    table: MRT_TableInstance<TData>;
}
declare const MRT_EditCellTextField: <TData extends MRT_RowData>({ cell, table, ...rest }: MRT_EditCellTextFieldProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_FilterCheckboxProps<TData extends MRT_RowData> extends CheckboxProps {
    column: MRT_Column<TData>;
    table: MRT_TableInstance<TData>;
}
declare const MRT_FilterCheckbox: <TData extends MRT_RowData>({ column, table, ...rest }: MRT_FilterCheckboxProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_FilterRangeFieldsProps<TData extends MRT_RowData> extends BoxProps {
    header: MRT_Header<TData>;
    table: MRT_TableInstance<TData>;
}
declare const MRT_FilterRangeFields: <TData extends MRT_RowData>({ header, table, ...rest }: MRT_FilterRangeFieldsProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_FilterRangeSliderProps<TData extends MRT_RowData> extends SliderProps {
    header: MRT_Header<TData>;
    table: MRT_TableInstance<TData>;
}
declare const MRT_FilterRangeSlider: <TData extends MRT_RowData>({ header, table, ...rest }: MRT_FilterRangeSliderProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_FilterTextFieldProps<TData extends MRT_RowData> extends TextFieldProps<'standard'> {
    header: MRT_Header<TData>;
    rangeFilterIndex?: number;
    table: MRT_TableInstance<TData>;
}
declare const MRT_FilterTextField: <TData extends MRT_RowData>({ header, rangeFilterIndex, table, ...rest }: MRT_FilterTextFieldProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_GlobalFilterTextFieldProps<TData extends MRT_RowData> extends TextFieldProps<'standard'> {
    table: MRT_TableInstance<TData>;
}
declare const MRT_GlobalFilterTextField: <TData extends MRT_RowData>({ table, ...rest }: MRT_GlobalFilterTextFieldProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_SelectCheckboxProps<TData extends MRT_RowData> extends CheckboxProps {
    row?: MRT_Row<TData>;
    staticRowIndex?: number;
    table: MRT_TableInstance<TData>;
}
declare const MRT_SelectCheckbox: <TData extends MRT_RowData>({ row, staticRowIndex, table, ...rest }: MRT_SelectCheckboxProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_ActionMenuItemProps<TData extends MRT_RowData> extends MenuItemProps {
    icon: ReactNode;
    label: string;
    onOpenSubMenu?: MenuItemProps['onClick'] | MenuItemProps['onMouseEnter'];
    table: MRT_TableInstance<TData>;
}
declare const MRT_ActionMenuItem: <TData extends MRT_RowData>({ icon, label, onOpenSubMenu, table, ...rest }: MRT_ActionMenuItemProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_ColumnActionMenuProps<TData extends MRT_RowData> extends Partial<MenuProps> {
    anchorEl: HTMLElement | null;
    header: MRT_Header<TData>;
    setAnchorEl: (anchorEl: HTMLElement | null) => void;
    table: MRT_TableInstance<TData>;
}
declare const MRT_ColumnActionMenu: <TData extends MRT_RowData>({ anchorEl, header, setAnchorEl, table, ...rest }: MRT_ColumnActionMenuProps<TData>) => react_jsx_runtime.JSX.Element;

declare const mrtFilterOptions: (localization: MRT_Localization) => MRT_InternalFilterOption[];
interface MRT_FilterOptionMenuProps<TData extends MRT_RowData> extends Partial<MenuProps> {
    anchorEl: HTMLElement | null;
    header?: MRT_Header<TData>;
    onSelect?: () => void;
    setAnchorEl: (anchorEl: HTMLElement | null) => void;
    setFilterValue?: (filterValue: any) => void;
    table: MRT_TableInstance<TData>;
}
declare const MRT_FilterOptionMenu: <TData extends MRT_RowData>({ anchorEl, header, onSelect, setAnchorEl, setFilterValue, table, ...rest }: MRT_FilterOptionMenuProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_RowActionMenuProps<TData extends MRT_RowData> extends Partial<MenuProps> {
    anchorEl: HTMLElement | null;
    handleEdit: (event: MouseEvent) => void;
    row: MRT_Row<TData>;
    setAnchorEl: (anchorEl: HTMLElement | null) => void;
    staticRowIndex?: number;
    table: MRT_TableInstance<TData>;
}
declare const MRT_RowActionMenu: <TData extends MRT_RowData>({ anchorEl, handleEdit, row, setAnchorEl, staticRowIndex, table, ...rest }: MRT_RowActionMenuProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_ShowHideColumnsMenuProps<TData extends MRT_RowData> extends Partial<MenuProps> {
    anchorEl: HTMLElement | null;
    isSubMenu?: boolean;
    setAnchorEl: (anchorEl: HTMLElement | null) => void;
    table: MRT_TableInstance<TData>;
}
declare const MRT_ShowHideColumnsMenu: <TData extends MRT_RowData>({ anchorEl, setAnchorEl, table, ...rest }: MRT_ShowHideColumnsMenuProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_ShowHideColumnsMenuItemsProps<TData extends MRT_RowData> extends MenuItemProps {
    allColumns: MRT_Column<TData>[];
    column: MRT_Column<TData>;
    hoveredColumn: MRT_Column<TData> | null;
    isNestedColumns: boolean;
    setHoveredColumn: Dispatch<SetStateAction<MRT_Column<TData> | null>>;
    table: MRT_TableInstance<TData>;
}
declare const MRT_ShowHideColumnsMenuItems: <TData extends MRT_RowData>({ allColumns, column, hoveredColumn, isNestedColumns, setHoveredColumn, table, ...rest }: MRT_ShowHideColumnsMenuItemsProps<TData>) => react_jsx_runtime.JSX.Element | null;

interface MRT_EditRowModalProps<TData extends MRT_RowData> extends Partial<DialogProps> {
    open: boolean;
    table: MRT_TableInstance<TData>;
}
declare const MRT_EditRowModal: <TData extends MRT_RowData>({ open, table, ...rest }: MRT_EditRowModalProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_TableProps<TData extends MRT_RowData> extends TableProps {
    table: MRT_TableInstance<TData>;
}
declare const MRT_Table: <TData extends MRT_RowData>({ table, ...rest }: MRT_TableProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_TableContainerProps<TData extends MRT_RowData> extends TableContainerProps {
    table: MRT_TableInstance<TData>;
}
declare const MRT_TableContainer: <TData extends MRT_RowData>({ table, ...rest }: MRT_TableContainerProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_TableLoadingOverlayProps<TData extends MRT_RowData> extends CircularProgressProps {
    table: MRT_TableInstance<TData>;
}
declare const MRT_TableLoadingOverlay: <TData extends MRT_RowData>({ table, ...rest }: MRT_TableLoadingOverlayProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_TablePaperProps<TData extends MRT_RowData> extends PaperProps {
    table: MRT_TableInstance<TData>;
}
declare const MRT_TablePaper: <TData extends MRT_RowData>({ table, ...rest }: MRT_TablePaperProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_BottomToolbarProps<TData extends MRT_RowData> extends BoxProps {
    table: MRT_TableInstance<TData>;
}
declare const MRT_BottomToolbar: <TData extends MRT_RowData>({ table, ...rest }: MRT_BottomToolbarProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_LinearProgressBarProps<TData extends MRT_RowData> extends LinearProgressProps {
    isTopToolbar: boolean;
    table: MRT_TableInstance<TData>;
}
declare const MRT_LinearProgressBar: <TData extends MRT_RowData>({ isTopToolbar, table, ...rest }: MRT_LinearProgressBarProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_TablePaginationProps<TData extends MRT_RowData> extends Partial<PaginationProps & {
    SelectProps?: Partial<SelectProps>;
    disabled?: boolean;
    rowsPerPageOptions?: {
        label: string;
        value: number;
    }[] | number[];
    showRowsPerPage?: boolean;
}> {
    position?: 'bottom' | 'top';
    table: MRT_TableInstance<TData>;
}
declare const MRT_TablePagination: <TData extends MRT_RowData>({ position, table, ...rest }: MRT_TablePaginationProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_ToolbarAlertBannerProps<TData extends MRT_RowData> extends AlertProps {
    stackAlertBanner?: boolean;
    table: MRT_TableInstance<TData>;
}
declare const MRT_ToolbarAlertBanner: <TData extends MRT_RowData>({ stackAlertBanner, table, ...rest }: MRT_ToolbarAlertBannerProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_ToolbarDropZoneProps<TData extends MRT_RowData> extends BoxProps {
    table: MRT_TableInstance<TData>;
}
declare const MRT_ToolbarDropZone: <TData extends MRT_RowData>({ table, ...rest }: MRT_ToolbarDropZoneProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_ToolbarInternalButtonsProps<TData extends MRT_RowData> extends BoxProps {
    table: MRT_TableInstance<TData>;
}
declare const MRT_ToolbarInternalButtons: <TData extends MRT_RowData>({ table, ...rest }: MRT_ToolbarInternalButtonsProps<TData>) => react_jsx_runtime.JSX.Element;

interface MRT_TopToolbarProps<TData extends MRT_RowData> {
    table: MRT_TableInstance<TData>;
}
declare const MRT_TopToolbar: <TData extends MRT_RowData>({ table, }: MRT_TopToolbarProps<TData>) => react_jsx_runtime.JSX.Element;

export { type DropdownOption, type LiteralUnion, MRT_ActionMenuItem, type MRT_ActionMenuItemProps, type MRT_AggregationFn, MRT_AggregationFns, type MRT_AggregationOption, MRT_BottomToolbar, type MRT_BottomToolbarProps, type MRT_Cell, type MRT_Column, MRT_ColumnActionMenu, type MRT_ColumnActionMenuProps, type MRT_ColumnDef, type MRT_ColumnFilterFnsState, type MRT_ColumnFiltersState, type MRT_ColumnHelper, type MRT_ColumnOrderState, MRT_ColumnPinningButtons, type MRT_ColumnPinningButtonsProps, type MRT_ColumnPinningState, type MRT_ColumnSizingInfoState, type MRT_ColumnSizingState, type MRT_ColumnVirtualizer, MRT_CopyButton, type MRT_CopyButtonProps, MRT_DefaultColumn, MRT_DefaultDisplayColumn, type MRT_DefinedColumnDef, type MRT_DefinedTableOptions, type MRT_DensityState, type MRT_DisplayColumnDef, type MRT_DisplayColumnIds, MRT_EditActionButtons, type MRT_EditActionButtonsProps, MRT_EditCellTextField, type MRT_EditCellTextFieldProps, MRT_EditRowModal, type MRT_EditRowModalProps, MRT_ExpandAllButton, type MRT_ExpandAllButtonProps, MRT_ExpandButton, type MRT_ExpandButtonProps, type MRT_ExpandedState, MRT_FilterCheckbox, type MRT_FilterCheckboxProps, type MRT_FilterFn, MRT_FilterFns, type MRT_FilterOption, MRT_FilterOptionMenu, type MRT_FilterOptionMenuProps, MRT_FilterRangeFields, type MRT_FilterRangeFieldsProps, MRT_FilterRangeSlider, type MRT_FilterRangeSliderProps, MRT_FilterTextField, type MRT_FilterTextFieldProps, MRT_GlobalFilterTextField, type MRT_GlobalFilterTextFieldProps, MRT_GrabHandleButton, type MRT_GrabHandleButtonProps, type MRT_GroupColumnDef, type MRT_GroupingState, type MRT_Header, type MRT_HeaderGroup, type MRT_Icons, type MRT_InternalFilterOption, MRT_LinearProgressBar, type MRT_LinearProgressBarProps, type MRT_Localization, type MRT_PaginationState, type MRT_Row, MRT_RowActionMenu, type MRT_RowActionMenuProps, type MRT_RowData, type MRT_RowModel, MRT_RowPinButton, type MRT_RowPinButtonProps, type MRT_RowSelectionState, type MRT_RowVirtualizer, MRT_SelectCheckbox, type MRT_SelectCheckboxProps, MRT_ShowHideColumnsButton, type MRT_ShowHideColumnsButtonProps, MRT_ShowHideColumnsMenu, MRT_ShowHideColumnsMenuItems, type MRT_ShowHideColumnsMenuItemsProps, type MRT_ShowHideColumnsMenuProps, type MRT_SortingFn, MRT_SortingFns, type MRT_SortingOption, type MRT_SortingState, type MRT_StatefulTableOptions, MRT_Table, MRT_TableBody, MRT_TableBodyCell, type MRT_TableBodyCellProps, MRT_TableBodyCellValue, type MRT_TableBodyCellValueProps, type MRT_TableBodyProps, MRT_TableBodyRow, MRT_TableBodyRowGrabHandle, type MRT_TableBodyRowGrabHandleProps, MRT_TableBodyRowPinButton, type MRT_TableBodyRowPinButtonProps, type MRT_TableBodyRowProps, MRT_TableContainer, type MRT_TableContainerProps, MRT_TableDetailPanel, type MRT_TableDetailPanelProps, MRT_TableFooter, MRT_TableFooterCell, type MRT_TableFooterCellProps, type MRT_TableFooterProps, MRT_TableFooterRow, type MRT_TableFooterRowProps, MRT_TableHead, MRT_TableHeadCell, MRT_TableHeadCellColumnActionsButton, type MRT_TableHeadCellColumnActionsButtonProps, MRT_TableHeadCellFilterContainer, type MRT_TableHeadCellFilterContainerProps, MRT_TableHeadCellFilterLabel, type MRT_TableHeadCellFilterLabelProps, MRT_TableHeadCellGrabHandle, type MRT_TableHeadCellGrabHandleProps, type MRT_TableHeadCellProps, MRT_TableHeadCellResizeHandle, type MRT_TableHeadCellResizeHandleProps, MRT_TableHeadCellSortLabel, type MRT_TableHeadCellSortLabelProps, type MRT_TableHeadProps, MRT_TableHeadRow, type MRT_TableHeadRowProps, type MRT_TableInstance, MRT_TableLoadingOverlay, type MRT_TableLoadingOverlayProps, type MRT_TableOptions, MRT_TablePagination, type MRT_TablePaginationProps, MRT_TablePaper, type MRT_TablePaperProps, type MRT_TableProps, type MRT_TableState, type MRT_Theme, MRT_ToggleDensePaddingButton, type MRT_ToggleDensePaddingButtonProps, MRT_ToggleFiltersButton, type MRT_ToggleFiltersButtonProps, MRT_ToggleFullScreenButton, type MRT_ToggleFullScreenButtonProps, MRT_ToggleGlobalFilterButton, type MRT_ToggleGlobalFilterButtonProps, MRT_ToggleRowActionMenuButton, type MRT_ToggleRowActionMenuButtonProps, MRT_ToolbarAlertBanner, type MRT_ToolbarAlertBannerProps, MRT_ToolbarDropZone, type MRT_ToolbarDropZoneProps, MRT_ToolbarInternalButtons, type MRT_ToolbarInternalButtonsProps, MRT_TopToolbar, type MRT_TopToolbarProps, type MRT_Updater, type MRT_VirtualItem, type MRT_Virtualizer, type MRT_VirtualizerOptions, type MRT_VisibilityState, MaterialReactTable, type MaterialReactTableProps, Memo_MRT_TableBody, Memo_MRT_TableBodyCell, Memo_MRT_TableBodyRow, type Prettify, type Xor, createMRTColumnHelper, createRow, defaultDisplayColumnProps, flexRender, getAllLeafColumnDefs, getCanRankRows, getColumnFilterInfo, getColumnId, getDefaultColumnFilterFn, getDefaultColumnOrderIds, getIsRankingRows, getIsRowSelected, getLeadingDisplayColumnIds, getMRT_RowSelectionHandler, getMRT_Rows, getMRT_SelectAllHandler, getTrailingDisplayColumnIds, isCellEditable, mrtFilterOptions, openEditingCell, prepareColumns, rankGlobalFuzzy, reorderColumn, showRowActionsColumn, showRowDragColumn, showRowExpandColumn, showRowNumbersColumn, showRowPinningColumn, showRowSelectionColumn, showRowSpacerColumn, useDropdownOptions, useMRT_ColumnVirtualizer, useMRT_Effects, useMRT_RowVirtualizer, useMRT_Rows, useMRT_TableInstance, useMRT_TableOptions, useMaterialReactTable };

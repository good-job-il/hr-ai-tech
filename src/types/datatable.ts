import { ReactNode } from 'react';

export type SortOrder = 'asc' | 'desc' | null;
export type FilterOperator = 'equals' | 'contains' | 'startsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in';

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (value: any, row: T) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  width?: string | number;
  className?: string;
  headerClassName?: string;
}

export interface SortConfig {
  columnId: string;
  order: SortOrder;
}

export interface FilterConfig {
  columnId: string;
  operator: FilterOperator;
  value: any;
}

export interface DataTableState<T> {
  data: T[];
  isLoading: boolean;
  error?: Error | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  sort: SortConfig | null;
  filters: FilterConfig[];
  selectedRows: Set<string | number>;
  expandedRows: Set<string | number>;
}

export interface DataTableConfig<T> {
  columns: ColumnDef<T>[];
  pageSize?: number;
  serverSide?: boolean;
  selectable?: boolean;
  expandable?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  rowId?: keyof T;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
  onSort?: (columnId: string, order: SortOrder) => void;
  onFilter?: (filters: FilterConfig[]) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onRowSelect?: (rowId: string | number) => void;
  onRowAction?: (rowId: string | number, action: string) => void;
  serverSide?: boolean;
  selectable?: boolean;
  emptyMessage?: string;
  className?: string;
}

export interface BulkAction {
  id: string;
  label: string;
  icon?: ReactNode;
  handler: (rowIds: (string | number)[]) => Promise<void>;
  danger?: boolean;
}

export interface RowAction {
  id: string;
  label: string;
  icon?: ReactNode;
  handler: (rowId: string | number) => Promise<void>;
  danger?: boolean;
}
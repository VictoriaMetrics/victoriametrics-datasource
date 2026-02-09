import { css } from '@emotion/css';
import { debounce } from 'lodash';
import React, { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { CellProps, DefaultSortTypes } from 'react-table';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Input, InteractiveTable, Modal, MultiSelect, Spinner, useStyles2 } from '@grafana/ui';

import { PrometheusDatasource } from '../../../datasource';

import { MetricMetadata, useFetchMetricsWithMetadata } from './useFetchMetricsWithMetadata';

export interface MetricsExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasource: PrometheusDatasource;
  onSelectMetric: (metric: string) => void;
  selectedMetric?: string;
}

type MetricMetadataColumn = {
  id: string;
  header: string;
  cell?: (props: CellProps<MetricMetadata>) => React.ReactNode;
  sortType?: DefaultSortTypes;
};

const PAGE_SIZE = 40;
const DEBOUNCE_DELAY = 300;

const typeOptions = [
  {
    label: 'Counter',
    value: 'counter',
    description: 'A cumulative metric that represents a single monotonically increasing counter whose value can only increase or be reset to zero on restart.'
  },
  {
    label: 'Gauge',
    value: 'gauge',
    description: 'A metric that represents a single numerical value that can arbitrarily go up and down.'
  },
  {
    label: 'Histogram',
    value: 'histogram',
    description: 'A histogram samples observations (usually things like request durations or response sizes) and counts them in configurable buckets.'
  },
  {
    label: 'Summary',
    value: 'summary',
    description: 'A summary samples observations (usually things like request durations and response sizes) and can calculate configurable quantiles over a sliding time window.'
  },
  {
    label: 'Unknown',
    value: 'unknown',
    description: 'These metrics have been given the type unknown in the metadata.'
  },
  {
    label: 'No type',
    value: 'no_type',
    description: 'These metrics have no defined type in the metadata.'
  },
];

export const MetricsExplorerModal: React.FC<MetricsExplorerModalProps> = ({
  isOpen,
  onClose,
  datasource,
  onSelectMetric,
  selectedMetric,
}) => {
  const styles = useStyles2(getStyles);

  const [nameFilter, setNameFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const { fetchMetadata, metrics, isLoading, error } = useFetchMetricsWithMetadata(datasource);

  useEffect(() => {
    if (isOpen) {
      fetchMetadata();
    }
  }, [isOpen, fetchMetadata]);

  const setDebouncedNameFilter = useMemo(() => debounce(setNameFilter, DEBOUNCE_DELAY), []);

  useEffect(() => {
    return () => {
      setDebouncedNameFilter.cancel();
    };
  }, [setDebouncedNameFilter]);

  const filteredMetrics = useMemo(() => {
    return metrics.filter((metric) => {
      const matchesName = metric.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesType =
        !typeFilter.length
        || typeFilter.includes(metric.type)
        || (typeFilter.includes('no_type') && !metric.type);
      return matchesName && matchesType;
    });
  }, [metrics, nameFilter, typeFilter]);

  const handleNameFilterChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setDebouncedNameFilter(e.target.value);
    },
    [setDebouncedNameFilter]
  );

  const handleTypeFilterChange = useCallback((option: SelectableValue<string>[]) => {
    const types = option.map((v) => v.value).filter(Boolean) as string[];
    setTypeFilter(types);
  }, []);

  const handleSelectMetric = useCallback(
    (metric: MetricMetadata) => {
      onSelectMetric(metric.name);
      onClose();
    },
    [onSelectMetric, onClose]
  );

  const handleRowClick = useCallback(
    (metric: MetricMetadata) => {
      handleSelectMetric(metric);
    },
    [handleSelectMetric]
  );

  const handleTableClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const row = target.closest('tbody tr');
      if (row) {
        const rowIndex = Array.from(row.parentElement?.children || []).indexOf(row);
        if (rowIndex >= 0 && rowIndex < PAGE_SIZE) {
          const rowId = row.querySelector('td span')?.textContent;
          const metric = filteredMetrics.find((m) => m.name === rowId);
          if (metric) {
            handleRowClick(metric);
          }
        }
      }
    },
    [filteredMetrics, handleRowClick]
  );

  const columns = useMemo(
    (): MetricMetadataColumn[] => [
      {
        id: 'name',
        header: 'Name',
        cell: ({ row }: CellProps<MetricMetadata>) => <span className={styles.nameCell}>{row.original.name}</span>,
        sortType: 'alphanumeric',
      },
      {
        id: 'type',
        header: 'Type',
        cell: ({ row }: CellProps<MetricMetadata>) => <span className={styles.typeCell}>{row.original.type}</span>,
      },
      {
        id: 'help',
        header: 'Description',
        cell: ({ row }: CellProps<MetricMetadata>) => (
          <span className={styles.descriptionCell}>{row.original.help}</span>
        ),
      },
    ],
    [styles.descriptionCell, styles.nameCell, styles.typeCell]
  );

  const getRowId = useCallback((row: MetricMetadata, index: number) => {
    return `${row.name}-${row.type}-${index}`;
  }, []);

  return (
    <Modal
      title="Metrics Explorer"
      isOpen={isOpen}
      onDismiss={onClose}
      className={styles.modal}
      contentClassName={styles.modalContent}
    >
      <div className={styles.content}>
        <div className={styles.filters}>
          <Input placeholder="Filter by name" onChange={handleNameFilterChange} className={styles.nameFilter} />
          <MultiSelect
            options={typeOptions}
            value={typeFilter}
            onChange={handleTypeFilterChange}
            placeholder="Filter by type"
            className={styles.typeFilter}
          />
        </div>

        {selectedMetric && (
          <div className={styles.selectedMetric}>
            Current metric: <strong>{selectedMetric}</strong>
          </div>
        )}

        {isLoading && (
          <div className={styles.centered}>
            <Spinner />
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        {!isLoading && !error && (
          <div className={styles.tableContainer}>
            {filteredMetrics.length === 0 ? (
              <div className={styles.centered}>No metrics found</div>
            ) : (
              <div className={styles.tableWrapper} onClick={handleTableClick}>
                <InteractiveTable
                  className={styles.table}
                  columns={columns}
                  data={filteredMetrics}
                  getRowId={getRowId}
                  pageSize={PAGE_SIZE}
                />
              </div>
            )}

            <div className={styles.resultsCount}>Total: {filteredMetrics.length} metrics</div>
          </div>
        )}
      </div>
    </Modal>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  modal: css({
    width: '90vw',
    maxWidth: '1500px',
    height: '85vh',
    maxHeight: '85vh',
  }),
  modalContent: css({
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
    minHeight: 0,
  }),
  content: css({
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: theme.spacing(2),
    overflow: 'hidden',
    minHeight: 0,
  }),
  filters: css({
    display: 'flex',
    gap: theme.spacing(1),
    flexShrink: 0,
    padding: theme.spacing(1),
  }),
  nameFilter: css({
    flex: '0 0 60%',
    maxWidth: 'calc(60% - 4px)',
  }),
  typeFilter: css({
    flex: '0 0 40%',
    maxWidth: 'calc(40% - 4px)',
  }),
  selectedMetric: css({
    margin: theme.spacing(0, 1),
    padding: theme.spacing(1),
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    flexShrink: 0,
  }),
  centered: css({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(4),
    flex: 1,
  }),
  error: css({
    color: theme.colors.error.text,
    padding: theme.spacing(2),
    textAlign: 'center',
    flexShrink: 0,
  }),
  tableContainer: css({
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 0,
  }),
  tableWrapper: css({
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }),
  table: css({
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(0, 1),
    flex: 1,
    minHeight: 0,
    gap: 0,
    overflow: 'auto',
    '& table': {
      width: '100%',
      borderCollapse: 'collapse',
    },
    '& thead': {
      position: 'sticky',
      top: 0,
      zIndex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    '& thead tr, & tbody tr': {
      display: 'table',
      width: '100%',
      tableLayout: 'fixed',
    },
    '& th button': {
      paddingRight: theme.spacing(1),
    },
    '& th:nth-child(1), & td:nth-child(1)': {
      width: '50%',
    },
    '& th:nth-child(2), & td:nth-child(2)': {
      width: '10%',
      textAlign: 'left',
    },
    '& th:nth-child(3), & td:nth-child(3)': {
      width: '39%', // use 39% to account for scrollbar and align column with the type filter
      textAlign: 'left',
    },
    '& tbody tr': {
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: theme.colors.action.hover,
      },
    },
  }),
  nameCell: css({
    display: 'block',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  }),
  typeCell: css({
    display: 'block',
    textAlign: 'left',
  }),
  descriptionCell: css({
    display: 'block',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    textAlign: 'left',
  }),
  resultsCount: css({
    textAlign: 'center',
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    padding: theme.spacing(1, 0),
    flexShrink: 0,
  }),
});

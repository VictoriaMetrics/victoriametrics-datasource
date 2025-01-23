import { map } from "lodash";

import { SelectableValue } from "@grafana/data";

export const DATASOURCE_TYPE = 'victoriametrics-metrics-datasource'
export const ANNOTATION_QUERY_STEP_DEFAULT = '60s';

export const FORMAT_OPTIONS: Array<SelectableValue<string>> = [
    { label: 'Time series', value: 'time_series' },
    { label: 'Table', value: 'table' },
    { label: 'Heatmap', value: 'heatmap' },
];

export const INTERVAL_FACTOR_OPTIONS: Array<SelectableValue<number>> = map([1, 2, 3, 4, 5, 10], (value: number) => ({
    value,
    label: '1/' + value,
}))

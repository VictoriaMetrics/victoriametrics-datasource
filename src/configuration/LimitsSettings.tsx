import React, { SyntheticEvent } from 'react';

import {
  DataSourcePluginOptionsEditorProps,
  SelectableValue,
} from '@grafana/data';
import {
  Button,
  EventsWithValidation,
  InlineField,
  LegacyForms,
  regexValidation
} from '@grafana/ui';

import { LimitMetrics, PromOptions } from '../types';

import { getValueFromEventItem } from "./PromSettings";

const { Input } = LegacyForms;

const limitsSettingsValidationEvents = {
  [EventsWithValidation.onBlur]: [
    regexValidation(
      /^$|^\d+$/,
      'Value is not valid, you can use number'
    ),
  ],
};

const limitFields = [
  {
    label: "Max series",
    tooltip: <><code>-search.maxSeries</code> limits the number of time series, which may be returned from <a href="https://prometheus.io/docs/prometheus/latest/querying/api/#finding-series-by-label-matchers" target="_blank" rel="noreferrer">/api/v1/series</a>. This endpoint is used mostly by Grafana for auto-completion of metric names, label names and label values. Queries to this endpoint may take big amounts of CPU time and memory when the database contains big number of unique time series because of <a href="https://docs.victoriametrics.com/FAQ.html#what-is-high-churn-rate" target="_blank" rel="noreferrer">high churn rate</a>. In this case it might be useful to set the <code>-search.maxSeries</code> to quite low value in order limit CPU and memory usage.</>,
    placeholder: "",
    key: "maxSeries" as keyof LimitMetrics
  },
  {
    label: "Max tag values",
    tooltip: <><code>-search.maxTagValues</code> limits the number of items, which may be returned from <a href="https://prometheus.io/docs/prometheus/latest/querying/api/#querying-label-values" target="_blank" rel="noreferrer">/api/v1/label/.../values</a>. This endpoint is used mostly by Grafana for auto-completion of label values. Queries to this endpoint may take big amounts of CPU time and memory when the database contains big number of unique time series because of <a href="https://docs.victoriametrics.com/FAQ.html#what-is-high-churn-rate" target="_blank" rel="noreferrer">high churn rate</a>. In this case it might be useful to set the <code>-search.maxTagValues</code> to quite low value in order to limit CPU and memory usage.</>,
    placeholder: "",
    key: "maxTagValues" as keyof LimitMetrics
  },
  {
    label: "Max tag keys",
    tooltip: <><code>-search.maxTagKeys</code> limits the number of items, which may be returned from <a href="https://prometheus.io/docs/prometheus/latest/querying/api/#getting-label-names" target="_blank" rel="noreferrer">/api/v1/labels</a>. This endpoint is used mostly by Grafana for auto-completion of label names. Queries to this endpoint may take big amounts of CPU time and memory when the database contains big number of unique time series because of <a href="https://docs.victoriametrics.com/FAQ.html#what-is-high-churn-rate" target="_blank" rel="noreferrer">high churn rate</a>. In this case it might be useful to set the <code>Max tag keys</code> to quite low value in order to limit CPU and memory usage of the datasource.</>,
    placeholder: "",
    key: "maxTagKeys" as keyof LimitMetrics
  }
]

type Props = Pick<DataSourcePluginOptionsEditorProps<PromOptions>, 'options' | 'onOptionsChange'>;

export const LimitsSettings = (props: Props) => {
  const { options, onOptionsChange } = props;

  return (
    <>
      <h3 className="page-heading">Limits</h3>
      <p className="text-help">Leave the field blank or set the value to <code>0</code> to remove the limit</p>
      <div className="gf-form-group">
        {limitFields.map((field) => (
          <div className="gf-form" key={field.key}>
            <InlineField
              label={field.label}
              labelWidth={28}
              tooltip={field.tooltip}
              interactive={true}
            >
              <Input
                className="width-6"
                value={`${options.jsonData?.limitMetrics?.[field.key] || ''}`}
                onChange={onChangeHandler(field.key, options, onOptionsChange)}
                spellCheck={false}
                placeholder={field.placeholder}
                validationEvents={limitsSettingsValidationEvents}
              />
            </InlineField>
          </div>
        ))}
        <a
          className="text-link"
          target="_blank"
          href={"https://docs.victoriametrics.com/#prometheus-querying-api-enhancements"}
          rel="noreferrer"
        >
          <Button
            variant={'secondary'}
            fill={"text"}
            icon={"book"}
            size={"sm"}
          >
            API Limits Docs
          </Button>
        </a>
      </div>
    </>
  )
};

const onChangeHandler =
  (key: keyof LimitMetrics, options: Props['options'], onOptionsChange: Props['onOptionsChange']) =>
    (eventItem: SyntheticEvent<HTMLInputElement> | SelectableValue<string>) => {
      onOptionsChange({
        ...options,
        jsonData: {
          ...options.jsonData,
          limitMetrics: {
            ...options.jsonData.limitMetrics,
            [key]: getValueFromEventItem(eventItem),
          }
        },
      });
    };

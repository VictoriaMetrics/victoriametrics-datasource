import React, { SyntheticEvent } from 'react';

import {
  DataSourcePluginOptionsEditorProps,
  SelectableValue,
} from '@grafana/data';
import {
  Button,
  EventsWithValidation,
  LegacyForms,
  regexValidation
} from '@grafana/ui';

import { LimitMetrics, PromOptions } from '../types';

import { getValueFromEventItem } from "./PromSettings";

const { Input, FormField } = LegacyForms;

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
    tooltip: <>limits the number of time series, which may be returned from <code>/api/v1/series</code></>,
    placeholder: "",
    key: "maxSeries" as keyof LimitMetrics
  },
  {
    label: "Max tag values",
    tooltip: <>limits the number of items, which may be returned from <code>/api/v1/label/…/values</code></>,
    placeholder: "",
    key: "maxTagValues" as keyof LimitMetrics
  },
  {
    label: "Max tag keys",
    tooltip: <>limits the number of items, which may be returned from <code>/api/v1/labels</code></>,
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
            <FormField
              label={field.label}
              labelWidth={14}
              tooltip={field.tooltip}
              inputEl={
                <Input
                  className="width-6"
                  value={`${options.jsonData?.limitMetrics?.[field.key] || ''}`}
                  onChange={onChangeHandler(field.key, options, onOptionsChange)}
                  spellCheck={false}
                  placeholder={field.placeholder}
                  validationEvents={limitsSettingsValidationEvents}
                />
              }
            />
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

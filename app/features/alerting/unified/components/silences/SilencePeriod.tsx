import { css } from '@emotion/css';
import { Field, TimeRangeInput, useStyles } from 'packages/grafana-ui/src';
import React from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { dateTime, GrafanaTheme } from '@grafana/data';

import { SilenceFormFields } from '../../types/silence-form';

export const SilencePeriod = () => {
  const { control, getValues } = useFormContext<SilenceFormFields>();
  const styles = useStyles(getStyles);
  const {
    field: { onChange: onChangeStartsAt, value: startsAt },
    fieldState: { invalid: startsAtInvalid },
  } = useController({
    name: 'startsAt',
    control,
    rules: {
      validate: (value) => getValues().endsAt > value,
    },
  });

  const {
    field: { onChange: onChangeEndsAt, value: endsAt },
    fieldState: { invalid: endsAtInvalid },
  } = useController({
    name: 'endsAt',
    control,
    rules: {
      validate: (value) => getValues().startsAt < value,
    },
  });

  const {
    field: { onChange: onChangeTimeZone, value: timeZone },
  } = useController({
    name: 'timeZone',
    control,
  });

  const invalid = startsAtInvalid || endsAtInvalid;

  const from = dateTime(startsAt);
  const to = dateTime(endsAt);

  return (
    <Field
      className={styles.timeRange}
      label="Silence start and end"
      error={invalid ? 'To is before or the same as from' : ''}
      invalid={invalid}
    >
      <TimeRangeInput
        value={{
          from,
          to,
          raw: {
            from,
            to,
          },
        }}
        timeZone={timeZone}
        onChange={(newValue) => {
          onChangeStartsAt(dateTime(newValue.from));
          onChangeEndsAt(dateTime(newValue.to));
        }}
        onChangeTimeZone={(newValue) => onChangeTimeZone(newValue)}
        hideTimeZone={false}
        hideQuickRanges={true}
        placeholder={'Select time range'}
      />
    </Field>
  );
};

const getStyles = (theme: GrafanaTheme) => ({
  timeRange: css`
    width: 400px;
  `,
});

import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2, TimeRange } from '@grafana/data';
import { Field, useStyles2 } from '@grafana/ui';

interface TimeRangeFieldProps {
  timeRange: TimeRange;
}

export const TimeRangeField: React.FC<TimeRangeFieldProps> = ({ timeRange }) => {
  const styles = useStyles2(getStyles);
  return (
    <Field label='Time range'>
      <div className={styles.timeRange}>
        {timeRange.from.format('YYYY-MM-DD HH:mm:ss')} — {timeRange.to.format('YYYY-MM-DD HH:mm:ss')}
      </div>
    </Field>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  timeRange: css({
    padding: theme.spacing(1),
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    fontFamily: theme.typography.fontFamilyMonospace,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
});

import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Field, useStyles2 } from '@grafana/ui';

import { MetricSelector } from './utils';

interface SelectorsFieldProps {
  selectors: MetricSelector[];
  selectedSelectors: string[];
  onToggle: (selector: string) => void;
}

export const SelectorsField: React.FC<SelectorsFieldProps> = ({ selectors, selectedSelectors, onToggle }) => {
  const styles = useStyles2(getStyles);

  if (selectors.length === 0) {
    return null;
  }

  if (selectors.length === 1) {
    return (
      <Field label='Metric'>
        <div className={styles.metricSelector}>{selectors[0].selector}</div>
      </Field>
    );
  }

  return (
    <Field label='Select metrics to export'>
      <div className={styles.selectorList}>
        {selectors.map((s) => (
          <label key={s.selector} className={styles.selectorOption}>
            <input
              type='checkbox'
              value={s.selector}
              checked={selectedSelectors.includes(s.selector)}
              onChange={() => onToggle(s.selector)}
            />
            <span className={styles.selectorLabel}>{s.selector}</span>
          </label>
        ))}
      </div>
    </Field>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const infoBox = css({
    padding: theme.spacing(1),
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    fontFamily: theme.typography.fontFamilyMonospace,
    fontSize: theme.typography.bodySmall.fontSize,
  });

  return {
    metricSelector: css(infoBox, {
      wordBreak: 'break-all',
    }),
    selectorList: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
    }),
    selectorOption: css({
      display: 'flex',
      alignItems: 'flex-start',
      gap: theme.spacing(1),
      cursor: 'pointer',
      padding: theme.spacing(0.5, 1),
      borderRadius: theme.shape.radius.default,
      '&:hover': {
        backgroundColor: theme.colors.action.hover,
      },
    }),
    selectorLabel: css({
      fontFamily: theme.typography.fontFamilyMonospace,
      fontSize: theme.typography.bodySmall.fontSize,
      wordBreak: 'break-all',
    }),
  };
};

import { css } from '@emotion/css';
import { IconButton, UnitPicker, useStyles2 } from 'packages/grafana-ui/src';
import React from 'react';

import { FieldConfigEditorProps, GrafanaTheme2, UnitFieldConfigSettings } from '@grafana/data';

type Props = FieldConfigEditorProps<string, UnitFieldConfigSettings>;

export function UnitValueEditor({ value, onChange, item }: Props) {
  const styles = useStyles2(getStyles);
  if (item?.settings?.isClearable && value != null) {
    return (
      <div className={styles.wrapper}>
        <span className={styles.first}>
          <UnitPicker value={value} onChange={onChange} />
        </span>
        <IconButton ariaLabel="clear unit selection" name="times" onClick={() => onChange(undefined)} />
      </div>
    );
  }
  return <UnitPicker value={value} onChange={onChange} />;
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css`
    width: 100%;
    display: flex;
    flex-direction: rows;
    align-items: center;
  `,
  first: css`
    margin-right: 8px;
    flex-grow: 2;
  `,
});

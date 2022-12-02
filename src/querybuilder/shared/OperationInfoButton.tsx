// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-11: switch imports 'packages/grafana-ui/src' to 'components/QueryEditor'
// A detailed history of changes can be seen here - https://github.com/VictoriaMetrics/grafana-datasource
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { css } from '@emotion/css';
import React, { useState } from 'react';
import { usePopperTooltip } from 'react-popper-tooltip';

import { GrafanaTheme2, renderMarkdown } from '@grafana/data';
import { Button, Portal, useStyles2 } from '@grafana/ui';

import { FlexItem } from '../../components/QueryEditor';

import { QueryBuilderOperation, QueryBuilderOperationDef } from './types';

export interface Props {
  operation: QueryBuilderOperation;
  def: QueryBuilderOperationDef;
}

export const OperationInfoButton = React.memo<Props>(({ def, operation }) => {
  const styles = useStyles2(getStyles);
  const [show, setShow] = useState(false);
  const { getTooltipProps, setTooltipRef, setTriggerRef, visible } = usePopperTooltip({
    placement: 'top',
    visible: show,
    offset: [0, 16],
    onVisibleChange: setShow,
    interactive: true,
    trigger: ['click'],
  });

  return (
    <>
      <Button
        title="Click to show description"
        ref={setTriggerRef}
        icon="info-circle"
        size="sm"
        variant="secondary"
        fill="text"
      />
      {visible && (
        <Portal>
          <div ref={setTooltipRef} {...getTooltipProps()} className={styles.docBox}>
            <div className={styles.docBoxHeader}>
              <span>{def.renderer(operation, def, '<expr>')}</span>
              <FlexItem grow={1} />
              <Button
                icon="times"
                onClick={() => setShow(false)}
                fill="text"
                variant="secondary"
                title="Remove operation"
              />
            </div>
            <div
              className={styles.docBoxBody}
              dangerouslySetInnerHTML={{ __html: getOperationDocs(def, operation) }}
            ></div>
          </div>
        </Portal>
      )}
    </>
  );
});

OperationInfoButton.displayName = 'OperationDocs';

const getStyles = (theme: GrafanaTheme2) => {
  return {
    docBox: css({
      overflow: 'hidden',
      background: theme.colors.background.primary,
      border: `1px solid ${theme.colors.border.strong}`,
      boxShadow: theme.shadows.z3,
      maxWidth: '600px',
      padding: theme.spacing(1),
      borderRadius: theme.shape.borderRadius(),
      zIndex: theme.zIndex.tooltip,
    }),
    docBoxHeader: css({
      fontSize: theme.typography.h5.fontSize,
      fontFamily: theme.typography.fontFamilyMonospace,
      paddingBottom: theme.spacing(1),
      display: 'flex',
      alignItems: 'center',
    }),
    docBoxBody: css({
      // The markdown paragraph has a marginBottom this removes it
      marginBottom: theme.spacing(-1),
      color: theme.colors.text.secondary,
    }),
    signature: css({
      fontSize: theme.typography.bodySmall.fontSize,
      fontFamily: theme.typography.fontFamilyMonospace,
    }),
    dropdown: css({
      opacity: 0,
      color: theme.colors.text.secondary,
    }),
  };
};
function getOperationDocs(def: QueryBuilderOperationDef, op: QueryBuilderOperation): string {
  return renderMarkdown(def.explainHandler ? def.explainHandler(op, def) : def.documentation ?? 'no docs');
}

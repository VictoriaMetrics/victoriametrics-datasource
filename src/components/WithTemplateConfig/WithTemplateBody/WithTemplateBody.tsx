import React, { FC } from 'react'

import { Badge, Button, ConfirmModal, useStyles2 } from '@grafana/ui';

import { PrometheusDatasource } from '../../../datasource';
import { PromQuery } from '../../../types';
import TemplateEditor from '../TemplateEditor/TemplateEditor';
import useSaveWithTemplate from '../hooks/useSaveWithTemplate';

import getStyles from './style';

interface Props {
  value: string;
  onValueChange: (value: string) => void;
  datasource: PrometheusDatasource;
  dashboardUID: string;
  query: PromQuery;
  onQueryChange: (query: PromQuery) => void;
  onTemplateSave?: (expr: string) => void;
  onDraftReset: () => void;
  handleClose: () => void;
}

const WithTemplateBody: FC<Props> = ({ value, onValueChange, datasource, dashboardUID, query, onQueryChange, onTemplateSave, onDraftReset, handleClose }) => {
  const styles = useStyles2(getStyles);

  const {
    validateResult,
    isLoading,
    saveError,
    showConfirm,
    handleSaveClick,
    handleConfirmedSave,
    dismissConfirm,
  } = useSaveWithTemplate({ datasource, dashboardUID, query, onQueryChange, onTemplateSave, onDraftReset, handleClose })

  return (
    <div className={styles.body}>
      <TemplateEditor
        initialValue={value}
        datasource={datasource}
        onChange={onValueChange}
      />
      <Badge
        icon={validateResult.icon || 'info'}
        color={validateResult.color || 'blue'}
        text={validateResult.error || validateResult.title}
      />
      {saveError && (
        <Badge
          icon='exclamation-triangle'
          color='red'
          text={saveError}
        />
      )}
      <div className={styles.button}>
        <a
          className='text-link'
          target='_blank'
          href={'https://github.com/VictoriaMetrics/grafana-datasource#how-to-use-with-templates'}
          rel='noreferrer'
        >
          <Button
            variant={'secondary'}
            fill={'text'}
            icon={'book'}
            size={'sm'}
          >
            How it works?
          </Button>
        </a>
        <Button
          variant={'success'}
          onClick={() => handleSaveClick(value)}
          disabled={isLoading}
        >
          Save
        </Button>
      </div>
      <ConfirmModal
        isOpen={showConfirm}
        title='Save WITH template'
        body='This will save the dashboard to store the WITH template as a dashboard variable. If you have unsaved dashboard changes, please save them first.'
        confirmText='Save'
        onConfirm={handleConfirmedSave}
        onDismiss={dismissConfirm}
      />
    </div>
  )
}

export default WithTemplateBody;

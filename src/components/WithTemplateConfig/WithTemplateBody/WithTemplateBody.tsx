import React, { FC, useCallback, useEffect, useState } from 'react'

import { Badge, Button, useStyles2 } from '@grafana/ui';

import { PrometheusDatasource } from '../../../datasource';
import TemplateEditor from '../TemplateEditor/TemplateEditor';
import useValidateExpr from '../hooks/useValidateExpr';

import getStyles from './style';

interface Props {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  datasource: PrometheusDatasource;
  handleClose: () => void;
}

const WithTemplateBody: FC<Props> = ({ value, onChange, datasource, handleClose }) => {
  const styles = useStyles2(getStyles);

  const { validateResult, isValidExpr } = useValidateExpr(datasource.uid)

  const [editorValue, setEditorValue] = useState(value || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = useCallback(async () => {
    setIsLoading(true)
    const isValid = await isValidExpr(editorValue)
    if (!isValid) {
      setIsLoading(false)
      return
    }
    onChange(editorValue || undefined)
    setIsLoading(false)
    handleClose()
  }, [editorValue, isValidExpr, onChange, handleClose])

  useEffect(() => {
    editorValue && isValidExpr(editorValue)
  }, [editorValue, isValidExpr])

  useEffect(() => {
    setEditorValue(value || '')
  }, [value])

  return (
    <div className={styles.body}>
      <TemplateEditor
        initialValue={editorValue}
        datasource={datasource}
        onChange={setEditorValue}
      />
      <Badge
        icon={validateResult.icon || 'info'}
        color={validateResult.color || 'blue'}
        text={validateResult.error || validateResult.title}
      />
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
          onClick={handleSave}
          disabled={isLoading}
        >
          Save
        </Button>
      </div>
    </div>
  )
}

export default WithTemplateBody;

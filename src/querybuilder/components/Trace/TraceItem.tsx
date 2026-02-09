import React, { useEffect, useState } from 'react';

import { Button, Icon, Modal, useStyles2 } from '@grafana/ui';

import { Stack } from '../../../components/QueryEditor';

import NestedNav from './NestedNav/NestedNav';
import Trace from './Trace';
import getStyles from './style'


export const TraceItem = ({ trace, id, queryExpr }: { trace: Trace, id: number, queryExpr: string }) => {
  const styles = useStyles2(getStyles);
  const [openModal, setOpenModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')

  const handleOpenModal = () => {
    setOpenModal(true)
  }

  const handleCloseModal = () => {
    setOpenModal(false)
  }

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null
    if (copied) {
      timeout = setTimeout(() => {
        setCopied(false)
      }, 2000)
    }

    return () => {
      if (timeout) {
        clearInterval(timeout)
      }
    }
  }, [copied]);

  const handleCopyToClipboard = () => {
    if (!trace || copied) {
      return
    }
    try {
      navigator.clipboard.writeText(trace.JSON)
      setCopied(true)
    } catch (e) {
      console.error('Failed to copy: ', e);
      if (e instanceof Error) {
        setCopyError(e.message)
      }
    }
  }

  return (
    <Stack gap={0} direction='column' key={id}>
      <div className={styles.header}>
        <span>Trace for <b>{queryExpr}</b></span>
        <Button
          variant='secondary'
          size='sm'
          onClick={handleOpenModal}
        >
          Show JSON
        </Button>
      </div>
      <nav>
        <NestedNav
          trace={trace}
          totalMsec={trace.duration}
        />
      </nav>
      <Modal
        title={`Trace for ${queryExpr}`}
        isOpen={openModal}
        closeOnEscape={true}
        onDismiss={handleCloseModal}
      >
        <div>
          <pre className={styles.json}>
            <code lang='json'>{trace.JSON}</code>
          </pre>
          <Modal.ButtonRow>
            {copyError && (<div className={styles.error}>
              <Icon name={'exclamation-triangle'} size='sm' />
              <span>{copyError}</span>
            </div>)}
            <Button
              variant={copied ? 'success' : 'primary'}
              size='sm'
              onClick={handleCopyToClipboard}
              icon={copied ? 'check' : 'copy'}
            >
              {copied ? 'Copied' : 'Copy JSON'}
            </Button>
          </Modal.ButtonRow>
        </div>
      </Modal>
    </Stack>
  );
}

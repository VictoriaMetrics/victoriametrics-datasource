import React, { useEffect, useState } from 'react';

import { DataQueryRequest, DataQueryResponse, PanelData } from "@grafana/data";
import { Button, Icon, Modal, useStyles2 } from "@grafana/ui";

import { Stack } from "../../../components/QueryEditor";
import { PrometheusDatasource } from "../../../datasource";
import { PromQuery, TracingData } from "../../../types";

import NestedNav from "./NestedNav/NestedNav";
import Trace from "./Trace";
import getStyles from './style'

interface Props {
  query: PromQuery;
  datasource: PrometheusDatasource;
  data?: PanelData;
}

export const TraceView = React.memo<Props>(({ query, data, datasource }) => {
  const [trace, setTrace] = useState<Trace | null>(null)
  const [openModal, setOpenModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState("")
  const styles = useStyles2(getStyles);

  const handleOpenModal = () => {
    setOpenModal(true)
  }

  const handleCloseModal = () => {
    setOpenModal(false)
  }

  const handleCopyToClipboard = () => {
    if (!trace || copied) {return}
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
  }, [copied])

  useEffect(() => {
    const fetch = async () => {
      if (!data?.request) {
        setTrace(null)
        return
      }

      const targets = data?.request?.targets || [];
      if (!targets.find(target => target.trace)) {
        setTrace(null)
        return
      }

      const observable = datasource.query(data.request as DataQueryRequest<PromQuery>)
      observable.subscribe((val: DataQueryResponse) => {
        const traceData = val?.data?.find((item) => item.refId === query.refId && item.meta.custom)?.meta?.custom as TracingData;
        if (traceData) {
          setTrace(new Trace(traceData, query.expr))
        } else {
          setTrace(null)
        }
      })
    }
    fetch()
  }, [data, datasource, query])

  if (!trace) {
    return null
  }

  return (
    <Stack gap={0} direction="column">
      <div className={styles.header}>
        <span>Trace for <b>{query.expr}</b></span>
        <Button
          variant="secondary"
          size="sm"
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
        title={`Trace for ${query.expr}`}
        isOpen={openModal}
        closeOnEscape={true}
        onDismiss={handleCloseModal}
      >
        <div>
          <pre className={styles.json}>
            <code lang="json">{trace.JSON}</code>
          </pre>
          <Modal.ButtonRow>
            {copyError && (<div className={styles.error}>
              <Icon name={"exclamation-triangle"} size="sm"/>
              <span>{copyError}</span>
            </div>)}
            <Button
              variant={copied ? "success" : "primary"}
              size="sm"
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
});

TraceView.displayName = 'TraceView';

import React, { FC, useState } from 'react'

import { DataSourceApi } from "@grafana/data";
import { Button, Modal } from "@grafana/ui";

import { PrometheusDatasource } from "../../../datasource";
import TemplateEditor from "../TemplateEditor/TemplateEditor";

interface Props {
  value: string;
  datasource: PrometheusDatasource
}

const WithTemplatePreview: FC<Props> = ({ value, datasource }) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const handleClose = () => setShowTemplates(false);
  const handleOpen = () => setShowTemplates(true);

  return (
   <>
     <Button
       variant={'secondary'}
       fill={"outline"}
       size="sm"
       onClick={handleOpen}
     >
       WITH templates
     </Button>
     <Modal
       title={`WITH templates`}
       isOpen={showTemplates}
       closeOnEscape={true}
       onDismiss={handleClose}
     >
       <TemplateEditor value={value} datasource={datasource as DataSourceApi} readOnly/>
     </Modal>
   </>
  )
}

export default WithTemplatePreview;

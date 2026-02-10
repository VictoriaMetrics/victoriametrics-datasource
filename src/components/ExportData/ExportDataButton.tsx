import React, { useState, memo } from 'react';

import { IconButton } from '@grafana/ui';

import { ExportDataModal } from './ExportDataModal';
import { ExportDataButtonProps } from './types';

export const ExportDataButton: React.FC<ExportDataButtonProps> = memo(({ datasource, query, panelData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isDisabled = !query.expr?.trim();

  return (
    <>
      <IconButton
        name='download-alt'
        tooltip='Export data'
        disabled={isDisabled}
        onClick={() => setIsModalOpen(true)}
      />
      <ExportDataModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        datasource={datasource}
        query={query}
        panelData={panelData}
      />
    </>
  );
});

ExportDataButton.displayName = 'ExportDataButton';
